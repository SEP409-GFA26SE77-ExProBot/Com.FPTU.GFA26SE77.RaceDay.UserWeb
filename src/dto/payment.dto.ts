// DTOs matching the RaceDay Payment API response shapes

export interface CheckoutDto {
  registrationId: string;
  returnUrl: string;
  cancelUrl: string;
}

/** Fields VietQR để FE vẽ QR + CK chung 1 khung (không dùng tab PayOS). */
export interface VietQrFields {
  qrCode?: string;
  accountNumber?: string;
  accountName?: string;
  bin?: string;
  transferDescription?: string;
}

export interface CheckoutResponseDto extends VietQrFields {
  paymentId: string;
  checkoutUrl: string;
  amount?: number;
  description?: string;
  orderCode?: number;
  status?: string;
}

export interface PaymentDto extends VietQrFields {
  id: string;
  registrationId: string;
  userId: string;
  amount: number;
  currency?: string;
  status: string; // pending | paid | failed | cancelled | expired | refunded
  checkoutUrl?: string;
  orderCode?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
  // Populated by BE join
  eventName?: string;
  distanceName?: string;
  fullName?: string;
}

export interface PaymentStatusDto {
  payOsMode: "mock" | "live";
}
