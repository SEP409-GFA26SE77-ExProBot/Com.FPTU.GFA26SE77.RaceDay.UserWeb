"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import OrganizerEventStaff from "@/components/organizer/OrganizerEventStaff";

function StaffContent() {
  const params = useParams();
  const eventId = String(params?.id || "");
  return <OrganizerEventStaff eventId={eventId} />;
}

export default function OrganizerEventStaffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
          Đang tải nhân sự…
        </div>
      }
    >
      <StaffContent />
    </Suspense>
  );
}
