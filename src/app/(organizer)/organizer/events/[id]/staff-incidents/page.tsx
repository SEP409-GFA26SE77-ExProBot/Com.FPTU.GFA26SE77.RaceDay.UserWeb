"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import OrganizerStaffIncidents from "@/components/organizer/OrganizerStaffIncidents";

function StaffIncidentsContent() {
  const params = useParams();
  const eventId = String(params?.id || "");
  return <OrganizerStaffIncidents eventId={eventId} />;
}

export default function OrganizerStaffIncidentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          Đang tải sự cố nhân viên…
        </div>
      }
    >
      <StaffIncidentsContent />
    </Suspense>
  );
}
