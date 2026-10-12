/**
 * Race map / course API — course gắn theo (eventId, distanceId).
 *
 * BE: RaceDay Map module `/api/v1/map/...` (+ alias `/api/v1/event/organizer/.../course`).
 * MOCK: `NEXT_PUBLIC_RACE_MAP_USE_MOCK` === "true" (mặc định tắt khi có API URL).
 */
import api from "@/config/axios";
import type { CourseConfigDto } from "@/dto/race-map.dto";

const MAP_API = "api/v1/map";

export const RACE_MAP_USE_MOCK =
  process.env.NEXT_PUBLIC_RACE_MAP_USE_MOCK === "true";

export async function getEventCourse(
  eventId: string,
  distanceId: string,
  distanceTitle?: string
): Promise<CourseConfigDto> {
  if (RACE_MAP_USE_MOCK) {
    const { getEventCourseMock } = await import("./race-map.mock");
    return getEventCourseMock(eventId, distanceId, distanceTitle);
  }
  return api.get(
    `${MAP_API}/events/${eventId}/distances/${distanceId}/course`
  ) as Promise<CourseConfigDto>;
}

export async function saveEventCourse(
  eventId: string,
  distanceId: string,
  course: CourseConfigDto
): Promise<CourseConfigDto> {
  if (RACE_MAP_USE_MOCK) {
    const { saveEventCourseMock } = await import("./race-map.mock");
    return saveEventCourseMock(eventId, distanceId, course);
  }
  return api.put(
    `${MAP_API}/events/${eventId}/distances/${distanceId}/course`,
    { ...course, distanceId }
  ) as Promise<CourseConfigDto>;
}

export async function hasEventCourse(
  eventId: string,
  distanceId: string
): Promise<boolean> {
  if (RACE_MAP_USE_MOCK) {
    const { hasEventCourseMock } = await import("./race-map.mock");
    return hasEventCourseMock(eventId, distanceId);
  }
  try {
    const c = (await api.get(
      `${MAP_API}/events/${eventId}/distances/${distanceId}/course`
    )) as CourseConfigDto;
    return Boolean(c?.polyline && c.polyline.length >= 2 && c.distanceKm > 0);
  } catch {
    return false;
  }
}
