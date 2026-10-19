/**
 * Ghép điểm bố trí nhân sự từ course Map (checkpoint / aid) + nhiệm vụ không gắn map.
 * Không gọi cross-module BE — chỉ đọc `@/api/events` + `@/api/race-map`.
 */
import { getEventById } from "@/api/events";
import { getEventCourse } from "@/api/race-map";
import type { EventStaffRole, StaffStationDto } from "@/dto/event-staff.dto";
import type { RaceCheckpointDto } from "@/dto/race-map.dto";

/** Nhiệm vụ cố định — không bắt buộc điểm trên bản đồ */
const DUTY_STATIONS: Record<EventStaffRole, StaffStationDto[]> = {
  coordinator: [
    {
      id: "duty:ops",
      label: "Trung tâm điều hành",
      kind: "other",
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
    }
  ],
  volunteer: [
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

function includeCheckpoint(role: EventStaffRole, cp: RaceCheckpointDto): boolean {
  const t = (cp.type || "").toLowerCase();
  if (role === "volunteer") return t === "aid";
  // coordinator + photographer: điểm timing trên cung (không lấy aid)
  return t === "start" || t === "cp" || t === "finish";
}

function stationKind(role: EventStaffRole, cpType: string): string {
  if (role === "volunteer") return "aid";
  if (role === "photographer") return "photo_zone";
  return cpType === "aid" ? "aid" : "checkpoint";
}

export async function buildStaffStationsForEvent(
  eventId: string,
  role: EventStaffRole
): Promise<StaffStationDto[]> {
  const duty = DUTY_STATIONS[role].map((s) => ({ ...s }));
  const fromMap: StaffStationDto[] = [];

  try {
    const event = await getEventById(eventId);
    const distances = event.distances || [];

    await Promise.all(
      distances.map(async (d) => {
        try {
          const course = await getEventCourse(eventId, d.id, d.name);
          const cps = Array.isArray(course.checkpoints) ? course.checkpoints : [];
          for (const cp of cps) {
            if (!includeCheckpoint(role, cp)) continue;
            const distName = d.name || course.title || "Cự ly";
            const km =
              typeof cp.km === "number" && Number.isFinite(cp.km)
                ? ` · ${cp.km}km`
                : "";
            fromMap.push({
              id: mapStationId(d.id, cp.id),
              label: `${distName} — ${cp.name || typeLabel(cp.type)}${km}`,
              kind: stationKind(role, cp.type),
              source: "map",
              mapCheckpointId: cp.id,
              distanceId: d.id,
              distanceName: distName,
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
  return [...fromMap, ...duty];
}

export function findStationLabel(
  stations: StaffStationDto[],
  stationId?: string | null
): string | null {
  if (!stationId) return null;
  return stations.find((s) => s.id === stationId)?.label ?? stationId;
}
