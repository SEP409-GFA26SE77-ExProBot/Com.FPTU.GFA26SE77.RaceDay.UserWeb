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
  /** Số đã charge PayOS (= sau giảm giá) */
  amount?: number;
  listAmount?: number;
  discountAmount?: number;
  promoCode?: string | null;
  description?: string;
  orderCode?: number;
  status?: string;
}

export interface PaymentDto extends VietQrFields {
  id: string;
  registrationId?: string;
  referenceId?: string | null;
  purpose?: string;
  userId: string;
  /** Số đã thu / hoàn phải bám field này — không hoàn theo listAmount */
  amount: number;
  listAmount?: number | null;
  discountAmount?: number | null;
  promoCode?: string | null;
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
  eventId?: string;
  bibNumber?: string;
}

export interface PaymentStatusDto {
  payOsMode: "mock" | "live";
}
