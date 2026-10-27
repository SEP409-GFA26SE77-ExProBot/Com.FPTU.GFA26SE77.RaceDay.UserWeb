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

function isUsableCourse(c: CourseConfigDto | null | undefined): c is CourseConfigDto {
  return Boolean(c?.polyline && c.polyline.length >= 2 && (c.distanceKm ?? 0) > 0);
}

/** Unwrap body nếu BE bọc { data } / { result }. */
function unwrapCourse(body: unknown): CourseConfigDto | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (Array.isArray(o.polyline)) return body as CourseConfigDto;
  if (o.data && typeof o.data === "object") return unwrapCourse(o.data);
  if (o.result && typeof o.result === "object") return unwrapCourse(o.result);
  return null;
}

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

/**
 * Đọc course cho trang public — dùng fetch (không qua axios interceptor)
 * để 401/403 không redirect login/403 khi guest xem detail.
 */
export async function getEventCoursePublic(
  eventId: string,
  distanceId: string,
  distanceTitle?: string
): Promise<CourseConfigDto | null> {
  if (RACE_MAP_USE_MOCK) {
    try {
      const c = await getEventCourse(eventId, distanceId, distanceTitle);
      return isUsableCourse(c) ? c : null;
    } catch {
      return null;
    }
  }

  const url = `/api/backend/${MAP_API}/events/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/course`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    const c = unwrapCourse(body);
    return isUsableCourse(c) ? c : null;
  } catch {
    return null;
  }
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
    return isUsableCourse(c);
  } catch {
    return false;
  }
}
