/**
 * Geocode VN — BE Map module proxy Nominatim.
 * GET /api/v1/map/geocode?q=
 */
import api from "@/config/axios";

const MAP_API = "api/v1/map";

export type GeocodeBBox = {
  south: number;
  north: number;
  west: number;
  east: number;
};

export type GeocodeHit = {
  lat: number;
  lng: number;
  label: string;
  type: string;
  bbox: GeocodeBBox | null;
};

type GeocodeResponse = {
  results?: GeocodeHit[];
  error?: string | null;
};

export async function searchGeocode(q: string): Promise<GeocodeHit[]> {
  const term = q.trim();
  if (term.length < 2) return [];

  const res = (await api.get(`${MAP_API}/geocode`, {
    params: { q: term },
  })) as GeocodeResponse;

  return Array.isArray(res?.results) ? res.results : [];
}
