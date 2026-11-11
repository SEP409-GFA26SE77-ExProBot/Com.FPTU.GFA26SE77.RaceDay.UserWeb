"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Save,
  Siren,
  Trophy,
} from "lucide-react";
import {
  bibMapKey,
  commitSimulationRun,
  createSimulationRun,
  formatSimClock,
  getSimulationPreview,
  getSimulationSnapshot,
  markAthleteSos,
  pauseSimulationRun,
  resetSimulationRun,
  resumeSimulationRun,
  setAthleteSpeed,
  setSimulationPlayback,
  startSimulationRun,
  type SimulationAthleteDto,
  type SimulationPreviewDto,
  type SimulationSnapshotDto,
} from "@/api/simulation";
import { useCourse } from "@/components/organizer/race-map/CourseContext";
import SimulationDecisionPanel from "./SimulationDecisionPanel";
import { useSimulationHub } from "@/hooks/useSimulationHub";
import { checkpointDotClass } from "@/lib/race-map/map-colors";
import type { RunnerLive } from "@/lib/race-map/timing";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";

const MapView = dynamic(() => import("@/components/organizer/race-map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-slate-800 text-sm text-slate-400">
      Đang tải bản đồ OSM…
    </div>
  ),
});

const ATHLETE_PAGE_SIZE = 10;
const RANKING_PAGE_SIZE = 10;
const PLAYBACK_RATES = [1, 5, 20, 60] as const;

function ListPager({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  if (total <= pageSize) return null;
  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-muted-foreground">
      <span className="tabular-nums">
        {from}–{to} / {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPage(page - 1)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background disabled:opacity-40"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[4.5rem] text-center tabular-nums">
          Trang {page + 1}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages - 1}
          onClick={() => onPage(page + 1)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background disabled:opacity-40"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function athleteToLive(
  athletes: SimulationAthleteDto[],
  focusRegistrationId: string | null
): RunnerLive[] {
  return athletes.map((a, index) => {
    const bibNum = bibMapKey(a.bib, index);
    let status: RunnerLive["status"] = "waiting";
    if (a.motion === "Finished") status = "finished";
    else if (["Dnf", "Dns", "Dq"].includes(a.motion) || a.sos) status = "flagged";
    else if (a.courseKm > 0) status = "running";
    return {
      bib: bibNum,
      chipId: a.chipId,
      name: a.fullName,
      gender: "Nam",
      speedKmh: a.speedKmh,
      startOffsetSec: 0,
      courseKm: a.courseKm,
      status,
      finishSec: a.resultSeconds ?? undefined,
      splits: Object.fromEntries(
        (a.splits ?? []).map((s) => [s.checkpointId, s.simSeconds])
      ),
      // stash for UI selection via focus
      ...(focusRegistrationId === a.registrationId ? {} : {}),
    };
  });
}

export default function RaceSimulator() {
  const { eventId, selectedDistanceId, applied } = useCourse();
  const distanceId = selectedDistanceId;

  const [preview, setPreview] = useState<SimulationPreviewDto | null>(null);
  const [snapshot, setSnapshot] = useState<SimulationSnapshotDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<
    string | null
  >(null);
  const [athletePage, setAthletePage] = useState(0);
  const [rankingPage, setRankingPage] = useState(0);
  const [runnerCountPref, setRunnerCountPref] = useState<number | null>(null);
  const cursorRef = useRef<{ runId: string; generation: number; version: number } | null>(
    null
  );

  const applySnapshot = useCallback((snap: SimulationSnapshotDto) => {
    const cur = cursorRef.current;
    if (
      cur &&
      cur.runId === snap.runId &&
      (snap.generation < cur.generation ||
        (snap.generation === cur.generation && snap.version <= cur.version))
    ) {
      return;
    }
    cursorRef.current = {
      runId: snap.runId,
      generation: snap.generation,
      version: snap.version,
    };
    setSnapshot(snap);
    setSelectedRegistrationId((prev) => {
      if (prev && snap.athletes.some((a) => a.registrationId === prev)) {
        return prev;
      }
      return snap.athletes[0]?.registrationId ?? null;
    });
  }, []);

  const { joinRun, leaveRun } = useSimulationHub({
    onSnapshot: applySnapshot,
    onRunReplaced: (notice) => {
      void (async () => {
        try {
          await leaveRun(notice.previousRunId);
          const next = await getSimulationSnapshot(notice.runId);
          applySnapshot(next);
          await joinRun(notice.runId);
          toastInfo("Lượt giả lập đã được thay (reset/new).");
        } catch (e) {
          toastError(e, "Không chuyển sang lượt mới.");
        }
      })();
    },
    onError: (message) => toastError(message),
  });

  const loadPreview = useCallback(async () => {
    if (!eventId || !distanceId) return;
    setLoading(true);
    try {
      const p = await getSimulationPreview(eventId, distanceId);
      setPreview(p);
      if (p.activeRunId) {
        const snap = await getSimulationSnapshot(p.activeRunId);
        applySnapshot(snap);
        await joinRun(p.activeRunId);
      } else {
        setSnapshot(null);
        cursorRef.current = null;
      }
    } catch (e) {
      setPreview(null);
      setSnapshot(null);
      toastError(e, "Không tải giả lập (cần bật Simulation__Enabled trên API).");
    } finally {
      setLoading(false);
    }
  }, [eventId, distanceId, applySnapshot, joinRun]);

  useEffect(() => {
    void loadPreview();
    return () => {
      void leaveRun();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount theo cự ly
  }, [eventId, distanceId]);

  const athletes = snapshot?.athletes ?? [];
  const ranking = snapshot?.ranking ?? [];
  const phase = snapshot?.phase ?? null;
  const selected =
    athletes.find((a) => a.registrationId === selectedRegistrationId) ??
    athletes[0] ??
    null;

  const liveForMap = useMemo(
    () => athleteToLive(athletes, selectedRegistrationId),
    [athletes, selectedRegistrationId]
  );
  const focusBib = selected
    ? bibMapKey(
        selected.bib,
        athletes.findIndex((a) => a.registrationId === selected.registrationId)
      )
    : undefined;

  const athletePages = Math.max(1, Math.ceil(athletes.length / ATHLETE_PAGE_SIZE));
  const rankingPages = Math.max(1, Math.ceil(ranking.length / RANKING_PAGE_SIZE));
  const pagedAthletes = athletes.slice(
    athletePage * ATHLETE_PAGE_SIZE,
    athletePage * ATHLETE_PAGE_SIZE + ATHLETE_PAGE_SIZE
  );
  const pagedRanking = ranking.slice(
    rankingPage * RANKING_PAGE_SIZE,
    rankingPage * RANKING_PAGE_SIZE + RANKING_PAGE_SIZE
  );

  useEffect(() => {
    setAthletePage((p) => Math.min(p, athletePages - 1));
  }, [athletePages]);
  useEffect(() => {
    setRankingPage((p) => Math.min(p, rankingPages - 1));
  }, [rankingPages]);

  const eligibleCount = preview?.eligibleCount ?? 0;
  const runnerCountChoices = [6, 20, 50, 200].filter((n) => n <= eligibleCount);

  useEffect(() => {
    if (runnerCountPref != null && eligibleCount > 0 && runnerCountPref > eligibleCount) {
      setRunnerCountPref(null);
    }
  }, [eligibleCount, runnerCountPref]);

  const runAction = async (
    label: string,
    fn: () => Promise<SimulationSnapshotDto>
  ) => {
    setBusy(true);
    try {
      const snap = await fn();
      applySnapshot(snap);
      if (snap.runId) await joinRun(snap.runId);
    } catch (e) {
      toastError(e, `${label} thất bại.`);
    } finally {
      setBusy(false);
    }
  };

  const onCreateRun = async () => {
    if (!eventId || !distanceId) return;
    setBusy(true);
    try {
      const snap = await createSimulationRun(eventId, distanceId, {
        runnerCount: runnerCountPref,
      });
      applySnapshot(snap);
      await joinRun(snap.runId);
      toastSuccess(`Đã tạo lượt · ${snap.athletes.length} VĐV.`);
    } catch (e) {
      toastError(e, "Tạo lượt thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const onStart = async () => {
    if (!snapshot) return;
    if (phase === "Paused") {
      await runAction("Tiếp tục", () => resumeSimulationRun(snapshot.runId));
      return;
    }
    if (phase === "Ready") {
      await runAction("Xuất phát", () => startSimulationRun(snapshot.runId));
    }
  };

  const onPause = async () => {
    if (!snapshot || phase !== "Running") return;
    await runAction("Tạm dừng", () => pauseSimulationRun(snapshot.runId));
  };

  const onPlayback = async (rate: number) => {
    if (!snapshot) return;
    await runAction("Tốc độ phát", () =>
      setSimulationPlayback(snapshot.runId, rate)
    );
  };

  const onReset = async () => {
    if (!snapshot) return;
    const needConfirm = snapshot.discardRequired;
    if (
      needConfirm &&
      !window.confirm(
        "Reset sẽ thay lượt và bỏ kết quả, báo cáo nháp. Kết quả đã commit vẫn được giữ. Tiếp tục?"
      )
    ) {
      return;
    }
    await runAction("Reset", () =>
      resetSimulationRun(snapshot.runId, needConfirm)
    );
  };

  const onCommit = async () => {
    if (!snapshot || snapshot.phase !== "Finished") return;
    setBusy(true);
    try {
      const res = await commitSimulationRun(snapshot.runId);
      applySnapshot(res.snapshot);
      if (!res.accepted) {
        toastError(res.refusalReason || "Commit bị từ chối.");
        return;
      }
      const ok = res.items.filter((i) => i.outcome === "CommittedThisRun").length;
      const skipped = res.items.length - ok;
      toastSuccess(
        `Đã ghi ${ok} kết quả/trạng thái lên hệ thống` +
          (skipped ? ` · ${skipped} bỏ qua hoặc cần thử lại` : "") +
          ". Chỉ VĐV về đích hợp lệ được xếp hạng."
      );
    } catch (e) {
      toastError(e, "Ghi kết quả thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const onSpeedSelected = async (kmh: number) => {
    if (!snapshot || !selected) return;
    await runAction("Đổi tốc độ", () =>
      setAthleteSpeed(snapshot.runId, selected.registrationId, kmh)
    );
  };

  const onSos = async () => {
    if (!snapshot || !selected) return;
    await runAction("SOS", () =>
      markAthleteSos(snapshot.runId, selected.registrationId)
    );
    toastInfo("SOS chỉ gắn cờ trên lượt giả lập — không tạo SOS thiết bị.");
  };


  const panel = "rounded-xl border border-border/60 bg-card shadow-sm";
  const polyline = snapshot?.polyline?.length
    ? snapshot.polyline
    : preview?.polyline?.length
      ? preview.polyline
      : applied.polyline;
  const checkpoints = snapshot?.checkpoints?.length
    ? snapshot.checkpoints
    : preview?.checkpoints?.length
      ? preview.checkpoints
      : applied.checkpoints;
  const distanceKm =
    snapshot?.distanceKm || preview?.distanceKm || applied.distanceKm;

  if (!distanceId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Chọn cự ly để giả lập.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
        Đang tải preview giả lập…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 text-foreground">
      {snapshot && <SimulationDecisionPanel key={snapshot.runId} snapshot={snapshot} selectedId={selectedRegistrationId} onSnapshot={next => {
        if (cursorRef.current?.runId === next.runId) applySnapshot(next);
      }} />}
      {!snapshot ? (
        <div className={`${panel} flex flex-wrap items-center gap-3 p-4`}>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-bold text-foreground">Chưa có lượt giả lập</p>
            <p className="text-xs text-muted-foreground">
              Eligible = Confirmed + có BIB + chưa xuất phát + chưa có kết quả
              (không phải capacity/slot cự ly). VĐV đã ghi finish không còn trong pool.
              {preview && !preview.courseReady
                ? ` Course: ${preview.courseError || "chưa sẵn sàng"}.`
                : ""}
            </p>
            <p className="mt-1 text-xs font-medium text-orange-600 tabular-nums">
              Còn {eligibleCount} VĐV đủ điều kiện giả lập
              {eligibleCount === 0
                ? " — cần thêm registration Confirmed/BIB hoặc reset kết quả cũ."
                : "."}
            </p>
          </div>
          <label className="text-[11px] text-muted-foreground">
            Số VĐV
            <select
              value={runnerCountPref ?? ""}
              onChange={(e) =>
                setRunnerCountPref(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              disabled={eligibleCount === 0}
              className="ml-2 rounded-lg border border-border bg-background px-2 py-1.5 disabled:opacity-50"
            >
              <option value="">
                Tất cả ({eligibleCount})
              </option>
              {runnerCountChoices.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={
              busy ||
              preview?.courseReady === false ||
              eligibleCount === 0
            }
            onClick={() => void onCreateRun()}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Flag className="h-3.5 w-3.5" />
            )}
            Tạo lượt
          </button>
        </div>
      ) : null}

      {snapshot ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto xl:grid-cols-[240px_1fr_240px]">
          <aside className="space-y-3">
            <div className={`${panel} space-y-3 p-4`}>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Flag className="h-4 w-4 text-orange-500" /> Vận động viên
              </h2>
              <div className="max-h-56 overflow-y-auto overscroll-contain rounded-lg border border-border/50">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 z-[1] bg-muted/95 text-muted-foreground backdrop-blur-sm">
                    <tr>
                      <th className="p-2 text-left">BIB</th>
                      <th className="p-2 text-left">Tên</th>
                      <th className="p-2 text-right">km</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAthletes.map((a) => (
                      <tr
                        key={a.registrationId}
                        onClick={() =>
                          setSelectedRegistrationId(a.registrationId)
                        }
                        className={`cursor-pointer border-t border-border/40 hover:bg-orange-500/5 ${
                          selectedRegistrationId === a.registrationId
                            ? "bg-orange-500/10"
                            : ""
                        }`}
                      >
                        <td className="p-2 font-bold">{a.bib}</td>
                        <td className="max-w-[100px] truncate p-2">
                          {a.fullName}
                          {a.sos ? " ·SOS" : ""}
                          {a.motion === "Dnf" ? " ·DNF" : ""}
                        </td>
                        <td className="p-2 text-right tabular-nums">
                          {a.courseKm.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ListPager
                page={athletePage}
                totalPages={athletePages}
                total={athletes.length}
                pageSize={ATHLETE_PAGE_SIZE}
                onPage={setAthletePage}
              />
              {selected ? (
                <label className="block space-y-1 text-xs">
                  <span className="text-muted-foreground">
                    Tốc độ BIB {selected.bib} (km/h) — thả chuột để điều chỉnh tốc độ
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={0.1}
                    defaultValue={selected.speedKmh}
                    key={`${selected.registrationId}-${selected.speedKmh}`}
                    disabled={busy || phase === "Finished"}
                    onPointerUp={(e) =>
                      void onSpeedSelected(
                        Number((e.target as HTMLInputElement).value)
                      )
                    }
                    className="w-full accent-orange-500"
                  />
                  <span className="font-semibold tabular-nums text-orange-600">
                    {selected.speedKmh.toFixed(1)}
                  </span>
                </label>
              ) : null}
            </div>

            <div className={`${panel} space-y-2 p-4`}>
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Trophy className="h-4 w-4 text-orange-500" /> Ranking
              </h2>
              <ul className="max-h-56 space-y-1 overflow-y-auto overscroll-contain text-xs">
                {ranking.length === 0 ? (
                  <li className="text-muted-foreground">Chưa có kết quả.</li>
                ) : null}
                {pagedRanking.map((row) => (
                  <li
                    key={row.registrationId}
                    className="flex justify-between gap-2 rounded-lg bg-muted/40 px-2 py-1.5"
                  >
                    <span>
                      <span className="font-bold text-orange-600">
                        #{row.rank}
                      </span>{" "}
                      {row.bib} {row.fullName}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatSimClock(row.resultSeconds)}
                    </span>
                  </li>
                ))}
              </ul>
              <ListPager
                page={rankingPage}
                totalPages={rankingPages}
                total={ranking.length}
                pageSize={RANKING_PAGE_SIZE}
                onPage={setRankingPage}
              />
            </div>
          </aside>

          <main className="flex min-h-[640px] flex-col gap-3">
            <div className={`${panel} flex flex-wrap items-center gap-2 p-3`}>
              <button
                type="button"
                disabled={
                  busy ||
                  !phase ||
                  (phase !== "Ready" && phase !== "Paused")
                }
                onClick={() => void onStart()}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                {phase === "Paused" ? "Tiếp tục" : "Bắt đầu"}
              </button>
              <button
                type="button"
                disabled={busy || phase !== "Running"}
                onClick={() => void onPause()}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <Pause className="h-3.5 w-3.5" /> Tạm dừng
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onReset()}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  phase !== "Finished" || snapshot.decisions?.some(d => d.resolution === "Pending") ||
                  snapshot.commitState === "Committed" ||
                  snapshot.commitState === "Committing"
                }
                onClick={() => void onCommit()}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-600/15 disabled:opacity-50"
              >
                {busy && snapshot.commitState === "Committing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {snapshot.commitState === "Committed"
                  ? "Đã ghi kết quả"
                  : "Ghi kết quả"}
              </button>
              <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                Speed
                <select
                  value={snapshot.playbackRate}
                  disabled={busy}
                  onChange={(e) => void onPlayback(Number(e.target.value))}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground"
                >
                  {PLAYBACK_RATES.map((r) => (
                    <option key={r} value={r}>
                      {r}×
                    </option>
                  ))}
                </select>
              </label>
              <span className="font-mono text-sm tabular-nums text-orange-600">
                {formatSimClock(snapshot.simulatedSeconds)}
              </span>
            </div>

            <div
              className={`${panel} relative min-h-[360px] flex-1 overflow-hidden`}
            >
              <MapView
                key={`${snapshot.runId}-${snapshot.generation}`}
                live={liveForMap}
                focusBib={focusBib}
                polyline={polyline}
                checkpoints={checkpoints.map((c) => ({
                  id: c.id,
                  name: c.name,
                  km: c.km,
                  lat: c.lat,
                  lng: c.lng,
                  type:
                    c.type === "start" || c.type === "finish" || c.type === "aid"
                      ? c.type
                      : "cp",
                }))}
                distanceKm={distanceKm}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className={`${panel} flex min-h-0 flex-col p-4`}>
                <h3 className="mb-2 shrink-0 text-sm font-bold">
                  Checkpoint leaders
                </h3>
                <div className="max-h-52 overflow-y-auto overscroll-contain">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 z-[1] bg-card text-muted-foreground">
                      <tr>
                        <th className="py-1 text-left">Điểm</th>
                        <th className="py-1 text-left">Leader</th>
                        <th className="py-1 text-right">Split</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkpoints.map((cp) => {
                        const lead = snapshot.checkpointLeaders.find(
                          (l) => l.checkpointId === cp.id
                        );
                        return (
                          <tr key={cp.id} className="border-t border-border/40">
                            <td className="py-1.5">
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${checkpointDotClass(
                                    cp.type === "start" ||
                                      cp.type === "finish" ||
                                      cp.type === "aid"
                                      ? cp.type
                                      : "cp"
                                  )}`}
                                />
                                {cp.name}
                              </span>
                            </td>
                            <td className="py-1.5">
                              {lead ? `BIB ${lead.bib}` : "—"}
                            </td>
                            <td className="py-1.5 text-right tabular-nums">
                              {lead ? formatSimClock(lead.simSeconds) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={`${panel} flex min-h-0 flex-col p-4`}>
                <h3 className="mb-2 shrink-0 text-sm font-bold">Nhật ký server</h3>
                <ul className="max-h-52 space-y-1 overflow-y-auto overscroll-contain font-mono text-[11px] text-muted-foreground">
                  {(snapshot.log ?? []).length === 0 ? (
                    <li>Chưa có log.</li>
                  ) : null}
                  {[...(snapshot.log ?? [])].reverse().map((l) => (
                    <li
                      key={l.sequence}
                      className={
                        l.kind === "FRAUD" || l.kind === "SOS"
                          ? "text-red-600"
                          : undefined
                      }
                    >
                      [{formatSimClock(l.simSeconds)}] {l.kind} · {l.subject}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </main>

          <aside className="space-y-3">
            <div className={`${panel} space-y-3 p-4`}>
              <h2 className="text-sm font-bold">Điều khiển VĐV</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !selected || phase === "Finished"}
                  onClick={() => void onSos()}
                  className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"
                >
                  <Siren className="h-3.5 w-3.5" /> SOS
                </button>

              </div>
            </div>

            <div
              className={`${panel} space-y-2 border-red-500/20 bg-red-500/[0.04] p-4`}
            >
              <h2 className="flex items-center gap-2 text-sm font-bold text-red-700">
                <AlertTriangle className="h-4 w-4" /> Fraud / SOS
              </h2>
              <ul className="max-h-56 space-y-2 overflow-y-auto overscroll-contain text-[11px]">
                {athletes.filter((a) => a.sos || ["Dnf", "Dns", "Dq"].includes(a.motion)).length ===
                0 ? (
                  <li className="text-muted-foreground">Chưa có cảnh báo.</li>
                ) : null}
                {athletes
                  .filter((a) => a.sos || ["Dnf", "Dns", "Dq"].includes(a.motion))
                  .map((a) => (
                    <li
                      key={a.registrationId}
                      className="rounded-lg border border-red-500/20 bg-card p-2"
                    >
                      <p className="font-bold text-red-700">
                        BIB {a.bib}
                        {a.sos ? " · SOS" : ""}
                        {a.motion === "Dnf" ? " · DNF" : ""}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {a.fullName}
                      </p>
                    </li>
                  ))}
                {(snapshot.log ?? [])
                  .filter((l) => l.kind === "FRAUD")
                  .slice(-8)
                  .reverse()
                  .map((l) => (
                    <li
                      key={`fraud-${l.sequence}`}
                      className="rounded-lg border border-red-500/20 bg-card p-2"
                    >
                      <p className="font-bold text-red-700">FRAUD</p>
                      <p className="mt-0.5 text-muted-foreground">{l.subject}</p>
                    </li>
                  ))}
              </ul>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
