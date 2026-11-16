"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  formatSimClock,
  reviewSimulationDecision,
  type SimulationSnapshotDto,
} from "@/api/simulation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import Pagination from "@/components/ui/Pagination";
import { Textarea } from "@/components/ui/textarea";
import { usePagedList } from "@/hooks/usePagedList";
import { getApiErrorMessage } from "@/lib/error";
import { formatDateTime } from "@/lib/format";
import { toastSuccess } from "@/lib/toast";

const simTime = (seconds: number | null | undefined) =>
  seconds == null ? "Không có thời gian giả lập" : `Giả lập ${formatSimClock(seconds)}`;

export default function SimulationDqReviews({
  snapshot, busy, live, onBusyChange, onSnapshot,
}: {
  snapshot: SimulationSnapshotDto;
  busy: boolean;
  live: boolean;
  onBusyChange: (value: boolean) => void;
  onSnapshot: (snapshot: SimulationSnapshotDto) => void;
}) {
  const [filter, setFilter] = useState("pending");
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<{ id: string; approve: boolean } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const retry = useRef<{ signature: string; operationId: string } | null>(null);
  const mounted = useRef(true);
  const heading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const reports = (snapshot.decisions ?? []).filter(
    (d) => d.status === "DQ" && (d.resolution === "Pending" || d.reviewedBy)
  );
  const pending = reports.filter((d) => d.resolution === "Pending").length;
  const filtered = reports.filter((d) => (d.resolution === "Pending") === (filter === "pending"))
    .sort((a, b) => (b.reviewedAtUtc ?? b.createdAtUtc).localeCompare(a.reviewedAtUtc ?? a.createdAtUtc));
  const pager = usePagedList(filtered, 5, filter);
  const selected = reports.find((d) => d.id === choice?.id && d.resolution === "Pending");
  const editable = snapshot.decisionsEditable !== false;

  function backToList() {
    setChoice(null);
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !choice || busy || !live || !editable) return;
    const text = reason.trim();
    if (!text || text.length > 1000) {
      setError("Nhập lý do duyệt hoặc từ chối, tối đa 1000 ký tự.");
      return;
    }
    const signature = JSON.stringify([selected.id, choice.approve, text]);
    if (retry.current?.signature !== signature) {
      retry.current = { signature, operationId: crypto.randomUUID() };
    }
    onBusyChange(true);
    setError("");
    try {
      const next = await reviewSimulationDecision(snapshot.runId, selected.id, {
        approve: choice.approve, reason: text, operationId: retry.current.operationId,
      });
      if (!mounted.current) return;
      onSnapshot(next);
      backToList();
      toastSuccess(choice.approve ? "Đã duyệt DQ." : "Đã từ chối báo cáo DQ.");
    } catch (e) {
      if (mounted.current) setError(getApiErrorMessage(e, "Chưa xử lý được báo cáo. Vui lòng thử lại."));
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (busy) return;
      setOpen(value);
      if (!value) setChoice(null);
    }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="min-h-11 gap-2 rounded-full"
          aria-label={`Báo cáo DQ từ staff, ${pending} chờ duyệt`}>
          <ShieldCheck aria-hidden="true" className="h-4 w-4 text-orange-700" /> Báo cáo DQ
          <span aria-hidden="true" className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${pending ? "bg-orange-700 text-white" : "bg-muted text-muted-foreground"}`}>{pending}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-h-[85dvh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden ${choice && selected ? "sm:max-w-lg!" : "sm:max-w-3xl!"}`} showCloseButton={!busy}>
        <DialogHeader className="pr-7">
          <DialogTitle ref={heading} tabIndex={-1}>
            {choice && selected ? choice.approve ? "Duyệt báo cáo DQ" : "Từ chối báo cáo DQ" : "Báo cáo DQ từ staff"}
          </DialogTitle>
          <DialogDescription>
            {choice && selected
              ? `BIB ${selected.bib}. ${choice.approve ? "VĐV sẽ bị loại khỏi lượt giả lập. Thao tác này chưa ghi kết quả chính thức." : "Báo cáo được đóng; trạng thái thi đấu của VĐV được giữ nguyên."}`
              : "Báo cáo chờ duyệt chưa đổi trạng thái thi đấu. Duyệt sẽ loại VĐV (DQ); từ chối giữ trạng thái hiện tại."}
          </DialogDescription>
        </DialogHeader>
        {choice && selected ? (
          <form onSubmit={submit} noValidate className="min-h-0 min-w-0 space-y-4 overflow-y-auto p-1">
            <p className="whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">Lý do staff: {selected.reason}</p>
            <div className="space-y-2">
              <label htmlFor="dq-review-reason" className="text-sm font-medium">Lý do xử lý *</label>
              <Textarea id="dq-review-reason" autoFocus value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000}
                disabled={busy} aria-required="true" aria-invalid={Boolean(error)} aria-describedby="dq-review-hint dq-review-error" className="min-h-28" />
              <p id="dq-review-hint" className="text-xs text-muted-foreground">Bắt buộc, tối đa 1000 ký tự. Lý do được lưu trong nhật ký checkpoint.</p>
              <p id="dq-review-error" role={error ? "alert" : undefined} className="text-sm text-red-700">{error}</p>
            </div>
            {(!live || !editable) && <p role="status" className="text-sm text-amber-800">{!live ? "Chờ kết nối và dữ liệu mới. Nội dung đang nhập được giữ lại." : "Lượt đã khóa quyết định."}</p>}
            <DialogFooter className="m-0 rounded-lg">
              <Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={backToList}>Hủy</Button>
              <Button type="submit" className={`min-h-11 ${choice.approve ? "bg-red-700! text-white! hover:bg-red-800! focus-visible:ring-red-700/30" : ""}`} disabled={busy || !live || !editable}>
                {busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                {busy ? "Đang xử lý…" : choice.approve ? "Xác nhận duyệt DQ" : "Xác nhận từ chối"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <section aria-label="Danh sách báo cáo DQ" className="min-h-0 min-w-0 overflow-y-auto p-1">
            <span role="status" aria-atomic="true" className="text-sm font-semibold text-orange-700">{pending} báo cáo chờ duyệt</span>
            {!live && <p role="status" className="mt-2 text-sm text-amber-800">Dữ liệu chưa cập nhật. Kết nối lại và nhận dữ liệu mới để xử lý báo cáo.</p>}
            {!editable && <p className="mt-2 text-sm text-muted-foreground">Lượt đang ghi hoặc đã ghi kết quả. Các quyết định chỉ được xem lại.</p>}
            <div className="my-3 flex flex-wrap gap-2" role="group" aria-label="Lọc báo cáo DQ">
              {[['pending', `Chờ duyệt (${pending})`], ['reviewed', `Đã xử lý (${reports.length - pending})`]].map(([value, label]) => (
                <Button key={value} type="button" variant={filter === value ? "default" : "outline"} aria-pressed={filter === value}
                  className="min-h-11" onClick={() => setFilter(value)}>{label}</Button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                {filter === "pending" ? "Không có báo cáo DQ chờ duyệt tại cự ly này." : "Chưa có báo cáo DQ đã xử lý trong lượt này."}
              </p>
            ) : (
              <ul className="space-y-3">
                {pager.pageItems.map((report) => {
                  const athlete = snapshot.athletes.find((a) => a.registrationId === report.registrationId);
                  const checkpoint = snapshot.checkpoints.find((c) => c.id === report.checkpointId);
                  return (
                    <li key={report.id} className="min-w-0 space-y-2 rounded-lg border border-border p-3 text-sm [overflow-wrap:anywhere]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">BIB {report.bib}{athlete ? ` · ${athlete.fullName}` : ""}</p>
                        <span className={report.resolution === "Pending" ? "font-medium text-amber-800" : "font-medium text-foreground"}>
                          {report.resolution === "Pending" ? "DQ chờ duyệt" : report.resolution === "Approved" ? "Đã duyệt DQ" : "Đã từ chối"}
                        </span>
                      </div>
                      <p className="text-muted-foreground">Checkpoint: {checkpoint?.name ?? report.checkpointId}</p>
                      <p className="text-muted-foreground">Người báo cáo: {report.actorName || "Staff"} · {formatDateTime(report.createdAtUtc)} · {simTime(report.createdAtSimSeconds)}</p>
                      <p className="whitespace-pre-wrap"><strong>Lý do báo cáo:</strong> {report.reason}</p>
                      <p className="whitespace-pre-wrap"><strong>Bằng chứng:</strong> {report.evidence || "Không có bằng chứng đính kèm."}</p>
                      {report.resolution !== "Pending" && (
                        <div className="space-y-1 rounded-lg bg-muted/50 p-3">
                          <p className="whitespace-pre-wrap"><strong>Lý do xử lý:</strong> {report.reviewReason}</p>
                          <p className="text-muted-foreground">{report.reviewedByName || "Organizer"} · {formatDateTime(report.reviewedAtUtc)} · {simTime(report.reviewedAtSimSeconds)}</p>
                        </div>
                      )}
                      {report.resolution === "Pending" && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[true, false].map((approve) => (
                            <Button key={String(approve)} type="button" variant={approve ? "default" : "outline"} className={`min-h-11 ${approve ? "bg-red-700! text-white! hover:bg-red-800! focus-visible:ring-red-700/30" : ""}`}
                              disabled={busy || !live || !editable} onClick={() => {
                                setChoice({ id: report.id, approve }); setReason(""); setError(""); retry.current = null;
                              }}>{approve ? "Duyệt DQ" : "Từ chối"}</Button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <Pagination page={pager.page} totalPages={pager.totalPages} totalItems={pager.totalItems} pageSize={pager.pageSize} onChange={pager.goTo} disabled={pager.turning} />
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
