"use client";

import { useCourse } from "@/components/organizer/race-map/CourseContext";

/** Một hàng gọn — select cự ly (ổn khi nhiều cự ly, không đẩy map) */
export default function DistanceCourseSwitcher() {
  const {
    distances,
    selectedDistanceId,
    selectDistance,
    distancesLoading,
    courseReadyByDistance,
  } = useCourse();

  if (distancesLoading) {
    return (
      <div className="flex h-9 items-center text-xs text-muted-foreground">
        Đang tải cự ly…
      </div>
    );
  }

  if (distances.length === 0) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-900">
        Giải chưa có cự ly — thêm ở form tạo giải rồi quay lại.
      </div>
    );
  }

  const ready = selectedDistanceId
    ? !!courseReadyByDistance[selectedDistanceId]
    : false;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
      <label className="flex min-w-0 flex-1 items-center gap-2 text-xs">
        <span className="shrink-0 font-bold text-muted-foreground">Cự ly</span>
        <select
          value={selectedDistanceId || ""}
          onChange={(e) => void selectDistance(e.target.value)}
          className={`min-w-0 flex-1 rounded-lg bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:ring-2 ${
            ready
              ? "border-2 border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              : "border-2 border-red-500 focus:border-red-500 focus:ring-red-500/20"
          }`}
        >
          {distances.map((d) => {
            const ok = !!courseReadyByDistance[d.id];
            return (
              <option key={d.id} value={d.id}>
                {d.name} - {ok ? "đã có map" : "chưa có map"}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}
