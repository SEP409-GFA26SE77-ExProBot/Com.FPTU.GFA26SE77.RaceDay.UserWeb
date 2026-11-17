/**
 * Ghép checkpoint từ course Map với nhiệm vụ theo vai trò.
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

const DUTY_STATIONS: Record<EventStaffRole, StaffStationDto[]> = {
  "race-staff": [
    {
      id: "duty:broom",
      label: "Xe khóa đuôi",
      kind: "other",
      source: "duty",
    },
  ],
  photographer: [
    {
      id: "duty:float",
      label: "Di động",
      kind: "other",
      source: "duty",
    },
  ],
};

function mapStationId(distanceId: string, checkpointId: string) {
  return `map:${distanceId}:${checkpointId}`;
}

function typeLabel(type: StaffMapPointType) {
  switch (type) {
    case "start":
      return "Xuất phát";
    case "finish":
      return "Đích";
    case "cp":
      return "Checkpoint";
  }
}

function isAssignableCheckpoint(type: string): type is StaffMapPointType {
  return type === "start" || type === "finish" || type === "cp";
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
            if (!isAssignableCheckpoint(type)) continue;
            const km =
              typeof cp.km === "number" && Number.isFinite(cp.km)
                ? ` · ${cp.km}km`
                : "";
            const lat = typeof cp.lat === "number" ? cp.lat : null;
            const lng = typeof cp.lng === "number" ? cp.lng : null;
            fromMap.push({
              id: mapStationId(d.id, cp.id),
              label: `${distName} — ${cp.name || typeLabel(type)}${km}`,
              kind: role === "photographer" ? "photo_zone" : "checkpoint",
              source: "map",
              mapCheckpointId: cp.id,
              distanceId: d.id,
              distanceName: distName,
              mapType: type,
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

/** Checkpoint có tọa độ để hiển thị trên bản đồ phân bổ. */
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
