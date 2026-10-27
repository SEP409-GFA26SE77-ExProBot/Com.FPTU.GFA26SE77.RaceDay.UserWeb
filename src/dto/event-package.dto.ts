// DTOs khớp Event Package API (camelCase từ ASP.NET)

/** GET api/v1/event/packages/catalog */
export interface PackageDurationOption {
  /** Tên hiển thị do Admin cấu hình */
  name?: string;
  months: number;
  price: number;
}

export interface PackageCapacityOption {
  /** Tên hiển thị do Admin cấu hình */
  name?: string;
  maxParticipants: number;
  addOnFee: number;
}

/** Mã KM do Admin hệ thống tạo — Active + chưa hết hạn */
export interface PackagePromoCodeInfo {
  code: string;
  /** 0–1, vd 0.1 = 10% */
  percentOff: number;
  expiresAtUtc?: string | null;
}

export interface PackageCatalogDto {
  durations: PackageDurationOption[];
  capacities: PackageCapacityOption[];
  promoCodes: PackagePromoCodeInfo[];
}

/** POST api/v1/event/organizer/packages/purchases */
export interface CreatePackagePurchaseRequest {
  orgName: string;
  orgIntro: string;
  orgAddress: string;
  invoiceInfo?: string;
  durationMonths: number;
  participantCap: number;
  promoCode?: string;
}

/** Response create / get purchase */
export interface PackagePurchaseDto {
  id: string;
  organizerUserId: string;
  orgName: string;
  orgIntro?: string | null;
  orgAddress?: string | null;
  invoiceInfo?: string | null;
  durationMonths: number;
  participantCap: number;
  promoCode?: string | null;
  basePrice: number;
  capacityFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  status: string;
  paymentId?: string | null;
  createdEventId?: string | null;
  packageExpiresAtUtc?: string | null;
  createdAtUtc: string;
}

export interface CreatePackageCheckoutRequest {
  packagePurchaseId: string;
  returnUrl: string;
  cancelUrl: string;
}
