import { redirect } from "next/navigation";

export default async function EventProfileRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/organizer/events/${id}/profile/overview`);
}
