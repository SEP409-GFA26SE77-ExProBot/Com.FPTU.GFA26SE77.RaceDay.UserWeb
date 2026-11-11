"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { getOrganizerDistances } from "@/api/event-packages";
import { listCheckpointExports, type CheckpointResultExport } from "@/api/checkpoint-exports";
import { formatSimClock } from "@/api/simulation";
import {
  getOrganizerDistanceLeaderboard,
  setDistanceResultsPublished,
  type OrganizerLeaderboardItemDto,
  type OrganizerLeaderboardPageDto,
} from "@/api/event-results";
import type { LeaderboardGender } from "@/dto/leaderboard.dto";
import { PAGE_SHELL } from "@/lib/page-shell";
import { toastError, toastSuccess } from "@/lib/toast";

type DistanceOption = {
  id: string;
  name: string;
  distanceKm: number;
};

const PAGE_SIZE = 20;
const motionLabel: Record<string, string> = { Racing: "Đang chạy", Finished: "Về đích", Dnf: "DNF", Dns: "DNS", Dq: "DQ" };

function formatUtc(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function OrganizerEventResults({ eventId }: { eventId: string }) {
  const [distances, setDistances] = useState<DistanceOption[]>([]);
  const [distanceId, setDistanceId] = useState<string>("");
  const [gender, setGender] = useState<LeaderboardGender>("All");
  const [page, setPage] = useState(1);
  const [board, setBoard] = useState<OrganizerLeaderboardPageDto | null>(null);
  const [boardRefresh, setBoardRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exportState, setExportState] = useState<{ key: string; items: CheckpointResultExport[]; error: string }>({ key: "", items: [], error: "" });
  const [exportsRefresh, setExportsRefresh] = useState(0);
  const exportKey = `${eventId}:${distanceId}:${exportsRefresh}`;
  const exportsLoading = !!distanceId && exportState.key !== exportKey;
  const exports = exportsLoading ? [] : exportState.items;
  const exportsError = exportsLoading ? "" : exportState.error;

  const selected = useMemo(
    () => distances.find((d) => d.id === distanceId) ?? null,
    [distances, distanceId]
  );

  const loadDistances = useCallback(async () => {
    const detail = await getOrganizerDistances(eventId);
    const rows = (detail.distances ?? []).map((d) => ({
      id: String(d.id),
      name: String(d.name ?? "Cự ly"),
      distanceKm: Number(d.distanceKm) || 0,
    }));
    setDistances(rows);
    setDistanceId((prev) => prev || rows[0]?.id || "");
    if (rows.length === 0) setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void (async () => {
      try {
        await loadDistances();
      } catch (e) {
        toastError(e, "Không tải cự ly.");
        setLoading(false);
      }
    })();
  }, [loadDistances]);

  useEffect(() => {
    if (!distanceId) return;
    let current = true;
    void getOrganizerDistanceLeaderboard(eventId, distanceId, { gender, page, pageSize: PAGE_SIZE })
      .then(data => { if (current) setBoard(data); })
      .catch(e => { if (current) { setBoard(null); toastError(e, "Không tải kết quả."); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [eventId, distanceId, gender, page, boardRefresh]);

  useEffect(() => {
    if (!distanceId) return;
    let current = true;
    void listCheckpointExports(eventId, distanceId)
      .then(items => { if (current) setExportState({ key: exportKey, items, error: "" }); })
      .catch(e => { if (current) setExportState({ key: exportKey, items: [], error: e instanceof Error ? e.message : "Không tải được kết quả checkpoint." }); });
    return () => { current = false; };
  }, [eventId, distanceId, exportKey]);

  const onPublishToggle = async () => {
    if (!distanceId || !board) return;
    const next = !board.resultsPublished;
    setBusy(true);
    try {
      const status = await setDistanceResultsPublished(eventId, distanceId, next);
      setBoard((cur) =>
        cur
          ? { ...cur, resultsPublished: status.resultsPublished }
          : cur
      );
      toastSuccess(
        next
          ? "Đã công bố kết quả — runner thấy BXH public."
          : "Đã ẩn kết quả khỏi BXH public."
      );
    } catch (e) {
      toastError(e, "Cập nhật công bố thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, board?.totalPages || 1);
  const rows: OrganizerLeaderboardItemDto[] = board?.items ?? [];

  return (
    <div className={`${PAGE_SHELL} animate-slide-up space-y-6 pb-10 pt-2`}>
      <header className="relative overflow-hidden rounded-3xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-red-50 px-5 py-7 sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 80% at 12% 20%, rgba(249,115,22,0.22), transparent 55%), radial-gradient(ellipse 50% 60% at 90% 10%, rgba(220,38,38,0.12), transparent 50%)",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
              RaceDay · Vận hành giải
            </p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Kết quả giải
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Xem hạng VĐV đã hoàn thành cự ly giải, lọc theo cự ly rồi công bố để
              bảng xếp hạng hiện trên trang công bố kết quả chính thức của RaceDay.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25">
            <Trophy className="h-7 w-7" strokeWidth={1.75} />
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[10rem] flex-1 space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground">Cự ly</span>
            <select
              value={distanceId}
              onChange={(e) => {
                setLoading(true);
                setPage(1);
                setDistanceId(e.target.value);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              {distances.length === 0 ? (
                <option value="">Chưa có cự ly</option>
              ) : null}
              {distances.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.distanceKm} km
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground">Giới tính</span>
            <select
              value={gender}
              onChange={(e) => {
                setLoading(true);
                setPage(1);
                setGender(e.target.value as LeaderboardGender);
              }}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value="All">Tất cả</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
            </select>
          </label>
          <button
            type="button"
            disabled={loading || busy || !distanceId}
            onClick={() => { setLoading(true); setBoardRefresh(value => value + 1); setExportsRefresh(value => value + 1); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
          <button
            type="button"
            disabled={busy || !board || !distanceId}
            onClick={() => void onPublishToggle()}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 ${
              board?.resultsPublished
                ? "bg-slate-700 hover:bg-slate-800"
                : "bg-gradient-to-r from-orange-500 to-red-600 shadow-md shadow-orange-500/20"
            }`}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : board?.resultsPublished ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {board?.resultsPublished ? "Ẩn khỏi public" : "Công bố kết quả"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
          {selected ? (
            <span className="rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-700">
              {selected.name}
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 font-semibold ${
              board?.resultsPublished
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {board?.resultsPublished
              ? "Đã công bố — runner thấy BXH"
              : "Chưa công bố — chỉ organizer xem"}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {board?.totalCount ?? 0} VĐV đã hoàn thành cự ly giải
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-bold">Kết quả checkpoint staff đã gửi</h2>
        <p className="mt-1 text-xs text-muted-foreground">Bản chốt theo từng lượt và mốc để organizer đối chiếu. Báo cáo này không tự ghi vào bảng xếp hạng; cần ghi kết quả simulation trước khi công bố.</p>
        {exportsLoading ? <p role="status" className="mt-4 text-sm text-muted-foreground">Đang tải báo cáo checkpoint…</p>
          : exportsError ? <p role="alert" className="mt-4 text-sm text-red-700">{exportsError} Bấm Tải lại để thử lại.</p>
          : exports.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Chưa có staff gửi kết quả checkpoint cho cự ly này.</p>
          : <div className="mt-4 space-y-3">{exports.map(report => {
            const passed = report.rows.filter(row => row.passedAtSeconds != null).length;
            return <details key={`${report.runId}:${report.checkpointId}`} className="rounded-xl border border-border/70 p-3">
              <summary className="cursor-pointer text-sm font-semibold">{report.checkpointName} · km {report.checkpointKm} · {passed}/{report.rows.length} VĐV qua mốc <span className="font-normal text-muted-foreground">· gửi {formatUtc(report.submittedAtUtc)} · lượt {report.runId.slice(0, 8)}</span></summary>
              <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground"><tr><th className="p-2">BIB</th><th className="p-2">VĐV</th><th className="p-2">Trạng thái lúc gửi</th><th className="p-2">Qua mốc</th></tr></thead>
                <tbody>{[...report.rows].sort((a, b) => (a.passedAtSeconds ?? Infinity) - (b.passedAtSeconds ?? Infinity) || a.bib.localeCompare(b.bib)).map(row =>
                  <tr key={row.registrationId} className="border-t"><td className="p-2 font-semibold">{row.bib}</td><td className="p-2">{row.fullName}</td><td className="p-2">{motionLabel[row.motion] ?? row.motion}</td><td className="p-2 tabular-nums">{formatSimClock(row.passedAtSeconds)}</td></tr>)}</tbody>
              </table></div>
              {report.decisions.length > 0 && <div className="mt-3 space-y-1 text-xs"><p className="font-semibold">Ghi nhận tại mốc</p>{report.decisions.map((decision, index) =>
                <p key={`${decision.registrationId}:${index}`}>BIB {decision.bib} · {decision.status} · {decision.resolution}: {decision.reason}{decision.evidence && ` · Bằng chứng: ${decision.evidence}`}</p>)}</div>}
            </details>;
          })}</div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/60 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-bold text-foreground">Bảng xếp hạng (bản ghi)</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Thời gian total / pace sau commit giả lập hoặc nhập kết quả. Split checkpoint
            chi tiết sẽ bổ sung khi BE lưu passage.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
            Đang tải kết quả…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
            <Trophy className="h-8 w-8 text-orange-400/80" />
            <p className="font-semibold text-foreground">Chưa có VĐV finish</p>
            <p className="max-w-md text-xs leading-relaxed">
              Chạy giả lập đua → đợi Finished → commit, hoặc nhập kết quả thủ công, rồi
              quay lại đây để công bố.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Hạng</th>
                    <th className="px-4 py-3 font-semibold">BIB</th>
                    <th className="px-4 py-3 font-semibold">VĐV</th>
                    <th className="px-4 py-3 font-semibold">GT</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Pace</th>
                    <th className="px-4 py-3 font-semibold">Start</th>
                    <th className="px-4 py-3 font-semibold">Finish</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={`${row.rank}-${row.bib}-${row.fullName}`}
                      className="border-t border-border/50 hover:bg-orange-500/[0.03]"
                    >
                      <td className="px-4 py-3 font-black tabular-nums text-orange-600">
                        #{row.rank}
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums">{row.bib || "—"}</td>
                      <td className="px-4 py-3 font-medium">{row.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.gender || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums">
                        {row.totalTime}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                        {row.pace}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                        {formatUtc(row.startAtUtc)}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                        {formatUtc(row.finishAtUtc)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
              <span className="tabular-nums">
                Trang {board?.currentPage ?? page}/{totalPages} · {board?.totalCount ?? 0}{" "}
                kết quả
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => { setLoading(true); setPage((p) => Math.max(1, p - 1)); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => { setLoading(true); setPage((p) => p + 1); }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
