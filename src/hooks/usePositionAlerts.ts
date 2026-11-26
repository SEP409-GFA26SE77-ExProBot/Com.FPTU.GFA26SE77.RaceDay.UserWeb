"use client";

import { useEffect } from "react";
import { toastError } from "@/lib/toast";

export function usePositionAlerts(eventId?: string | null) {
  useEffect(() => {
    if (!eventId || !/^[\da-f-]{36}$/i.test(eventId)) return;

    const stream = new EventSource(
      `/api/backend/api/v1/positioning/events/${encodeURIComponent(eventId)}/alerts`,
    );
    const onOutside = (event: MessageEvent<string>) => {
      const alert = JSON.parse(event.data) as {
        eventId: string;
        staffName: string;
        assignmentId: string;
        occurredAtUtc: string;
      };
      if (alert.eventId.toLowerCase() !== eventId.toLowerCase() || !alert.staffName) return;
      // The server only sends this to the staff member who left the zone.
      toastError("Bạn đang ở ngoài vùng hoạt động được phân công.", undefined, {
        autoClose: 8000,
        toastId: `${alert.assignmentId}:${alert.occurredAtUtc}`,
      });
    };
    stream.addEventListener("outside", onOutside);
    return () => stream.close();
  }, [eventId]);
}
