import ComplaintDetail from "@/components/complaints/ComplaintDetail";

export default async function DisputeDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ complaintId?: string }>;
}) {
  const { complaintId = "" } = await searchParams;
  return <ComplaintDetail complaintId={complaintId} />;
}
