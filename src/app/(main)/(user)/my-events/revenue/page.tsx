import { Suspense } from "react";
import { requireServerUser } from "@/lib/require-server-user";
import { OrganizerRevenueDetails } from "@/components/dashboard/OrganizerDashboardDetails";

export default async function RevenuePage() {
  await requireServerUser(["ORGANIZER"]);
  return <Suspense fallback={<p role="status" className="p-8 text-center">Đang tải dòng tiền…</p>}><OrganizerRevenueDetails /></Suspense>;
}
