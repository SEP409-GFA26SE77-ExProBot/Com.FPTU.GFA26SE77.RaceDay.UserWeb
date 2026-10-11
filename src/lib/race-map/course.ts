import {
  CHECKPOINTS,
  DEMO_EVENT,
  ROUTE_POLYLINE,
  type Checkpoint,
  type CheckpointType,
  type LatLng,
} from "@/api/race-map.mock-data";
import { pointAtKmAlongPolyline, polylineLengthKm } from "@/lib/race-map/geo";

/** Shape gần Event.RouteGeometryJson + checkpoints */
export interface CourseConfig {
  title: string;
  distanceId?: string | null;
  distanceKm: number;
  /** Điểm organizer click — lưu như osrmWaypoints */
  waypoints: LatLng[];
  /** Polyline đã snap — leafletPolyline */
  polyline: LatLng[];
  checkpoints: Checkpoint[];
  updatedAt: string;
}

export interface CheckpointDraft {
  name: string;
  km: number;
  cutoff?: string;
  /** Điểm giữa: checkpoint timing hoặc điểm tiếp tế */
  type?: "cp" | "aid";
}

/** Legacy mid từng lưu type "aid" dù tên CP → coi là checkpoint timing */
export function midPointKind(
  type: CheckpointType | undefined,
  name: string
): "cp" | "aid" {
  if (type === "cp") return "cp";
  if (type === "aid") {
    if (/^CP\b/i.test(name.trim())) return "cp";
    return "aid";
  }
  if (/ti[eế]p\s*t[eế]/i.test(name)) return "aid";
  return "cp";
}

export function sampleWaypointsFromPolyline(poly: LatLng[], count = 5): LatLng[] {
  if (poly.length === 0) return [];
  if (poly.length <= count) return [...poly];
  const out: LatLng[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i / (count - 1)) * (poly.length - 1));
    out.push(poly[idx]);
  }
  return out;
}

export function buildCheckpoints(
  poly: LatLng[],
  distanceKm: number,
  defs: CheckpointDraft[]
): Checkpoint[] {
  const sorted = [...defs].sort((a, b) => a.km - b.km);
  return sorted.map((d) => {
    const km = Math.max(0, Math.min(distanceKm, d.km));
    const p = pointAtKmAlongPolyline(poly, km);
    let type: CheckpointType;
    if (km <= 0.001) type = "start";
    else if (km >= distanceKm - 0.001) type = "finish";
    else type = midPointKind(d.type, d.name);
    return {
      id: `cp-${km}`,
      name: d.name,
      km,
      lat: p.lat,
      lng: p.lng,
      type,
      cutoff: d.cutoff,
    };
  });
}

export function defaultCpDrafts(distanceKm: number): CheckpointDraft[] {
  if (distanceKm <= 0) {
    return [
      { km: 0, name: "Xuất phát", cutoff: "06:10" },
      { km: 0, name: "Vạch đích", cutoff: "07:00" },
    ];
  }
  const mid1 = Math.round(distanceKm * 0.3 * 10) / 10;
  const mid2 = Math.round(distanceKm * 0.6 * 10) / 10;
  const finish = Math.round(distanceKm * 1000) / 1000;
  const defs: CheckpointDraft[] = [
    { km: 0, name: "Xuất phát", cutoff: "06:10" },
  ];
  if (mid1 > 0.2 && mid1 < finish - 0.2) {
    defs.push({ km: mid1, name: `CP ${mid1}km`, type: "cp" });
  }
  if (mid2 > mid1 + 0.2 && mid2 < finish - 0.2) {
    defs.push({ km: mid2, name: `CP ${mid2}km`, type: "cp" });
  }
  defs.push({ km: finish, name: `Vạch đích ${finish}km`, cutoff: "07:00" });
  return defs;
}

export function createDefaultCourse(distanceId?: string | null): CourseConfig {
  const distanceKm = DEMO_EVENT.distanceKm;
  return {
    title: DEMO_EVENT.title,
    distanceId: distanceId ?? null,
    distanceKm,
    waypoints: sampleWaypointsFromPolyline(ROUTE_POLYLINE, 5),
    polyline: [...ROUTE_POLYLINE],
    checkpoints: CHECKPOINTS.map((c) => ({ ...c })),
    updatedAt: new Date().toISOString(),
  };
}

/** Course trống khi cự ly chưa vẽ map */
export function createEmptyCourse(
  title: string,
  distanceId?: string | null
): CourseConfig {
  return {
    title,
    distanceId: distanceId ?? null,
    distanceKm: 0,
    waypoints: [],
    polyline: [],
    checkpoints: [],
    updatedAt: new Date().toISOString(),
  };
}

export function rebuildCourseFromSnap(
  title: string,
  waypoints: LatLng[],
  polyline: LatLng[],
  distanceKm: number,
  cpDrafts?: CheckpointDraft[]
): CourseConfig {
  const dist = Math.round(distanceKm * 1000) / 1000;
  const drafts = cpDrafts?.length
    ? normalizeCpDrafts(cpDrafts, dist)
    : defaultCpDrafts(dist);
  return {
    title,
    distanceKm: dist,
    waypoints: [...waypoints],
    polyline: [...polyline],
    checkpoints: buildCheckpoints(polyline, dist, drafts),
    updatedAt: new Date().toISOString(),
    distanceId: undefined,
  };
}

export function normalizeCpDrafts(defs: CheckpointDraft[], distanceKm: number): CheckpointDraft[] {
  const mid = defs
    .filter((d) => d.km > 0.01 && d.km < distanceKm - 0.01)
    .map((d) => {
      const km = Math.round(d.km * 1000) / 1000;
      const kind = midPointKind(d.type, d.name);
      return { ...d, km, type: kind as "cp" | "aid" };
    });
  return [
    { km: 0, name: defs.find((d) => d.km <= 0.01)?.name ?? "Xuất phát", cutoff: "06:10" },
    ...mid.sort((a, b) => a.km - b.km),
    {
      km: distanceKm,
      name: defs.find((d) => d.km >= distanceKm - 0.01)?.name ?? `Vạch đích ${distanceKm}km`,
      cutoff: "07:00",
    },
  ];
}

export function courseLengthLabel(course: CourseConfig): string {
  const geo = polylineLengthKm(course.polyline);
  return `${course.distanceKm}km (polyline ${geo.toFixed(2)}km)`;
}
