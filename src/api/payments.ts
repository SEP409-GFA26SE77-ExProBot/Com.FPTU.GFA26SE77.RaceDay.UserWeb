import api from "@/config/axios";
import {
  CheckoutDto,
  CheckoutResponseDto,
  PaymentDto,
  PaymentStatusDto,
} from "@/dto/payment.dto";
import type { CreatePackageCheckoutRequest } from "@/dto/event-package.dto";

const PAYMENT_API = "api/v1/payment";

type RawCheckout = PaymentDto & {
  paymentId?: string;
  id?: string;
  transferDescription?: string;
  description?: string;
  listAmount?: number;
  discountAmount?: number;
  promoCode?: string | null;
};

function normalizeCheckout(raw: RawCheckout): CheckoutResponseDto {
  const paymentId = String(raw.paymentId || raw.id || "");
  return {
    paymentId,
    checkoutUrl: raw.checkoutUrl || "",
    amount: raw.amount,
    listAmount: raw.listAmount,
    discountAmount: raw.discountAmount,
    promoCode: raw.promoCode,
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
  try {
    // PayOS live có thể >15s; mock nhanh. Timeout riêng tránh axios mặc định → "Network Error".
    const raw = (await api.post(`${PAYMENT_API}/checkout`, data, {
      timeout: 45000,
    })) as RawCheckout;
    return normalizeCheckout(raw);
  } catch (e) {
    const err = e as { code?: string; message?: string; response?: unknown };
    if (!err.response) {
      const msg = (err.message || "").toLowerCase();
      if (err.code === "ECONNABORTED" || msg.includes("timeout")) {
        throw new Error(
          "Hết thời gian chờ PayOS. Kiểm tra API/Docker mạng, hoặc bật PayOS__UseMock=true."
        );
      }
      throw new Error(
        "Không kết nối được máy chủ thanh toán (API). Kiểm tra Docker :5080 còn chạy."
      );
    }
    throw e;
  }
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

/** Hủy payment đang pending (chủ đơn) */
export async function cancelPendingPayment(
  paymentId: string
): Promise<PaymentDto> {
  return api.post(`${PAYMENT_API}/${paymentId}/cancel`);
}

/** Create checkout for a package purchase (event organizer flow) */
export async function createPackageCheckout(
  data: CreatePackageCheckoutRequest
): Promise<CheckoutResponseDto> {
  const raw = (await api.post(
    `${PAYMENT_API}/checkout/package`,
    data
  )) as RawCheckout;
  return normalizeCheckout(raw);
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
