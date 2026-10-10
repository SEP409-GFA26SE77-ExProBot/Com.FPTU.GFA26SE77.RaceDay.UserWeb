"use client";

import { useSearchParams } from "next/navigation";
import EventPermitRegistration from "@/components/organizer/EventPermitRegistration";

export default function CreateEventClient() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  return (
    <EventPermitRegistration
      backHref="/my-events"
      backLabel="Quay lại giải của tôi"
      draftId={draftId}
    />
  );
}
