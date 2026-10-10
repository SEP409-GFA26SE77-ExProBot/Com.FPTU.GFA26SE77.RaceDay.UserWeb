/**
 * MOCK persistence — localStorage theo eventId.
 * Xóa file này khi `NEXT_PUBLIC_RACE_MAP_USE_MOCK=false` + BE sẵn sàng.
 */
import type { CourseConfigDto } from "@/dto/race-map.dto";
import { createDefaultCourse } from "@/lib/race-map/course";

function storageKey(eventId: string) {
  return `raceday-event-course-v1:${eventId}`;
}

export async function getEventCourseMock(
  eventId: string
): Promise<CourseConfigDto> {
  if (typeof window === "undefined") {
    return createDefaultCourse();
  }
  try {
    const raw = localStorage.getItem(storageKey(eventId));
    if (!raw) return createDefaultCourse();
    const parsed = JSON.parse(raw) as CourseConfigDto;
    if (
      !parsed?.polyline?.length ||
      !Array.isArray(parsed.checkpoints) ||
      !Array.isArray(parsed.waypoints) ||
      typeof parsed.distanceKm !== "number" ||
      parsed.distanceKm <= 0
    ) {
      return createDefaultCourse();
    }
    return parsed;
  } catch {
    return createDefaultCourse();
  }
}

export async function saveEventCourseMock(
  eventId: string,
  course: CourseConfigDto
): Promise<CourseConfigDto> {
  const next: CourseConfigDto = {
    ...course,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(storageKey(eventId), JSON.stringify(next));
  }
  return next;
}
