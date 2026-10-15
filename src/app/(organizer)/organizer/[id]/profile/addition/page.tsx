import { redirect } from "next/navigation";

export default async function OrganizerAdditionDirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/organizer/events/${id}/profile/addition`);
}
