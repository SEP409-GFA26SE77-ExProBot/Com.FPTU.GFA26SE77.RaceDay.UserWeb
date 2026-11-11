"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import { listMyStaffAssignments, type StaffAssignmentDto } from "@/api/check-in";
import { Button } from "@/components/ui/button";

export default function StaffAssignments() {
  const [items, setItems] = useState<StaffAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void listMyStaffAssignments().then(rows => {
      if (active) setItems(rows.filter(x => x.role === "race-staff"));
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  return <div className="space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-wider text-orange-700">Workspace nhân sự</p>
      <h1 className="mt-2 text-2xl font-extrabold">Phân công của tôi</h1>
      <p className="mt-2 text-sm text-muted-foreground">Chọn giải để theo dõi checkpoint và ghi nhận tình trạng vận động viên.</p></div>
    {loading ? <p role="status" className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Đang tải phân công…</p>
      : error ? <div role="alert" className="space-y-3 rounded-xl border bg-card p-5"><p>{error}</p><Button onClick={() => { setLoading(true); setError(""); setRetry(x => x + 1); }}>Thử lại</Button></div>
      : items.length === 0 ? <div className="rounded-xl border bg-card p-6">Chưa có phân công đang hoạt động. Liên hệ organizer để được thêm vào nhân sự của giải và gán checkpoint.</div>
      : <div className="grid gap-4 md:grid-cols-2">{items.map(item => <article key={item.eventId} className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold">{item.eventName}</h2>
        <p className="flex items-start gap-2 text-sm"><MapPin className="h-5 w-5 shrink-0 text-orange-600" />{item.stationLabel || "Chưa được gán vị trí"}</p>
        {item.eventDate && <p className="text-sm text-muted-foreground">Ngày giải: {item.eventDate}</p>}
        {item.stationId?.startsWith("map:") ? <Button asChild className="min-h-11 bg-orange-600 text-white hover:bg-orange-700">
          <Link href={`/staff/events/${item.eventId}/checkpoint`}>Mở checkpoint <ArrowRight className="h-4 w-4" /></Link>
        </Button> : <p className="text-sm text-muted-foreground">Nhiệm vụ này chưa gắn checkpoint trên bản đồ. Liên hệ organizer nếu cần phân công lại.</p>}
      </article>)}</div>}
  </div>;
}
