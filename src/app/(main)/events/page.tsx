import type { Metadata } from "next";
import EventsClient from "./EventsClient";

export const metadata: Metadata = {
  title: "Giải chạy | RaceDay",
  description:
    "Khám phá và đăng ký giải marathon, trail, chạy đêm trên khắp Việt Nam.",
};

export default function EventsPage() {
  return <EventsClient />;
}
