import CreateComplaintForm from "@/components/complaints/CreateComplaintForm";

export default async function CreateDisputePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ distanceId?: string }>;
}) {
  const [{ id }, { distanceId }] = await Promise.all([params, searchParams]);
  return <CreateComplaintForm eventId={id} distanceId={distanceId} />;
}
