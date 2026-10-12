import api from "@/config/axios";
import {
  CheckoutDto,
  CheckoutResponseDto,
  PaymentDto,
  PaymentStatusDto,
} from "@/dto/payment.dto";

const PAYMENT_API = "api/v1/payment";

type RawCheckout = PaymentDto & {
  paymentId?: string;
  id?: string;
  transferDescription?: string;
  description?: string;
};

function normalizeCheckout(raw: RawCheckout): CheckoutResponseDto {
  const paymentId = String(raw.paymentId || raw.id || "");
  return {
    paymentId,
    checkoutUrl: raw.checkoutUrl || "",
    amount: raw.amount,
    description: raw.description,
    orderCode: raw.orderCode,
    status: raw.status,
    qrCode: raw.qrCode,
    accountNumber: raw.accountNumber,
    accountName: raw.accountName,
    bin: raw.bin,
    transferDescription: raw.transferDescription || raw.description,
  };
}

// ─── Public ────────────────────────────────────────────

/** Get PayOS mode (mock | live) */
export async function getPaymentStatus(): Promise<PaymentStatusDto> {
  return api.get(`${PAYMENT_API}/status`);
}

// ─── Authenticated ─────────────────────────────────────

/** Create checkout link for a pending_payment registration */
export async function createCheckout(data: CheckoutDto): Promise<CheckoutResponseDto> {
  const raw = (await api.post(`${PAYMENT_API}/checkout`, data)) as RawCheckout;
  return normalizeCheckout(raw);
}

/** Get my payment history */
export async function getMyPayments(): Promise<PaymentDto[]> {
  return api.get(`${PAYMENT_API}/mine`);
}

/** Get payment detail */
export async function getPaymentById(paymentId: string): Promise<PaymentDto> {
  return api.get(`${PAYMENT_API}/${paymentId}`);
}

/** Sync payment status from PayOS (after returnUrl redirect) */
export async function syncPayment(paymentId: string): Promise<PaymentDto> {
  return api.post(`${PAYMENT_API}/${paymentId}/sync`);
}

// ─── Mock (dev only) ───────────────────────────────────

/** Simulate a successful payment (mock mode) */
export async function mockPay(paymentId: string): Promise<void> {
  return api.post(`${PAYMENT_API}/mock-checkout/${paymentId}/pay`);
}

/** Simulate payment cancellation (mock mode) */
export async function mockCancel(paymentId: string): Promise<void> {
  return api.post(`${PAYMENT_API}/mock-checkout/${paymentId}/cancel`);
}
