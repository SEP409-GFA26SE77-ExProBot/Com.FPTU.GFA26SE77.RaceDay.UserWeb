// DTOs for organizer registration management (approve / reject)

export interface ApiRegistration {
  id: string;
  eventId: string;
  distanceId: string;
  userId: string;
  status: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  idNumber?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bloodType?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  /** Ba/Mẹ | Chồng/Vợ | Anh/Chị/Em | Người thân | Bạn bè */
  emergencyRelation?: string | null;
  shirtType?: string | null;
  shirtSize?: string | null;
  shirtColor?: string | null;
  /** Tên in trên BIB (khác số BIB) */
  bibName?: string | null;
  medicalCodes?: string[] | unknown | null;
  healthCertFileName?: string | null;
  healthCertUrl?: string | null;
  liabilityAccepted?: boolean | null;
  bibNumber?: string | null;
  rejectionReason?: string | null;
  /** Người duyệt / từ chối (nếu BE trả) */
  reviewedByName?: string | null;
  reviewedBy?: string | null;
  reviewedAtUtc?: string | null;
  updatedAtUtc?: string | null;
  ticketCode?: string | null;
  qrPayload?: unknown;
  eventName?: string | null;
  distanceLabel?: string | null;
  distanceKm?: number | null;
  price?: number | null;
  currency?: string | null;
  createdAtUtc: string;
}

/** @deprecated dùng RaceEventListItemDto từ event.dto (API mine trả list item đầy đủ) */
export interface OrganizerEventItemDto {
  id: string;
  name: string;
  status: string;
  tagline?: string;
  bannerImage?: string;
  location?: string;
  date?: string;
  organizerName?: string;
  totalRunners?: number;
  activeRunners?: number;
  distanceTypes?: string[];
}

/** POST /api/v1/event/organizer/ — tạo giải (draft hoặc gửi duyệt) */
export interface CreateRaceEventDistanceInput {
  type: string;
  name: string;
  distanceKm: number;
  elevationGainM: number;
  maxElevationM: number;
  minElevationM: number;
  capacity: number;
  price: number;
  currency?: string;
  color?: string;
  startLocation: { name: string; lat: number; lng: number };
  finishLocation: { name: string; lat: number; lng: number };
  checkpoints?: unknown[] | null;
  osrmWaypoints?: unknown | null;
  leafletPolyline?: unknown | null;
  geoJson?: unknown | null;
}

export interface CreateRaceEventDocumentInput {
  documentKey: string;
  title: string;
  fileName?: string | null;
  fileUrl?: string | null;
  required: boolean;
}

export interface CreateRaceEventRequest {
  name: string;
  tagline?: string | null;
  bannerImage?: string | null;
  location: string;
  coordinates: { lat: number; lng: number };
  date: string;
  startTime?: string | null;
  description?: string | null;
  totalRunners: number;
  organizer: {
    name: string;
    email: string;
    phone: string;
    legalEntity?: string | null;
    website?: string | null;
    verified?: boolean;
    /** TK giải ngân BTC ← hệ thống (không phải TK nhận PayOS) */
    beneficiaryAccount?: {
      accountHolder?: string | null;
      accountNumber?: string | null;
      bankName?: string | null;
      branch?: string | null;
      swiftCode?: string | null;
      transferNote?: string | null;
    } | null;
  };
  weather?: unknown | null;
  permitDocument?: unknown | null;
  ticketPricing?: unknown | null;
  merchandise?: unknown | null;
  rules?: unknown | null;
  rewards?: unknown | null;
  distances: CreateRaceEventDistanceInput[];
  documents?: CreateRaceEventDocumentInput[] | null;
  submitForApproval: boolean;
}

/** Lựa chọn vật phẩm bổ sung (bib/áo/chip…) — lưu local / hồ sơ */
export interface ProfileAdditionDto {
  selectedItems?: string[];
  notes?: string;
  [key: string]: unknown;
}

/** Vật phẩm tiếp tế theo thùng */
export interface EventSupplyItemDto {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface UpdateEventSuppliesRequest {
  supplies: EventSupplyItemDto[];
}
