import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** Chi tiết quản lý mở trong portal organizer */
export default async function MyEventDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/organizer/events/${id}`);
}
