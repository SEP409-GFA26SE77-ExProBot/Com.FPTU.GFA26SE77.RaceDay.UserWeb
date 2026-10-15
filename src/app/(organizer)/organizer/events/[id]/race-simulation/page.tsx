"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import RaceMapWorkspace from "@/components/organizer/race-map/RaceMapWorkspace";

function RaceSimulationContent() {
  const params = useParams();
  const eventId = String(params?.id || "");
  return <RaceMapWorkspace eventId={eventId} mode="simulation" />;
}

export default function OrganizerRaceSimulationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          Đang tải giả lập đua…
        </div>
      }
    >
      <RaceSimulationContent />
    </Suspense>
  );
}
