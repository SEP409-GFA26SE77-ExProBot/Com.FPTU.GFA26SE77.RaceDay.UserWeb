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
  startLocation?: DistanceLocationDto;
  finishLocation?: DistanceLocationDto;
  checkpoints?: unknown[] | null;
  osrmWaypoints?: unknown | null;
  leafletPolyline?: unknown | null;
  geoJson?: unknown | null;
  // Computed / returned by BE
  registeredCount?: number;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface RaceEventListItemDto {
  id: string;
  name: string;
  tagline?: string;
  bannerImage?: string;
  location: string;
  date: string;
  status: string;
  totalRunners?: number;
  activeRunners?: number;
  /** List API đôi khi trả mảng string thay vì full distances */
  distanceTypes?: string[];
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
  shirtType?: string;
  shirtSize?: string;
  shirtColor?: string;
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
  shirtType?: string;
  shirtSize?: string;
  shirtColor?: string;
  medicalCodes?: string[];
  healthCertFileName?: string;
  healthCertUrl?: string;
  liabilityAccepted?: boolean;
  bibNumber?: string;
  qrPayload?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  // Populated by BE join
  eventName?: string;
  distanceName?: string;
  distanceKm?: number;
  distancePrice?: number;
  distanceCurrency?: string;
}
