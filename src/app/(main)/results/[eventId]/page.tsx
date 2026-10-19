"use client";

import { useParams } from "next/navigation";
import EventLeaderboard from "@/components/results/EventLeaderboard";

export default function EventResultsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  return <EventLeaderboard key={eventId} eventId={eventId} />;
}
