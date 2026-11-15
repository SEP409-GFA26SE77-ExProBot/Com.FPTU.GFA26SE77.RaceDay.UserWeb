import type { Metadata } from "next";
import OrganizerDashboard from "@/components/dashboard/OrganizerDashboard";

export const metadata: Metadata = { title: "Dashboard | RaceDay" };

export default function OrganizerHomePage() {
  return <OrganizerDashboard />;
}
