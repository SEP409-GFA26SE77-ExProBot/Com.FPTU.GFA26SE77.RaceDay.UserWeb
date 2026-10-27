import ComplaintDetail from "@/components/complaints/ComplaintDetail";

export default async function ResolveDisputePage({
  searchParams,
}: {
  searchParams: Promise<{ complaintId?: string; eventId?: string }>;
}) {
  const { complaintId = "", eventId } = await searchParams;
  return (
    <ComplaintDetail complaintId={complaintId} eventId={eventId} organizer />
  );
}
