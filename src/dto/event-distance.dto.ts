export interface DistancePriceTypeDto {
  key?: string;
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  price?: number;
}

export interface DistancePricingDto {
  basePrice?: number;
  types?: DistancePriceTypeDto[];
  /** Older events used phases instead of types. */
  phases?: DistancePriceTypeDto[];
}

export interface OrganizerDistanceDto {
  id: string;
  name: string;
  distanceKm: number;
  capacity: number;
  registeredCount: number;
  basePrice: number;
  /** Alias legacy — một số response cũ dùng `price` thay `basePrice`. */
  price?: number;
  currency: string;
  /** Chip BXH / BIB prefix: 5KM | HM | M | OTHER … */
  type?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  bibPrefix?: string | null;
  bibStartNumber?: number | null;
  bibEndNumber?: number | null;
  bibNextNumber?: number | null;
}

export interface OrganizerDistancesDetailDto {
  eventId: string;
  status: string;
  distances: OrganizerDistanceDto[];
  ticketPricing?: {
    byDistanceName?: Record<string, DistancePricingDto>;
    phases?: (DistancePriceTypeDto & { pricesByDistanceName?: Record<string, number> })[];
  } | null;
}

export interface ReplaceEventDistancesRequest {
  distances: {
    id?: string;
    name: string;
    distanceKm: number;
    capacity: number;
    basePrice: number;
    /** Chip BXH / gợi ý prefix BIB: 5KM | 10KM | HM | M | … */
    type?: string | null;
    startAt?: string | null;
    endAt?: string | null;
  }[];
  ticketPricing: { byDistanceName: Record<string, DistancePricingDto> };
}
