import { redirect } from "next/navigation";

export default async function DisputeCreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ distanceId?: string }>;
}) {
  const { eventId } = await params;
  const { distanceId } = await searchParams;
  const query = distanceId ? `?${new URLSearchParams({ distanceId })}` : "";
  redirect(`/dispute/${encodeURIComponent(eventId)}${query}`);
}
