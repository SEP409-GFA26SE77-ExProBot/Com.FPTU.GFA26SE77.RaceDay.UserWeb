// DTOs matching the RaceDay Event API response shapes

export interface CoordinatesDto {
  lat: number;
  lng: number;
}

export interface DistanceLocationDto {
  name: string;
  lat: number;
  lng: number;
}

export interface EventDistanceDto {
  id: string;
  type: string;
  name: string;
  distanceKm: number;
  elevationGainM?: number;
  maxElevationM?: number;
  minElevationM?: number;
  capacity: number;
  price: number;
  currency: string;
  color?: string;
  /** Giờ xuất phát cự ly (HH:mm:ss) */
  startAt?: string | null;
  /** Giờ kết thúc / cutoff cự ly */
  endAt?: string | null;
  startLocation?: DistanceLocationDto;
  finishLocation?: DistanceLocationDto;
  checkpoints?: unknown[] | null;
  osrmWaypoints?: unknown | null;
  leafletPolyline?: unknown | null;
  geoJson?: unknown | null;
  // Computed / returned by BE
  registeredCount?: number;
}

/** ticketPricing JSON — ma trận phase × cự ly (key = tên cự ly) */
export interface TicketPricingPhaseDto {
  key: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  pricesByDistanceName: Record<string, number>;
}

export interface TicketPricingByDistanceDto {
  basePrice?: number;
  phases?: Array<{
    key?: string;
    name?: string;
    dateFrom?: string;
    dateTo?: string;
    price?: number;
  }>;
}

export interface TicketPricingDto {
  /** Legacy matrix phase × distance name */
  phases?: TicketPricingPhaseDto[];
  /** Format hồ sơ distances hiện tại */
  byDistanceName?: Record<string, TicketPricingByDistanceDto>;
}

export interface OrganizerInfoDto {
  name: string;
  email: string;
  phone: string;
  legalEntity?: string;
  website?: string;
  verified?: boolean;
  beneficiaryAccount?: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    branch?: string;
    swiftCode?: string;
    transferNote?: string;
  };
}

export interface EventDocumentDto {
  documentKey: string;
  title: string;
  fileName: string;
  fileUrl: string;
  required: boolean;
}

export interface RaceEventDto {
  id: string;
  name: string;
  tagline?: string;
  bannerImage?: string;
  location: string;
  coordinates?: CoordinatesDto;
  date: string;
  startTime?: string;
  /** Ngày kết thúc giải (yyyy-MM-dd) */
  endDate?: string | null;
  description?: string;
  totalRunners?: number;
  status: string;
  organizer?: OrganizerInfoDto;
  weather?: Record<string, unknown>;
  permitDocument?: unknown;
  ticketPricing?: Record<string, unknown>;
  merchandise?: Record<string, unknown>;
  rules?: Record<string, unknown>;
  rewards?: Record<string, unknown>;
  documents?: EventDocumentDto[];
  distances: EventDistanceDto[];
  organizerUserId?: string;
  /** Lý do từ chối hồ sơ giải (khi status = rejected) */
  rejectionReason?: string | null;
  /** Gói đã mua — quy mô VĐV khóa theo ParticipantCap gói */
  packagePurchaseId?: string | null;
  packageExpiresAtUtc?: string | null;
  registrationOpensAtUtc?: string | null;
  registrationClosesAtUtc?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface RaceEventListItemDto {
  id: string;
  name: string;
  tagline?: string;
  bannerImage?: string;
  location: string;
  date: string;
  endDate?: string | null;
  status: string;
  registrationOpensAtUtc?: string | null;
  totalRunners?: number;
  activeRunners?: number;
  /** Chip labels (tên cự ly) — trước đây từng là type mặt đường "road" */
  distanceTypes?: string[];
  /** Km thực tế từ list API — dùng filter bucket */
  distanceKms?: number[];
  /** Giá thấp nhất hiện tại (phase/base) — list API; dùng filter giá */
  minPrice?: number | null;
  organizerName?: string;
  distances?: EventDistanceDto[];
  organizer?: OrganizerInfoDto;
}

export interface CreateRegistrationDto {
  distanceId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  idNumber?: string;
  heightCm?: number;
  weightKg?: number;
  bloodType?: string;
  emergencyName: string;
  emergencyPhone: string;
  /** Ba/Mẹ | Chồng/Vợ | Anh/Chị/Em | Người thân | Bạn bè */
  emergencyRelation?: string;
  shirtType?: string;
  shirtSize?: string;
  shirtColor?: string;
  /** Tên in trên BIB */
  bibName?: string;
  medicalCodes?: string[];
  healthCertFileName?: string;
  healthCertUrl?: string;
  liabilityAccepted: boolean;
}

export interface RegistrationDto {
  id: string;
  userId: string;
  eventId: string;
  distanceId: string;
  status: string; // pending_payment | pending_approval | confirmed | rejected | cancelled
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  idNumber?: string;
  heightCm?: number;
  weightKg?: number;
  bloodType?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  shirtType?: string;
  shirtSize?: string;
  shirtColor?: string;
  bibName?: string;
  medicalCodes?: string[];
  healthCertFileName?: string;
  healthCertUrl?: string;
  liabilityAccepted?: boolean;
  bibNumber?: string;
  qrPayload?: string;
  rejectionReason?: string;
  reviewedByName?: string | null;
  reviewedBy?: string | null;
  reviewedAtUtc?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
  /** UTC khi staff quét QR check-in (confirmed) */
  checkedInAtUtc?: string | null;
  checkedInByUserId?: string | null;
  // Populated by BE join
  eventName?: string;
  distanceName?: string;
  distanceKm?: number;
  /** Giá chốt lúc tạo ĐK (phase) — không phải list price gốc */
  price?: number | null;
  pricePhaseKey?: string | null;
  pricePhaseName?: string | null;
  distancePrice?: number;
  distanceCurrency?: string;
}
