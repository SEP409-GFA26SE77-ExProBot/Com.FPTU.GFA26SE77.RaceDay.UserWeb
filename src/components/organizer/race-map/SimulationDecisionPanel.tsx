"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { recordOrganizerDecision, reviewSimulationDecision, type SimulationSnapshotDto, type SimulationDecisionDto } from "@/api/simulation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/error";
import { toastSuccess } from "@/lib/toast";

export default function SimulationDecisionPanel({ snapshot, selectedId, onSnapshot }: {
  snapshot: SimulationSnapshotDto; selectedId: string | null; onSnapshot: (next: SimulationSnapshotDto) => void;
}) {
  const [action, setAction] = useState<{ status?: string; decision?: SimulationDecisionDto; approve?: boolean; registrationId?: string } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const selected = snapshot.athletes.find(a => a.registrationId === selectedId);
  const decisions = snapshot.decisions ?? [];
  const pending = decisions.filter(d => d.resolution === "Pending");
  const locked = snapshot.commitState === "Committing" || snapshot.committedRegistrationIds.length > 0;
  const stopped = selected && ["Dnf", "Dns", "Dq"].includes(selected.motion);
  const open = (next: NonNullable<typeof action>) => { setAction(next); setReason(""); setError(""); };
  const submit = async () => {
    if (!action || !reason.trim()) { setError("Lý do là bắt buộc."); return; }
    setBusy(true); setError("");
    try {
      const next: SimulationSnapshotDto = action.decision
        ? await reviewSimulationDecision(snapshot.runId, action.decision.id, !!action.approve, reason)
        : await recordOrganizerDecision(snapshot.runId, action.registrationId!, action.status!, reason);
      onSnapshot(next); setAction(null); toastSuccess("Đã cập nhật quyết định trong lượt giả lập.");
    } catch (e) { setError(getApiErrorMessage(e, "Không cập nhật được quyết định.")); }
    finally { setBusy(false); }
  };
  const orderedDecisions = [...pending].reverse().concat([...decisions].filter(d => d.resolution !== "Pending").reverse());
  return <section className="shrink-0 rounded-xl border bg-card text-sm">
    <button type="button" aria-expanded={expanded} aria-controls="simulation-decision-details"
      onClick={() => setExpanded(value => !value)}
      className="flex min-h-11 w-full flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
      <span className="font-bold">DNS / DNF / DQ</span>
      {selected && <span className="text-xs text-muted-foreground">BIB {selected.bib}</span>}
      <span className="text-xs text-muted-foreground">{decisions.length} quyết định</span>
      {pending.length > 0 && <span role="status" className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">{pending.length} chờ duyệt</span>}
      <ChevronDown className={`ml-auto h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
    </button>
    <div id="simulation-decision-details" hidden={!expanded} className="space-y-3 border-t px-3 py-3">
      <p className="text-xs text-muted-foreground">Xử lý báo cáo trước khi ghi kết quả. Quyết định đã commit không sửa tại simulation.</p>
      {selected ? <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold">BIB {selected.bib}</span>
        {["DNS", "DNF", "DQ"].map(status => <Button key={status} variant="outline" className="min-h-11" disabled={busy || locked || !!stopped
          || pending.some(d => d.registrationId === selected.registrationId)
          || (status === "DNS" && snapshot.phase !== "Ready")
          || (status === "DNF" && (snapshot.phase === "Ready" || selected.motion !== "Racing"))}
          onClick={() => open({ status, registrationId: selected.registrationId })}>{status}</Button>)}
      </div> : <p className="text-xs text-muted-foreground">Chọn VĐV trong danh sách để ghi trạng thái.</p>}
      {pending.length > 0 && <p role="status" className="text-xs font-semibold text-amber-800">{pending.length} báo cáo đang chờ duyệt — chưa thể ghi kết quả.</p>}
      {decisions.length > 0 && <div className="max-h-44 space-y-2 overflow-y-auto">{orderedDecisions.map(d => <div key={d.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-muted/40 p-2">
        <div className="min-w-0 flex-1 break-words"><p className="font-semibold">BIB {d.bib} · {d.status} · {snapshot.checkpoints.find(c => c.id === d.checkpointId)?.name || d.checkpointId}</p>
          <p className="text-xs">{d.reason}</p>{d.evidence && <p className="text-xs">Bằng chứng: {d.evidence}</p>}
          <p className="text-xs text-muted-foreground">{d.resolution === "Pending" ? "Chờ duyệt" : d.resolution === "Rejected" ? "Đã từ chối" : "Đã ghi nhận"} · {new Date(d.createdAtUtc).toLocaleString("vi-VN")}</p>
          {d.reviewReason && <p className="text-xs">Phản hồi: {d.reviewReason}</p>}</div>
        {d.resolution === "Pending" && <div className="flex gap-2"><Button variant="outline" disabled={busy || locked} className="min-h-11" onClick={() => open({ decision: d, approve: false })}>Từ chối</Button><Button variant="destructive" disabled={busy || locked} className="min-h-11" onClick={() => open({ decision: d, approve: true })}>Duyệt DQ</Button></div>}
      </div>)}</div>}
    </div>
    <Dialog open={!!action} onOpenChange={value => { if (!value && !busy) setAction(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{action?.decision ? action.approve ? "Duyệt DQ" : "Từ chối báo cáo" : `Ghi nhận ${action?.status || ""}`}</DialogTitle>
        <DialogDescription>BIB {action?.decision?.bib || snapshot.athletes.find(a => a.registrationId === action?.registrationId)?.bib}. Quyết định áp dụng cho lượt giả lập hiện tại.</DialogDescription></DialogHeader>
        <label htmlFor="organizer-decision-reason" className="text-sm font-medium">Lý do / phản hồi</label>
        <textarea id="organizer-decision-reason" required maxLength={1000} className="min-h-28 rounded-md border p-3 text-sm" value={reason} onChange={e => setReason(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setAction(null)}>Hủy</Button><Button disabled={busy || locked} onClick={() => void submit()}>{busy ? "Đang lưu…" : "Xác nhận"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
