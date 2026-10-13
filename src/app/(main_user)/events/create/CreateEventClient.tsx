"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EventPackageCheckout from "@/components/organizer/EventPackageCheckout";

export default function CreateEventClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams.get("draftId");

  useEffect(() => {
    if (draftId) {
      router.replace(`/organizer/events/${draftId}/profile`);
    }
  }, [draftId, router]);

  if (draftId) return null;

  return <EventPackageCheckout />;
}
