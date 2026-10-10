"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Flag,
  Pause,
  Play,
  RotateCcw,
  Siren,
  Trophy,
} from "lucide-react";
import {
  DEMO_EVENT,
  SEED_RUNNERS,
  generateField,
  type SimRunner,
} from "@/api/race-map.mock-data";
import { useCourse } from "@/components/organizer/race-map/CourseContext";
import { formatClock } from "@/lib/race-map/geo";
import {
  advanceRunners,
  applyPassagesToLive,
  buildOfficialBinds,
  buildRanking,
  detectNewPassages,
  evaluateFraud,
  initLive,
  type FraudFlag,
  type Passage,
  type RunnerLive,
} from "@/lib/race-map/timing";

const MapView = dynamic(() => import("@/components/organizer/race-map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-slate-800 text-sm text-slate-400">
      Đang tải bản đồ OSM…
    </div>
  ),
});

type Phase = "idle" | "running" | "paused";

export default function RaceSimulator() {
  const { applied, appliedVersion } = useCourse();
  const checkpoints = applied.checkpoints;
  const distanceKm = applied.distanceKm;

  const [runners, setRunners] = useState<SimRunner[]>(SEED_RUNNERS);
  const [live, setLive] = useState<RunnerLive[]>(() => initLive(SEED_RUNNERS));
  const [passages, setPassages] = useState<Passage[]>([]);
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [speedMode, setSpeedMode] = useState(1);
  const [focusBib, setFocusBib] = useState(1024);
  const [selectedBib, setSelectedBib] = useState(1024);
  const [fieldSize, setFieldSize] = useState(0);

  const binds = useMemo(() => buildOfficialBinds(runners), [runners]);
  const ranking = useMemo(() => buildRanking(live), [live]);
  const liveRef = useRef(live);
  const passagesRef = useRef(passages);
  const flagsRef = useRef(flags);
  const elapsedRef = useRef(0);
  const pendingLogs = useRef<string[]>([]);
  const courseRef = useRef({ checkpoints, distanceKm });
  courseRef.current = { checkpoints, distanceKm };

  /** Course mới từ Organizer → reset sim */
  useEffect(() => {
    setPhase("idle");
    setElapsed(0);
    elapsedRef.current = 0;
    setPassages([]);
    passagesRef.current = [];
    setFlags([]);
    flagsRef.current = [];
    const init = initLive(runners);
    setLive(init);
    liveRef.current = init;
    setLogs([
      `[course] Applied «${applied.title}» · ${distanceKm}km · ${checkpoints.length} CP · ${applied.polyline.length} pts`,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi apply version đổi
  }, [appliedVersion]);

  /** Không ghi đè ref khi engine đang chạy (tránh mất progress giữa 2 lần flush UI) */
  useEffect(() => {
    if (phase === "running") return;
    liveRef.current = live;
    passagesRef.current = passages;
    flagsRef.current = flags;
    elapsedRef.current = elapsed;
  }, [phase, live, passages, flags, elapsed]);

  const pushLog = useCallback((msg: string) => {
    pendingLogs.current = [
      `[${new Date().toLocaleTimeString("vi-VN")}] ${msg}`,
      ...pendingLogs.current,
    ].slice(0, 80);
  }, []);

  const applyFieldSize = (extra: number) => {
    const next = generateField(extra);
    setFieldSize(extra);
    setRunners(next);
    const init = initLive(next);
    setLive(init);
    liveRef.current = init;
    setPhase("idle");
    setElapsed(0);
    elapsedRef.current = 0;
    setPassages([]);
    passagesRef.current = [];
    setFlags([]);
    flagsRef.current = [];
    pendingLogs.current = [];
    setLogs([
      `[setup] Field ${next.length} VĐV — map chỉ vẽ ≤${DEMO_EVENT.mapMarkerLimit} marker; ranking/RFID theo event.`,
    ]);
  };

  const reset = () => {
    setPhase("idle");
    setElapsed(0);
    elapsedRef.current = 0;
    setPassages([]);
    passagesRef.current = [];
    setFlags([]);
    flagsRef.current = [];
    const init = initLive(runners);
    setLive(init);
    liveRef.current = init;
    pendingLogs.current = [];
    setLogs([
      `[${new Date().toLocaleTimeString("vi-VN")}] Đã thiết lập lại mô phỏng (local only — không ghi WebAPI).`,
    ]);
  };

  /** Engine tick nhanh; React/map chỉ flush theo uiFlushMs */
  useEffect(() => {
    if (phase !== "running") return;
    const tickMs = 100;
    let lastFlush = performance.now();

    const id = window.setInterval(() => {
      const dt = (tickMs / 1000) * speedMode;
      const nextElapsed = elapsedRef.current + dt;
      elapsedRef.current = nextElapsed;

      const { checkpoints: cps, distanceKm: dist } = courseRef.current;
      const prevLive = liveRef.current;
      let advanced = advanceRunners(prevLive, nextElapsed, dt, dist);
      const newPassages = detectNewPassages(
        prevLive,
        advanced,
        nextElapsed,
        passagesRef.current,
        cps
      );

      let dirtyUi = false;
      if (newPassages.length) {
        dirtyUi = true;
        const all = [...passagesRef.current, ...newPassages];
        passagesRef.current = all;
        advanced = applyPassagesToLive(advanced, newPassages);
        for (const p of newPassages) {
          const cp = cps.find((c) => c.id === p.checkpointId);
          // Log RFID chỉ sample (tránh spam khi field lớn)
          if (all.length < 40 || p.bib === focusBib || p.bib === 888 || Math.random() < 0.08) {
            pushLog(
              `RFID · BIB ${p.bib} chip ${p.chipId} qua ${cp?.name ?? p.checkpointId} @ ${formatClock(p.readAtSec)}`
            );
          }
          const f = evaluateFraud(p, all, binds, advanced, nextElapsed, cps);
          if (f.length) {
            flagsRef.current = [...f, ...flagsRef.current].slice(0, 60);
            advanced = advanced.map((r) =>
              r.bib === p.bib ? { ...r, status: r.status === "finished" ? r.status : "flagged" } : r
            );
            f.forEach((x) => pushLog(`⚠ FRAUD ${x.code}: ${x.message}`));
          }
        }
      }

      liveRef.current = advanced;

      const now = performance.now();
      if (dirtyUi || now - lastFlush >= DEMO_EVENT.uiFlushMs) {
        lastFlush = now;
        setElapsed(nextElapsed);
        setLive(advanced);
        setPassages(passagesRef.current);
        setFlags(flagsRef.current);
        if (pendingLogs.current.length) {
          setLogs(pendingLogs.current);
        }
      }
    }, tickMs);

    return () => window.clearInterval(id);
  }, [phase, speedMode, binds, pushLog, focusBib]);

  const selected = runners.find((r) => r.bib === selectedBib) ?? runners[0];

  const updateSelected = (patch: Partial<SimRunner>) => {
    setRunners((list) =>
      list.map((r) => (r.bib === selectedBib ? { ...r, ...patch } : r))
    );
    if (phase === "idle") {
      setLive((list) =>
        list.map((r) =>
          r.bib === selectedBib
            ? {
                ...r,
                speedKmh: patch.speedKmh ?? r.speedKmh,
                startOffsetSec: patch.startOffsetSec ?? r.startOffsetSec,
                name: patch.name ?? r.name,
                chipId: patch.chipId ?? r.chipId,
              }
            : r
        )
      );
    }
  };

  const injectSos = () => {
    pushLog(`SOS demo · BIB ${focusBib} — gửi GPS mock (không ghi BE).`);
  };

  const injectDnf = () => {
    setLive((list) =>
      list.map((r) => (r.bib === focusBib ? { ...r, status: "flagged", speedKmh: 0 } : r))
    );
    setRunners((list) =>
      list.map((r) => (r.bib === focusBib ? { ...r, speedKmh: 0 } : r))
    );
    pushLog(`DNF demo · BIB ${focusBib} dừng trên course.`);
  };

  const panel = "rounded-xl border border-border/60 bg-card shadow-sm";

  return (
    <div className="text-foreground">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[260px_1fr_260px]">
        <aside className="space-y-3">
          <div className={`${panel} space-y-3 p-4`}>
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Flag className="h-4 w-4 text-orange-500" /> Vận động viên
            </h2>
            <div className="max-h-48 overflow-auto rounded-lg border border-border/50">
              <table className="w-full text-[11px]">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-2 text-left">BIB</th>
                    <th className="p-2 text-left">Tên</th>
                    <th className="p-2 text-right">km</th>
                  </tr>
                </thead>
                <tbody>
                  {live.map((r) => (
                    <tr
                      key={r.bib}
                      onClick={() => {
                        setSelectedBib(r.bib);
                        setFocusBib(r.bib);
                      }}
                      className={`cursor-pointer border-t border-border/40 hover:bg-orange-500/5 ${
                        selectedBib === r.bib ? "bg-orange-500/10" : ""
                      }`}
                    >
                      <td className="p-2 font-bold">{r.bib}</td>
                      <td className="max-w-[100px] truncate p-2">{r.name}</td>
                      <td className="p-2 text-right tabular-nums">
                        {r.courseKm.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected ? (
              <label className="block space-y-1 text-xs">
                <span className="text-muted-foreground">
                  Tốc độ BIB {selected.bib} (km/h)
                </span>
                <input
                  type="range"
                  min={6}
                  max={20}
                  step={0.1}
                  value={selected.speedKmh}
                  disabled={phase === "running"}
                  onChange={(e) =>
                    updateSelected({ speedKmh: Number(e.target.value) })
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
            <ul className="max-h-56 space-y-1 overflow-auto text-xs">
              {ranking.length === 0 ? (
                <li className="text-muted-foreground">Chưa có kết quả.</li>
              ) : null}
              {ranking.slice(0, 12).map((row) => (
                <li
                  key={row.bib}
                  className="flex justify-between gap-2 rounded-lg bg-muted/40 px-2 py-1.5"
                >
                  <span>
                    <span className="font-bold text-orange-600">#{row.rank}</span>{" "}
                    {row.bib} {row.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.finishTime ?? row.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex min-h-[640px] flex-col gap-3">
          <div className={`${panel} flex flex-wrap items-center gap-2 p-3`}>
            <button
              type="button"
              onClick={() => {
                if (phase === "idle") {
                  setLive(initLive(runners));
                  setPassages([]);
                  setFlags([]);
                  setElapsed(0);
                  pushLog("Bắt đầu mô phỏng RFID qua checkpoint.");
                }
                setPhase("running");
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-3 py-2 text-xs font-bold text-white"
            >
              <Play className="h-3.5 w-3.5" /> Bắt đầu
            </button>
            <button
              type="button"
              onClick={() => setPhase("paused")}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              <Pause className="h-3.5 w-3.5" /> Tạm dừng
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              Speed
              <select
                value={speedMode}
                onChange={(e) => setSpeedMode(Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-foreground"
              >
                <option value={1}>1×</option>
                <option value={5}>5×</option>
                <option value={20}>20×</option>
                <option value={60}>60×</option>
              </select>
            </label>
            <span className="font-mono text-sm tabular-nums text-orange-600">
              {formatClock(elapsed)}
            </span>
          </div>

          <div
            className={`${panel} relative min-h-[360px] flex-1 overflow-hidden`}
          >
            <MapView
              key={appliedVersion}
              live={live}
              focusBib={focusBib}
              polyline={applied.polyline}
              checkpoints={checkpoints}
              distanceKm={distanceKm}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className={`${panel} p-4`}>
              <h3 className="mb-2 text-sm font-bold">Checkpoint</h3>
              <table className="w-full text-[11px]">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1 text-left">CP</th>
                    <th className="py-1 text-left">Leader</th>
                    <th className="py-1 text-right">Split</th>
                  </tr>
                </thead>
                <tbody>
                  {checkpoints.map((cp) => {
                    const atCp = passages
                      .filter((p) => p.checkpointId === cp.id)
                      .slice()
                      .sort((a, b) => a.readAtSec - b.readAtSec);
                    const lead = atCp[0];
                    const leadLive = lead
                      ? live.find((r) => r.bib === lead.bib)
                      : undefined;
                    return (
                      <tr key={cp.id} className="border-t border-border/40">
                        <td className="py-1.5">{cp.name}</td>
                        <td className="py-1.5">
                          {lead ? `BIB ${lead.bib}` : "—"}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {lead && leadLive
                            ? formatClock(
                                lead.readAtSec - leadLive.startOffsetSec
                              )
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className={`${panel} p-4`}>
              <h3 className="mb-2 text-sm font-bold">Nhật ký</h3>
              <ul className="max-h-40 space-y-1 overflow-auto font-mono text-[11px] text-muted-foreground">
                {logs.length === 0 ? <li>Chưa có log.</li> : null}
                {logs.map((l, i) => (
                  <li
                    key={i}
                    className={l.includes("FRAUD") ? "text-red-600" : undefined}
                  >
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>

        <aside className="space-y-3">
          <div className={`${panel} space-y-3 p-4`}>
            <h2 className="text-sm font-bold">Cấu hình</h2>
            <p className="text-[11px] text-muted-foreground">
              {distanceKm} km · {checkpoints.length} CP · max{" "}
              {DEMO_EVENT.maxPlausibleKmh} km/h
            </p>
            <label className="block space-y-1 text-[11px]">
              <span className="text-muted-foreground">Số VĐV giả lập</span>
              <select
                value={fieldSize}
                disabled={phase === "running"}
                onChange={(e) => applyFieldSize(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5"
              >
                <option value={0}>Demo 6 VĐV</option>
                <option value={194}>~200 VĐV</option>
                <option value={994}>~1000 VĐV</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={injectSos}
                className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1.5 text-[11px] font-bold text-white"
              >
                <Siren className="h-3.5 w-3.5" /> SOS
              </button>
              <button
                type="button"
                onClick={injectDnf}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground hover:bg-muted"
              >
                DNF
              </button>
            </div>
          </div>

          <div
            className={`${panel} space-y-2 border-red-500/20 bg-red-500/[0.04] p-4`}
          >
            <h2 className="flex items-center gap-2 text-sm font-bold text-red-700">
              <AlertTriangle className="h-4 w-4" /> Fraud
            </h2>
            <ul className="max-h-72 space-y-2 overflow-auto text-[11px]">
              {flags.length === 0 ? (
                <li className="text-muted-foreground">Chưa có cảnh báo.</li>
              ) : null}
              {flags.map((f) => (
                <li
                  key={f.id}
                  className="rounded-lg border border-red-500/20 bg-card p-2"
                >
                  <p className="font-bold text-red-700">{f.code}</p>
                  <p className="mt-0.5 text-muted-foreground">{f.message}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
