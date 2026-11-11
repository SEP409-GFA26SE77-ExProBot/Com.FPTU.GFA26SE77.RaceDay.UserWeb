import StaffCheckpoint from "@/components/staff/StaffCheckpoint";
export default async function CheckpointPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <StaffCheckpoint key={eventId} eventId={eventId} />;
}
