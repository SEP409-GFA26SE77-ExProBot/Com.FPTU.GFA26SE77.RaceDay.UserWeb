/**
 * Ghép điểm bố trí nhân sự từ course Map (checkpoint / aid) + nhiệm vụ không gắn map.
 * Không gọi cross-module BE — chỉ đọc `@/api/events` + `@/api/race-map`.
 */
import { getEventById } from "@/api/events";
import { getEventCourse } from "@/api/race-map";
import type {
  EventStaffRole,
  StaffMapPointType,
  StaffRouteDto,
  StaffStationDto,
} from "@/dto/event-staff.dto";

/** Nhiệm vụ cố định — không bắt buộc điểm trên bản đồ (check-in chỉ ở đây, không lên map) */
const DUTY_STATIONS: Record<EventStaffRole, StaffStationDto[]> = {
  "race-staff": [
    {
      id: "duty:ops",
      label: "Trung tâm điều hành",
      kind: "other",
      source: "duty",
    },
    {
      id: "duty:checkin",
      label: "Quầy check-in",
      kind: "check_in",
      source: "duty",
    },
    {
      id: "duty:kit",
      label: "Quầy nhận kit / BIB",
      kind: "kit",
      source: "duty",
    },
  ],
  photographer: [
    {
      id: "duty:float",
      label: "Di động / chưa gán điểm map",
      kind: "other",
      source: "duty",
    },
    {
      id: "duty:static",
      label: "Cố định",
      kind: "photo_zone",
      source: "duty",
    },
  ],
};

function mapStationId(distanceId: string, checkpointId: string) {
  return `map:${distanceId}:${checkpointId}`;
}

function typeLabel(type: string) {
  switch (type) {
    case "start":
      return "Xuất phát";
    case "finish":
      return "Đích";
    case "cp":
      return "Checkpoint";
    case "aid":
      return "Tiếp tế";
    default:
      return type;
  }
}

function includeCheckpoint(role: EventStaffRole, type: string): boolean {
  return (
    type === "start" ||
    type === "cp" ||
    type === "finish" ||
    (role === "race-staff" && type === "aid")
  );
}

function stationKind(role: EventStaffRole, cpType: string): string {
  if (role === "photographer") return "photo_zone";
  return cpType === "aid" ? "aid" : "checkpoint";
}

function asMapType(type: string): StaffMapPointType | null {
  if (type === "start" || type === "finish" || type === "cp" || type === "aid") {
    return type;
  }
  return null;
}

export async function buildStaffMapDataForEvent(
  eventId: string,
  role: EventStaffRole
): Promise<{ stations: StaffStationDto[]; routes: StaffRouteDto[] }> {
  const duty = DUTY_STATIONS[role].map((s) => ({ ...s }));
  const fromMap: StaffStationDto[] = [];
  const routes: StaffRouteDto[] = [];

  try {
    const event = await getEventById(eventId);
    const distances = event.distances || [];

    await Promise.all(
      distances.map(async (d) => {
        try {
          const course = await getEventCourse(eventId, d.id, d.name);
          const distName = d.name || course.title || "Cự ly";
          const poly = Array.isArray(course.polyline) ? course.polyline : [];
          const validPoly = poly.filter(
            (p) =>
              typeof p?.lat === "number" &&
              typeof p?.lng === "number" &&
              Number.isFinite(p.lat) &&
              Number.isFinite(p.lng)
          );
          if (validPoly.length >= 2) {
            routes.push({
              distanceId: d.id,
              distanceName: distName,
              polyline: validPoly.map((p) => ({ lat: p.lat, lng: p.lng })),
            });
          }

          const cps = Array.isArray(course.checkpoints) ? course.checkpoints : [];
          for (const cp of cps) {
            const type = (cp.type || "").toLowerCase();
            if (!includeCheckpoint(role, type)) continue;
            const km =
              typeof cp.km === "number" && Number.isFinite(cp.km)
                ? ` · ${cp.km}km`
                : "";
            const lat = typeof cp.lat === "number" ? cp.lat : null;
            const lng = typeof cp.lng === "number" ? cp.lng : null;
            fromMap.push({
              id: mapStationId(d.id, cp.id),
              label: `${distName} — ${cp.name || typeLabel(type)}${km}`,
              kind: stationKind(role, type),
              source: "map",
              mapCheckpointId: cp.id,
              distanceId: d.id,
              distanceName: distName,
              mapType: asMapType(type),
              lat,
              lng,
            });
          }
        } catch {
          /* course thiếu / lỗi → bỏ qua cự ly */
        }
      })
    );
  } catch {
    /* event không tải được → chỉ duty */
  }

  fromMap.sort((a, b) => a.label.localeCompare(b.label, "vi"));
  routes.sort((a, b) => a.distanceName.localeCompare(b.distanceName, "vi"));
  return { stations: [...fromMap, ...duty], routes };
}

export async function buildStaffStationsForEvent(
  eventId: string,
  role: EventStaffRole
): Promise<StaffStationDto[]> {
  const { stations } = await buildStaffMapDataForEvent(eventId, role);
  return stations;
}

export function findStationLabel(
  stations: StaffStationDto[],
  stationId?: string | null
): string | null {
  if (!stationId) return null;
  return stations.find((s) => s.id === stationId)?.label ?? stationId;
}

/** Điểm map có tọa độ — không gồm check-in / duty */
export function mapStationsWithCoords(stations: StaffStationDto[]): StaffStationDto[] {
  return stations.filter(
    (s) =>
      s.source === "map" &&
      typeof s.lat === "number" &&
      typeof s.lng === "number" &&
      Number.isFinite(s.lat) &&
      Number.isFinite(s.lng)
  );
}
