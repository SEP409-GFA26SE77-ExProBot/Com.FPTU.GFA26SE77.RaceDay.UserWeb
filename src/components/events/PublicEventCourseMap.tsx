"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MapPinned } from "lucide-react";
import { getEventCoursePublic } from "@/api/race-map";
import type { CourseConfigDto } from "@/dto/race-map.dto";

const PublicCourseMapCanvas = dynamic(
  () => import("@/components/events/PublicCourseMapCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Đang tải bản đồ…
      </div>
    ),
  }
);

export type PublicMapDistance = {
  id: string;
  name: string;
};

type Props = {
  eventId: string;
  distances: PublicMapDistance[];
  /** Báo parent để hiện nav “Bản đồ” khi có ít nhất 1 course. */
  onAvailabilityChange?: (hasCourse: boolean) => void;
  sectionClassName?: string;
};

/**
 * Section bản đồ đường chạy trên event detail public.
 * Chỉ render khi có course; probe qua getEventCoursePublic (không redirect 401/403).
 */
export default function PublicEventCourseMap({
  eventId,
  distances,
  onAvailabilityChange,
  sectionClassName,
}: Props) {
  const [readyIds, setReadyIds] = useState<string[]>([]);
  const [courses, setCourses] = useState<Record<string, CourseConfigDto>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [probing, setProbing] = useState(true);

  const distanceKey = useMemo(
    () => distances.map((d) => d.id).join(","),
    [distances]
  );

  useEffect(() => {
    if (!eventId || distances.length === 0) {
      setReadyIds([]);
      setCourses({});
      setSelectedId(null);
      setProbing(false);
      onAvailabilityChange?.(false);
      return;
    }

    let cancelled = false;
    setProbing(true);

    (async () => {
      const entries = await Promise.all(
        distances.map(async (d) => {
          const course = await getEventCoursePublic(eventId, d.id, d.name);
          return [d.id, course] as const;
        })
      );
      if (cancelled) return;

      const nextCourses: Record<string, CourseConfigDto> = {};
      const nextReady: string[] = [];
      for (const [id, course] of entries) {
        if (course) {
          nextCourses[id] = course;
          nextReady.push(id);
        }
      }
      setCourses(nextCourses);
      setReadyIds(nextReady);
      setSelectedId((prev) =>
        prev && nextReady.includes(prev) ? prev : nextReady[0] ?? null
      );
      setProbing(false);
      onAvailabilityChange?.(nextReady.length > 0);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onAvailabilityChange ổn định bởi setState
  }, [eventId, distanceKey]);

  if (probing || readyIds.length === 0 || !selectedId || !courses[selectedId]) {
    return null;
  }

  const selectedCourse = courses[selectedId];
  const tabs = distances.filter((d) => readyIds.includes(d.id));

  return (
    <section id="ban-do" data-event-section className={sectionClassName}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-bold text-foreground">
            Bản đồ đường chạy
          </h2>
        </div>
        {selectedCourse.distanceKm > 0 ? (
          <p className="text-xs font-semibold text-muted-foreground">
            {selectedCourse.distanceKm.toLocaleString("vi-VN", {
              maximumFractionDigits: 3,
            })}{" "}
            km
            {(selectedCourse.checkpoints || []).length > 0
              ? ` · ${selectedCourse.checkpoints.length} điểm`
              : ""}
          </p>
        ) : null}
      </div>

      {tabs.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tabs.map((d) => {
            const active = d.id === selectedId;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  active
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-sm shadow-orange-500/20"
                    : "border border-border bg-background text-muted-foreground hover:border-orange-300 hover:text-orange-700"
                }`}
              >
                {d.name || "Cự ly"}
              </button>
            );
          })}
        </div>
      ) : tabs.length === 1 ? (
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          {tabs[0].name}
        </p>
      ) : null}

      <div className="h-[min(360px,55vh)] overflow-hidden rounded-xl border border-border/60">
        <PublicCourseMapCanvas
          key={selectedId}
          course={selectedCourse}
        />
      </div>
    </section>
  );
}
