"use client";

import { CourseProvider, useCourse } from "@/components/organizer/race-map/CourseContext";
import DistanceCourseSwitcher from "@/components/organizer/race-map/DistanceCourseSwitcher";
import OrganizerSetupMap from "@/components/organizer/race-map/OrganizerSetupMap";
import RaceSimulator from "@/components/organizer/race-map/RaceSimulator";
import { Loader2 } from "lucide-react";

type WorkspaceMode = "setup" | "simulation";

function WorkspaceInner({ mode }: { mode: WorkspaceMode }) {
  const isSetup = mode === "setup";
  const { distancesLoading, selectedDistanceId } = useCourse();

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[480px] flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
          <span className="text-orange-600">
            {isSetup ? "THIẾT LẬP BẢN ĐỒ" : "GIẢ LẬP ĐUA"}
          </span>
          <span className="text-muted-foreground"> — </span>
          {isSetup
            ? "Lộ trình, checkpoint & điểm tiếp tế"
            : "Timing & xếp hạng"}
        </h1>
      </div>

      <div className="shrink-0">
        <DistanceCourseSwitcher />
      </div>

      {distancesLoading || !selectedDistanceId ? (
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-card text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          {distancesLoading
            ? "Đang tải cự ly…"
            : "Thêm cự ly cho giải để bắt đầu vẽ map."}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden">
          {isSetup ? <OrganizerSetupMap /> : <RaceSimulator />}
        </div>
      )}
    </div>
  );
}

export default function RaceMapWorkspace({
  eventId,
  mode,
}: {
  eventId: string;
  mode: WorkspaceMode;
}) {
  if (!eventId) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Đang mở không gian làm việc…
      </div>
    );
  }

  return (
    <CourseProvider eventId={eventId}>
      <WorkspaceInner mode={mode} />
    </CourseProvider>
  );
}
