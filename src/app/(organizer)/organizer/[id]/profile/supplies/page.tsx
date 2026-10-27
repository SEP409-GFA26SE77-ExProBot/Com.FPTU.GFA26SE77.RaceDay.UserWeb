import { redirect } from "next/navigation";

export default async function OrganizerSuppliesDirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/organizer/events/${id}/profile/supplies`);
}
