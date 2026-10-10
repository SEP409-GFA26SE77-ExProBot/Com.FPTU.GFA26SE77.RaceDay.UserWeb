"use client";

import { CourseProvider } from "@/components/organizer/race-map/CourseContext";
import OrganizerSetupMap from "@/components/organizer/race-map/OrganizerSetupMap";
import RaceSimulator from "@/components/organizer/race-map/RaceSimulator";
import { Loader2 } from "lucide-react";

type WorkspaceMode = "setup" | "simulation";

function WorkspaceChrome({
  mode,
  children,
}: {
  mode: WorkspaceMode;
  children: React.ReactNode;
}) {
  const isSetup = mode === "setup";

  return (
    <div className="flex min-h-[calc(100vh-6.5rem)] flex-col gap-3">
      <h1 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
        <span className="text-orange-600">
          {isSetup ? "THIẾT LẬP BẢN ĐỒ" : "GIẢ LẬP ĐUA"}
        </span>
        <span className="text-muted-foreground"> — </span>
        {isSetup ? "Lộ trình & checkpoint" : "Timing & xếp hạng"}
      </h1>
      <div className="min-h-[min(640px,calc(100vh-9rem))] flex-1">{children}</div>
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
      <WorkspaceChrome mode={mode}>
        {mode === "setup" ? <OrganizerSetupMap /> : <RaceSimulator />}
      </WorkspaceChrome>
    </CourseProvider>
  );
}
