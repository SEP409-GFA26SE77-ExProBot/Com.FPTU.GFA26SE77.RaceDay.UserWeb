import OrganizerComplaints from "@/components/complaints/OrganizerComplaints";

export default async function OrganizerDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  return <OrganizerComplaints eventId={eventId} />;
}
