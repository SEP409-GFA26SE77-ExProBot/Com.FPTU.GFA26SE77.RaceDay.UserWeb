import { redirect } from "next/navigation";

/** Portal cũ → danh sách giải của tôi (chrome user) */
export default function OrganizerDashboard() {
  redirect("/my-events");
}
