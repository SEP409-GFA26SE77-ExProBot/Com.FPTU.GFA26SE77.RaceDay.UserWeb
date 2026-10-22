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
  currency: string;
  startAt?: string | null;
  endAt?: string | null;
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
    startAt?: string | null;
    endAt?: string | null;
  }[];
  ticketPricing: { byDistanceName: Record<string, DistancePricingDto> };
}
