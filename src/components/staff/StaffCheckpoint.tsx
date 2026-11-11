"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MapPin, RefreshCw } from "lucide-react";
import { useStaffCheckpoint } from "@/hooks/useStaffCheckpoint";
import { recordStaffDecision, type StaffAthlete, type StaffCheckpointSnapshot } from "@/api/staff-simulation";
import { formatSimClock } from "@/api/simulation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toastSuccess } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/error";
import { getStaffCheckpointExport, submitStaffCheckpointExport, type CheckpointResultExport } from "@/api/checkpoint-exports";

const CheckpointMap = dynamic(() => import("./StaffCheckpointMap"), {
  ssr: false, loading: () => <p className="p-6 text-sm">Đang tải bản đồ…</p>,
});
const phaseLabel: Record<string, string> = { Ready: "Sẵn sàng", Running: "Đang chạy", Paused: "Tạm dừng", Finished: "Đã kết thúc" };
const motionLabel: Record<string, string> = { Racing: "Đang chạy", Finished: "Về đích", Dnf: "DNF", Dns: "DNS", Dq: "DQ" };
const PAGE_SIZE = 15;

export default function StaffCheckpoint({ eventId }: { eventId: string }) {
  const [retry, setRetry] = useState(0);
  const { snapshot, error, connected } = useStaffCheckpoint(eventId, retry);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/staff" className="inline-flex min-h-11 items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4" />Phân công của tôi</Link>
      <div className="flex items-center gap-3">
        <span role="status" className={connected ? "text-sm text-emerald-700" : "text-sm text-amber-800"}>{connected ? "Đang cập nhật trực tiếp" : "Chưa kết nối realtime"}</span>
        <Button variant="outline" className="min-h-11" onClick={() => setRetry(x => x + 1)}><RefreshCw className="h-4 w-4" />Kết nối lại</Button>
      </div>
    </div>
    {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>
      : !snapshot ? <p role="status" className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Đang xác thực phân công và tải checkpoint…</p>
      : <CheckpointContent key={`${snapshot.runId}-${snapshot.distanceId}-${snapshot.checkpoint.id}`} snapshot={snapshot} connected={connected} />}
  </div>;
}

function CheckpointContent({ snapshot: s, connected }: { snapshot: StaffCheckpointSnapshot; connected: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [action, setAction] = useState<{ athlete: StaffAthlete; status: "DNF" | "DNS" | "DQ" } | null>(null);
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [exported, setExported] = useState<CheckpointResultExport | null>(null);
  const [exportLoading, setExportLoading] = useState(!!s.runId);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState("");
  useEffect(() => {
    if (!s.runId) return;
    let current = true;
    getStaffCheckpointExport(s.eventId)
      .then(result => { if (current) setExported(result); })
      .catch(e => { if (current) setExportError(getApiErrorMessage(e, "Không tải được trạng thái gửi kết quả.")); })
      .finally(() => { if (current) setExportLoading(false); });
    return () => { current = false; };
  }, [s.eventId, s.runId]);
  const passed = s.athletes.filter(a => a.passedAtSeconds != null);
  const stopped = s.athletes.filter(a => ["Dnf", "Dns", "Dq"].includes(a.motion));
  const rows = s.athletes.filter(a => {
    const matches = (a.bib + " " + a.fullName).toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"));
    return matches && (filter === "all" || (filter === "passed" ? a.passedAtSeconds != null
      : filter === "approaching" ? a.passedAtSeconds == null && a.motion === "Racing" : ["Dnf", "Dns", "Dq"].includes(a.motion)));
  }).sort((a, b) => filter === "passed"
    ? (a.passedAtSeconds ?? Infinity) - (b.passedAtSeconds ?? Infinity) || a.bib.localeCompare(b.bib)
    : a.remainingKm - b.remainingKm || a.bib.localeCompare(b.bib));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const selected = action ? s.athletes.find(a => a.registrationId === action.athlete.registrationId) : null;
  const allowed = selected && (action?.status === "DNS" ? selected.canDns : action?.status === "DNF" ? selected.canDnf : selected.canReport);
  const openAction = (athlete: StaffAthlete, status: "DNF" | "DNS" | "DQ") => {
    setAction({ athlete, status }); setReason(""); setEvidence(""); setError("");
  };
  const submit = async () => {
    if (!action || !s.runId || !allowed || !connected) return;
    if (!reason.trim()) { setError("Nhập lý do trước khi xác nhận."); return; }
    setBusy(true); setError("");
    try {
      await recordStaffDecision(s.eventId, s.runId, action.athlete.registrationId, { status: action.status, reason, evidence });
      toastSuccess(action.status === "DQ" ? "Đã gửi báo cáo vi phạm, chờ organizer duyệt." : `Đã ghi ${action.status} vào lượt giả lập.`);
      setAction(null);
    } catch (e) { setError(getApiErrorMessage(e, "Không ghi nhận được. Vui lòng kiểm tra trạng thái mới nhất.")); }
    finally { setBusy(false); }
  };
  const sendExport = async () => {
    if (!s.runId || s.phase !== "Finished" || exportBusy) return;
    setExportBusy(true); setExportError("");
    try {
      const result = await submitStaffCheckpointExport(s.eventId, s.runId);
      setExported(result);
      toastSuccess("Đã gửi kết quả checkpoint cho organizer.");
    } catch (e) { setExportError(getApiErrorMessage(e, "Không gửi được kết quả checkpoint.")); }
    finally { setExportBusy(false); }
  };
  return <>
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-700">Checkpoint được phân công · Giả lập</p>
      <h1 className="mt-2 flex items-start gap-2 text-2xl font-extrabold"><MapPin className="mt-1 h-6 w-6 shrink-0 text-orange-600" />{s.checkpoint.name} · km {s.checkpoint.km}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{s.eventName} · {s.title} · {s.distanceKm} km</p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-orange-50 px-3 py-2 font-semibold text-orange-800">{s.phase ? phaseLabel[s.phase] : "Chờ organizer tạo lượt"}</span>
        {s.runId && <span className="rounded-full bg-muted px-3 py-2 tabular-nums">Đồng hồ giả lập {formatSimClock(s.simulatedSeconds)} · {s.playbackRate}×</span>}
        {s.commitState === "Committed" && <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-800">Đã ghi kết quả lên hệ thống</span>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Quyết định được lưu vào lượt nháp. Organizer xử lý báo cáo và commit kết quả. DNS chỉ ghi tại Start trước khi xuất phát.</p>
    </section>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[["VĐV trong lượt", s.athletes.length], ["Đã qua mốc", passed.length], ["Chưa qua mốc", s.athletes.length - passed.length], ["DNF / DNS / DQ", stopped.length]].map(([label, count]) =>
        <div key={label} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-extrabold tabular-nums">{count}</p></div>)}
    </div>
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div>
        <h2 className="font-bold">Gửi kết quả checkpoint</h2>
        <p className="mt-1 text-xs text-muted-foreground">Gửi giờ qua mốc và trạng thái VĐV của lượt này sang trang Kết quả giải của organizer sau khi lượt kết thúc.</p>
        {exported && <p className="mt-1 text-xs font-semibold text-emerald-700">Đã gửi lúc {new Date(exported.submittedAtUtc).toLocaleString("vi-VN")}</p>}
        {exportError && <p role="alert" className="mt-1 text-xs text-red-700">{exportError}</p>}
      </div>
      <Button type="button" className="min-h-11" disabled={!s.runId || s.phase !== "Finished" || exportLoading || exportBusy || !!exported} onClick={() => void sendExport()}>
        {exportBusy ? "Đang gửi…" : exported ? "Đã gửi kết quả" : "Gửi cho organizer"}
      </Button>
    </section>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <section className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-bold">Vận động viên tại chặng</h2>
        <div className="my-4 grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="staff-search" className="mb-1 block text-sm">Tìm BIB hoặc tên</label><Input id="staff-search" className="min-h-11" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /></div>
          <div><label htmlFor="staff-filter" className="mb-1 block text-sm">Hiển thị</label><select id="staff-filter" className="min-h-11 w-full rounded-md border bg-background px-3 text-sm" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
            <option value="all">Tất cả VĐV</option><option value="approaching">Chưa qua, còn thi đấu</option><option value="passed">Đã qua — theo thời gian</option><option value="stopped">DNF / DNS / DQ</option>
          </select></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[590px] text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground"><tr><th className="p-3">VĐV</th><th className="p-3">Trạng thái</th><th className="p-3">Qua mốc / còn lại</th><th className="p-3">Thao tác</th></tr></thead>
            <tbody>{visible.map(a => <tr key={a.registrationId} className="border-t">
              <td className="p-3"><span className="font-bold text-orange-700">{a.bib}</span><div className="max-w-44 break-words">{a.fullName}</div></td>
              <td className="p-3">{s.phase === "Ready" && a.motion === "Racing" ? "Chờ xuất phát" : motionLabel[a.motion]}{a.sos && <div className="text-xs text-red-700">SOS giả lập</div>}</td>
              <td className="p-3 tabular-nums">{a.passedAtSeconds != null ? formatSimClock(a.passedAtSeconds)
                : a.motion === "Racing" ? `${a.remainingKm.toFixed(2)} km` : "Chưa qua"}</td>
              <td className="p-3"><div className="flex flex-wrap gap-2">
                {a.canDns && <Button variant="outline" className="min-h-11" disabled={!connected || busy} onClick={() => openAction(a, "DNS")}>DNS</Button>}
                {a.canDnf && <Button variant="outline" className="min-h-11 text-red-700" disabled={!connected || busy} onClick={() => openAction(a, "DNF")}>Bỏ cuộc</Button>}
                {a.canReport && <Button variant="outline" className="min-h-11" disabled={!connected || busy} onClick={() => openAction(a, "DQ")}>Báo vi phạm</Button>}
                {!a.canDns && !a.canDnf && !a.canReport && <span className="text-xs text-muted-foreground">Chỉ theo dõi</span>}
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">{s.runId ? "Không có VĐV phù hợp bộ lọc." : "Chưa có lượt giả lập. Màn hình sẽ cập nhật khi organizer tạo lượt."}</p>}
        {pages > 1 && <div className="mt-4 flex items-center justify-between gap-2 text-sm">
          <Button variant="outline" className="min-h-11" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Trước</Button>
          <span>Trang {currentPage + 1}/{pages} · {rows.length} VĐV</span>
          <Button variant="outline" className="min-h-11" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Sau</Button>
        </div>}
      </section>
      <aside className="min-w-0 space-y-5">
        <section className="overflow-hidden rounded-2xl border bg-card"><h2 className="p-4 font-bold">Mốc của bạn trên bản đồ</h2><div className="relative z-0 h-72"><CheckpointMap snapshot={s} /></div><p className="p-3 text-xs text-muted-foreground">Hiển thị tối đa 30 VĐV đang chạy gần mốc: xanh dương chưa qua, xanh lá đã qua.</p></section>
        <section className="rounded-2xl border bg-card p-4"><h2 className="font-bold">Lịch sử tại checkpoint</h2>
          <p className="mt-1 text-xs text-muted-foreground">Lịch sử nháp của lượt hiện tại; reset sẽ thay lượt.</p>
          {s.decisions.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Chưa có quyết định hoặc báo cáo.</p>
            : <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">{[...s.decisions].reverse().map(d => <li key={d.id} className="rounded-lg border p-3 text-sm">
              <p className="font-bold">BIB {d.bib} · {d.status}</p><p className="mt-1 break-words">{d.reason}</p>
              {d.evidence && <p className="mt-1 break-words text-xs">Bằng chứng: {d.evidence}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{d.resolution === "Pending" ? "Chờ organizer duyệt" : d.resolution === "Rejected" ? "Đã từ chối" : "Đã ghi nhận"} · {new Date(d.createdAtUtc).toLocaleString("vi-VN")}</p>
              {d.reviewReason && <p className="mt-1 text-xs">Phản hồi: {d.reviewReason}</p>}
            </li>)}</ul>}
        </section>
      </aside>
    </div>
    <Dialog open={!!action} onOpenChange={open => { if (!open && !busy) setAction(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{action?.status === "DQ" ? "Báo cáo vi phạm" : `Xác nhận ${action?.status || ""}`}</DialogTitle>
          <DialogDescription>BIB {action?.athlete.bib} · {action?.athlete.fullName} · {s.checkpoint.name}. {action?.status === "DQ" ? "Organizer sẽ xem xét trước khi quyết định DQ." : "Kiểm tra đúng VĐV trước khi ghi nhận."}</DialogDescription></DialogHeader>
        <div className="space-y-2"><label htmlFor="decision-reason" className="text-sm font-medium">Lý do <span aria-hidden="true">*</span></label>
          <textarea id="decision-reason" required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} className="min-h-28 w-full rounded-md border bg-background p-3 text-sm" /></div>
        {action?.status === "DQ" && <div className="space-y-2"><label htmlFor="decision-evidence" className="text-sm font-medium">Mô tả / đường dẫn bằng chứng</label><textarea id="decision-evidence" maxLength={2000} value={evidence} onChange={e => setEvidence(e.target.value)} className="min-h-20 w-full rounded-md border bg-background p-3 text-sm" /></div>}
        {!allowed && <p role="status" className="text-sm text-amber-800">Trạng thái VĐV đã thay đổi; thao tác này không còn khả dụng.</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <DialogFooter><Button variant="outline" className="min-h-11" disabled={busy} onClick={() => setAction(null)}>Hủy</Button><Button className="min-h-11 bg-orange-600 text-white hover:bg-orange-700" disabled={busy || !allowed || !connected} onClick={() => void submit()}>{busy ? "Đang gửi…" : action?.status === "DQ" ? "Gửi báo cáo" : "Xác nhận"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
