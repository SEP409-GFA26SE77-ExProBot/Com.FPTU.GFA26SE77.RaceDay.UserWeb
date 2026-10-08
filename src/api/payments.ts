import api from "@/config/axios";
import {
  CheckoutDto,
  CheckoutResponseDto,
  PaymentDto,
  PaymentStatusDto,
} from "@/dto/payment.dto";

const PAYMENT_API = "api/v1/payment";

// ─── Public ────────────────────────────────────────────

/** Get PayOS mode (mock | live) */
export async function getPaymentStatus(): Promise<PaymentStatusDto> {
  return api.get(`${PAYMENT_API}/status`);
}

// ─── Authenticated ─────────────────────────────────────

/** Create checkout link for a pending_payment registration */
export async function createCheckout(data: CheckoutDto): Promise<CheckoutResponseDto> {
  return api.post(`${PAYMENT_API}/checkout`, data);
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
