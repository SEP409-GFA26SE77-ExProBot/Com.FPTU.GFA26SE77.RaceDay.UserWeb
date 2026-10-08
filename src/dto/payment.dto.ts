// DTOs matching the RaceDay Payment API response shapes

export interface CheckoutDto {
  registrationId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CheckoutResponseDto {
  paymentId: string;
  checkoutUrl: string;
  amount?: number;
  description?: string;
  orderCode?: number;
}

export interface PaymentDto {
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
