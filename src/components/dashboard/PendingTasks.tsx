import Link from "next/link";
import type { OrganizerEventWorkDto } from "@/dto/dashboard.dto";
import { numberLabel } from "@/lib/dashboard";

export default function PendingTasks({ events, limit }: { events: OrganizerEventWorkDto[]; limit?: number }) {
  const rows = limit ? events.slice(0, limit) : events;
  if (!rows.length) return <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">Không có đăng ký hoặc khiếu nại đang chờ xử lý.</p>;
  return (
    <>
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">Việc đang chờ của các giải, ưu tiên giải có nhiều việc nhất</caption>
        <thead className="text-xs text-muted-foreground">
          <tr><th scope="col" className="w-1/2 pb-2 font-medium">Giải</th><th scope="col" className="pb-2 text-center font-medium">Đăng ký</th><th scope="col" className="pb-2 text-center font-medium">Khiếu nại</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((event) => <tr key={event.eventId}>
            <th scope="row" className="py-1 pr-2 font-medium">
              <Link href={`/organizer/events/${event.eventId}`} title={event.name} className="flex min-h-11 items-center text-foreground hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-orange-600"><span className={limit ? "line-clamp-2 break-words" : "break-words"}>{event.name}</span></Link>
            </th>
            <td className="text-center tabular-nums">{event.pendingRegistrations > 0 ? <Link href={`/organizer/events/${event.eventId}?tab=approvals`} aria-label={`Duyệt ${event.pendingRegistrations} đăng ký của ${event.name}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg font-bold text-orange-700 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-600">{numberLabel(event.pendingRegistrations)}</Link> : "0"}</td>
            <td className="text-center tabular-nums">{event.pendingComplaints > 0 ? <Link href={`/organizer/disputes?eventId=${event.eventId}`} aria-label={`Xử lý ${event.pendingComplaints} khiếu nại của ${event.name}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg font-bold text-orange-700 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-600">{numberLabel(event.pendingComplaints)}</Link> : "0"}</td>
          </tr>)}
        </tbody>
      </table>
      {limit && events.length > limit && <p className="mt-2 text-xs text-muted-foreground">Hiển thị {limit}/{numberLabel(events.length)} giải có việc chờ.</p>}
    </>
  );
}
