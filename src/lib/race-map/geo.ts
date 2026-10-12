import type { LatLng } from "@/api/race-map.mock-data";

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function cumulativeDistances(poly: LatLng[]): number[] {
  const cum = [0];
  for (let i = 1; i < poly.length; i++) {
    cum.push(cum[i - 1] + haversineKm(poly[i - 1], poly[i]));
  }
  return cum;
}

export function polylineLengthKm(poly: LatLng[]): number {
  if (poly.length < 2) return 0;
  const cum = cumulativeDistances(poly);
  return cum[cum.length - 1];
}

/** Điểm trên polyline theo km tuyệt đối dọc path */
export function pointAtKmAlongPolyline(poly: LatLng[], courseKm: number): LatLng {
  if (poly.length === 0) return { lat: 0, lng: 0 };
  if (courseKm <= 0) return poly[0];
  const cum = cumulativeDistances(poly);
  const total = cum[cum.length - 1] || 0;
  const target = Math.min(courseKm, total);
  for (let i = 1; i < cum.length; i++) {
    if (target <= cum[i]) {
      const seg = cum[i] - cum[i - 1] || 1;
      const f = (target - cum[i - 1]) / seg;
      return {
        lat: poly[i - 1].lat + (poly[i].lat - poly[i - 1].lat) * f,
        lng: poly[i - 1].lng + (poly[i].lng - poly[i - 1].lng) * f,
      };
    }
  }
  return poly[poly.length - 1];
}

/** Map course-km (0..distanceKm) — scale theo length polyline nếu lệch nhẹ */
export function positionAtCourseKm(
  poly: LatLng[],
  courseKm: number,
  totalCourseKm: number
): LatLng {
  if (poly.length === 0) return { lat: 0, lng: 0 };
  if (courseKm <= 0) return poly[0];
  const cum = cumulativeDistances(poly);
  const polyLen = cum[cum.length - 1] || 1;
  const scale = totalCourseKm > 0 ? polyLen / totalCourseKm : 1;
  return pointAtKmAlongPolyline(poly, courseKm * scale);
}

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

export interface SnapToPolylineResult {
  point: LatLng;
  /** km dọc polyline từ đầu */
  kmAlong: number;
  /** khoảng cách vuông góc tới đường (km) */
  distKm: number;
  segmentIndex: number;
}

/** Chiếu điểm gần nhất lên polyline (để CP không out khỏi route) */
export function nearestPointOnPolyline(
  poly: LatLng[],
  click: LatLng
): SnapToPolylineResult | null {
  if (poly.length < 2) return null;
  let best: SnapToPolylineResult | null = null;
  let walked = 0;

  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1];
    const b = poly[i];
    const segLen = haversineKm(a, b);
    // projection in local meters approx
    const ax = a.lng;
    const ay = a.lat;
    const bx = b.lng;
    const by = b.lat;
    const px = click.lng;
    const py = click.lat;
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby || 1e-12;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const proj: LatLng = { lat: ay + aby * t, lng: ax + abx * t };
    const distKm = haversineKm(click, proj);
    const kmAlong = walked + segLen * t;
    if (!best || distKm < best.distKm) {
      best = { point: proj, kmAlong, distKm, segmentIndex: i - 1 };
    }
    walked += segLen;
  }
  return best;
}
