/**
 * Race map / course API layer.
 *
 * MOCK (mặc định): `NEXT_PUBLIC_RACE_MAP_USE_MOCK` !== "false"
 *   → đọc/ghi localStorage qua `./race-map.mock`
 *
 * Khi BE sẵn sàng (xóa mock sạch):
 *   1. Set NEXT_PUBLIC_RACE_MAP_USE_MOCK=false trong .env
 *   2. Giữ nhánh axios GET/PUT bên dưới (đã sẵn)
 *   3. Xóa chỉ 2 file: `race-map.mock.ts` + `race-map.mock-data.ts`
 *   4. Trong `lib/race-map/course.ts` — đổi import seed mặc định
 *      từ `@/api/race-map.mock-data` sang seed/BE (createDefaultCourse)
 *   5. RaceSimulator: thay SEED_RUNNERS bằng API registrations
 *   UI (`components/organizer/race-map/*`) không đụng persistence.
 */
import api from "@/config/axios";
import type { CourseConfigDto } from "@/dto/race-map.dto";

const EVENT_API = "api/v1/event";

/** true = mock local; false = gọi BE */
export const RACE_MAP_USE_MOCK =
  process.env.NEXT_PUBLIC_RACE_MAP_USE_MOCK !== "false";

export async function getEventCourse(
  eventId: string
): Promise<CourseConfigDto> {
  if (RACE_MAP_USE_MOCK) {
    const { getEventCourseMock } = await import("./race-map.mock");
    return getEventCourseMock(eventId);
  }
  return api.get(
    `${EVENT_API}/organizer/${eventId}/course`
  ) as Promise<CourseConfigDto>;
}

export async function saveEventCourse(
  eventId: string,
  course: CourseConfigDto
): Promise<CourseConfigDto> {
  if (RACE_MAP_USE_MOCK) {
    const { saveEventCourseMock } = await import("./race-map.mock");
    return saveEventCourseMock(eventId, course);
  }
  return api.put(
    `${EVENT_API}/organizer/${eventId}/course`,
    course
  ) as Promise<CourseConfigDto>;
}
