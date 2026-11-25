import { requireServerUser } from "@/lib/require-server-user";
import { OrganizerTaskDetails } from "@/components/dashboard/OrganizerDashboardDetails";

export default async function TasksPage() {
  await requireServerUser(["ORGANIZER"]);
  return <OrganizerTaskDetails />;
}
