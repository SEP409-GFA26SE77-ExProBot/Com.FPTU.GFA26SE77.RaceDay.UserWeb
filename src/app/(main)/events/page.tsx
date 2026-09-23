import type { Metadata } from "next";
import EventsClient from "./EventsClient";

export const metadata: Metadata = {
  title: "Events | RaceDay - Running Events in Vietnam",
  description:
    "Browse and register for running events, marathons, trail runs, and fun runs across Vietnam. Find your next race today.",
};

export default function EventsPage() {
  return <EventsClient />;
}
