import type { LatLng } from "@/api/race-map.mock-data";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export interface OsrmRouteResult {
  polyline: LatLng[];
  distanceKm: number;
  durationSec: number;
}

/** Snap waypoints → geometry bám mạng đường OSM (không nối thẳng xuyên nhà/biển) */
export async function fetchOsrmRoute(waypoints: LatLng[]): Promise<OsrmRouteResult> {
  if (waypoints.length < 2) {
    throw new Error("Cần ≥2 waypoint để snap route.");
  }
  const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&continue_straight=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error(data.message || "OSRM không tìm được đường.");
  }
  const route = data.routes[0];
  const polyline: LatLng[] = (route.geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => ({ lat, lng })
  );
  return {
    polyline,
    distanceKm: route.distance / 1000,
    durationSec: route.duration,
  };
}
