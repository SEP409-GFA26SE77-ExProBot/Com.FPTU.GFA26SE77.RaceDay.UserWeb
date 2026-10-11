/**
 * MOCK persistence — localStorage theo eventId + distanceId.
 * Xóa file này khi `NEXT_PUBLIC_RACE_MAP_USE_MOCK=false` + BE sẵn sàng.
 */
import type { CourseConfigDto } from "@/dto/race-map.dto";
import {
  createDefaultCourse,
  createEmptyCourse,
} from "@/lib/race-map/course";

function legacyKey(eventId: string) {
  return `raceday-event-course-v1:${eventId}`;
}

function storageKey(eventId: string, distanceId: string) {
  return `raceday-event-course-v2:${eventId}:${distanceId}`;
}

function isValidCourse(parsed: CourseConfigDto | null | undefined): boolean {
  return Boolean(
    parsed &&
      Array.isArray(parsed.checkpoints) &&
      Array.isArray(parsed.waypoints) &&
      Array.isArray(parsed.polyline) &&
      typeof parsed.distanceKm === "number"
  );
}

function hasRoute(parsed: CourseConfigDto): boolean {
  return parsed.polyline.length >= 2 && parsed.distanceKm > 0;
}

export async function getEventCourseMock(
  eventId: string,
  distanceId: string,
  distanceTitle?: string
): Promise<CourseConfigDto> {
  const title = distanceTitle?.trim() || "Cự ly";
  if (typeof window === "undefined") {
    return createEmptyCourse(title, distanceId);
  }
  try {
    const raw = localStorage.getItem(storageKey(eventId, distanceId));
    if (raw) {
      const parsed = JSON.parse(raw) as CourseConfigDto;
      if (isValidCourse(parsed)) {
        return { ...parsed, distanceId, title: parsed.title || title };
      }
    }
    // Migrate 1 lần từ map cũ (1 course / event) → cự ly đầu tiên gọi API
    const legacyRaw = localStorage.getItem(legacyKey(eventId));
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as CourseConfigDto;
      if (isValidCourse(legacy) && hasRoute(legacy)) {
        const migrated: CourseConfigDto = {
          ...legacy,
          distanceId,
          title: legacy.title || title,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(
          storageKey(eventId, distanceId),
          JSON.stringify(migrated)
        );
        return migrated;
      }
    }
  } catch {
    /* fall through */
  }
  return createEmptyCourse(title, distanceId);
}

export async function saveEventCourseMock(
  eventId: string,
  distanceId: string,
  course: CourseConfigDto
): Promise<CourseConfigDto> {
  const next: CourseConfigDto = {
    ...course,
    distanceId,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(
      storageKey(eventId, distanceId),
      JSON.stringify(next)
    );
  }
  return next;
}

export async function hasEventCourseMock(
  eventId: string,
  distanceId: string
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(storageKey(eventId, distanceId));
    if (!raw) {
      const legacy = localStorage.getItem(legacyKey(eventId));
      if (!legacy) return false;
      const parsed = JSON.parse(legacy) as CourseConfigDto;
      return isValidCourse(parsed) && hasRoute(parsed);
    }
    const parsed = JSON.parse(raw) as CourseConfigDto;
    return isValidCourse(parsed) && hasRoute(parsed);
  } catch {
    return false;
  }
}

/** Seed demo Mỹ Khê — dùng nút Gợi ý map */
export async function seedDemoCourseMock(
  eventId: string,
  distanceId: string
): Promise<CourseConfigDto> {
  const demo = createDefaultCourse(distanceId);
  return saveEventCourseMock(eventId, distanceId, demo);
}
