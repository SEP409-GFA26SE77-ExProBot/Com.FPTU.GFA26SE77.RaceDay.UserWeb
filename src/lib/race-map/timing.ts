import { DEMO_EVENT, type Checkpoint, type SimRunner } from "@/api/race-map.mock-data";

export type FraudCode =
  | "CHIP_BIB_MISMATCH"
  | "CHIP_ALREADY_BOUND"
  | "IMPLAUSIBLE_SPLIT"
  | "OUT_OF_ORDER"
  | "DUPLICATE_READ";

export interface FraudFlag {
  id: string;
  code: FraudCode;
  bib: number;
  chipId: string;
  message: string;
  atSec: number;
  checkpointId?: string;
}

export interface Passage {
  id: string;
  bib: number;
  chipId: string;
  checkpointId: string;
  checkpointKm: number;
  readAtSec: number;
  source: "sim-rfid";
}

export interface RunnerLive {
  bib: number;
  chipId: string;
  name: string;
  gender: "Nam" | "Nữ";
  speedKmh: number;
  startOffsetSec: number;
  courseKm: number;
  status: "waiting" | "running" | "finished" | "flagged";
  lastCheckpointId?: string;
  finishSec?: number;
  splits: Record<string, number>;
}

export interface RankingRow {
  rank: number;
  bib: number;
  name: string;
  gender: string;
  finishTime: string | null;
  status: string;
}

function padClock(sec: number) {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return [h, m, r].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Official bind map: bib → chip (first registration wins; spoof runners reuse chips) */
export function buildOfficialBinds(runners: SimRunner[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const r of runners) {
    if (r.spoofChip) continue;
    map.set(r.bib, r.chipId);
  }
  return map;
}

export function initLive(runners: SimRunner[]): RunnerLive[] {
  return runners.map((r) => ({
    bib: r.bib,
    chipId: r.chipId,
    name: r.name,
    gender: r.gender,
    speedKmh: r.speedKmh,
    startOffsetSec: r.startOffsetSec,
    courseKm: 0,
    status: "waiting" as const,
    splits: {},
  }));
}

export function advanceRunners(
  live: RunnerLive[],
  elapsedSec: number,
  dtSec: number,
  distanceKm: number
): RunnerLive[] {
  return live.map((r) => {
    if (r.status === "finished") return r;
    if (elapsedSec < r.startOffsetSec) return { ...r, status: "waiting" };
    const moving = elapsedSec - r.startOffsetSec;
    const km = Math.min(distanceKm, (r.speedKmh * moving) / 3600);
    const finished = km >= distanceKm;
    return {
      ...r,
      courseKm: km,
      status: finished ? "finished" : "running",
      finishSec: finished ? r.finishSec ?? elapsedSec : r.finishSec,
    };
  });
}

export function detectNewPassages(
  prev: RunnerLive[],
  next: RunnerLive[],
  elapsedSec: number,
  existing: Passage[],
  checkpoints: Checkpoint[]
): Passage[] {
  const created: Passage[] = [];
  for (const n of next) {
    const p = prev.find((x) => x.bib === n.bib);
    if (!p) continue;
    for (const cp of checkpoints) {
      if (p.courseKm < cp.km && n.courseKm >= cp.km) {
        const already = existing.some(
          (e) => e.bib === n.bib && e.checkpointId === cp.id
        );
        if (already) continue;
        created.push({
          id: `p-${n.bib}-${cp.id}-${elapsedSec}`,
          bib: n.bib,
          chipId: n.chipId,
          checkpointId: cp.id,
          checkpointKm: cp.km,
          readAtSec: elapsedSec,
          source: "sim-rfid",
        });
      }
    }
  }
  return created;
}

export function applyPassagesToLive(
  live: RunnerLive[],
  passages: Passage[]
): RunnerLive[] {
  return live.map((r) => {
    const mine = passages.filter((p) => p.bib === r.bib);
    if (mine.length === 0) return r;
    const splits = { ...r.splits };
    let last = r.lastCheckpointId;
    for (const p of mine) {
      splits[p.checkpointId] = p.readAtSec - r.startOffsetSec;
      last = p.checkpointId;
    }
    return { ...r, splits, lastCheckpointId: last };
  });
}

export function evaluateFraud(
  passage: Passage,
  allPassages: Passage[],
  binds: Map<number, string>,
  live: RunnerLive[],
  elapsedSec: number,
  checkpoints: Checkpoint[],
  opts: { maxPlausibleKmh?: number; duplicateWindowSec?: number } = {}
): FraudFlag[] {
  const maxPlausibleKmh = opts.maxPlausibleKmh ?? DEMO_EVENT.maxPlausibleKmh;
  const duplicateWindowSec = opts.duplicateWindowSec ?? DEMO_EVENT.duplicateWindowSec;
  const flags: FraudFlag[] = [];
  const officialChip = binds.get(passage.bib);

  if (officialChip && officialChip !== passage.chipId) {
    flags.push({
      id: `f-mismatch-${passage.id}`,
      code: "CHIP_BIB_MISMATCH",
      bib: passage.bib,
      chipId: passage.chipId,
      checkpointId: passage.checkpointId,
      atSec: elapsedSec,
      message: `BIB ${passage.bib} đọc chip ${passage.chipId} ≠ chip đăng ký ${officialChip} (nghi tráo chip/BIB).`,
    });
  }

  const chipOwner = [...binds.entries()].find(([, c]) => c === passage.chipId)?.[0];
  if (chipOwner != null && chipOwner !== passage.bib) {
    flags.push({
      id: `f-bound-${passage.id}`,
      code: "CHIP_ALREADY_BOUND",
      bib: passage.bib,
      chipId: passage.chipId,
      checkpointId: passage.checkpointId,
      atSec: elapsedSec,
      message: `Chip ${passage.chipId} thuộc BIB ${chipOwner} nhưng vừa đọc tại BIB ${passage.bib}.`,
    });
  }

  const dup = allPassages.find(
    (e) =>
      e.id !== passage.id &&
      e.bib === passage.bib &&
      e.checkpointId === passage.checkpointId &&
      Math.abs(e.readAtSec - passage.readAtSec) < duplicateWindowSec
  );
  if (dup) {
    flags.push({
      id: `f-dup-${passage.id}`,
      code: "DUPLICATE_READ",
      bib: passage.bib,
      chipId: passage.chipId,
      checkpointId: passage.checkpointId,
      atSec: elapsedSec,
      message: `Duplicate RFID cùng CP trong ${duplicateWindowSec}s.`,
    });
  }

  const runner = live.find((r) => r.bib === passage.bib);
  const ordered = checkpoints.map((c) => c.id);
  const idx = ordered.indexOf(passage.checkpointId);
  if (runner && idx > 0) {
    const prevCp = ordered[idx - 1];
    if (runner.splits[prevCp] == null && passage.checkpointKm > 0) {
      flags.push({
        id: `f-order-${passage.id}`,
        code: "OUT_OF_ORDER",
        bib: passage.bib,
        chipId: passage.chipId,
        checkpointId: passage.checkpointId,
        atSec: elapsedSec,
        message: `Bỏ checkpoint trước (${prevCp}) — thứ tự CP không hợp lệ.`,
      });
    }
  }

  if (runner && idx > 0) {
    const prevCp = checkpoints[idx - 1];
    const prevSplit = runner.splits[prevCp.id];
    const thisSplit = passage.readAtSec - runner.startOffsetSec;
    if (prevSplit != null) {
      const dKm = passage.checkpointKm - prevCp.km;
      const dH = (thisSplit - prevSplit) / 3600;
      if (dH > 0) {
        const pace = dKm / dH;
        if (pace > maxPlausibleKmh) {
          flags.push({
            id: `f-pace-${passage.id}`,
            code: "IMPLAUSIBLE_SPLIT",
            bib: passage.bib,
            chipId: passage.chipId,
            checkpointId: passage.checkpointId,
            atSec: elapsedSec,
            message: `Tốc độ đoạn ${prevCp.km}→${passage.checkpointKm}km ≈ ${pace.toFixed(1)} km/h > ngưỡng ${maxPlausibleKmh} (nghi tráo).`,
          });
        }
      }
    }
  }

  return flags;
}

export function buildRanking(live: RunnerLive[]): RankingRow[] {
  const finished = live
    .filter((r) => r.finishSec != null && r.status !== "flagged")
    .slice()
    .sort((a, b) => (a.finishSec! - a.startOffsetSec) - (b.finishSec! - b.startOffsetSec));

  const rows: RankingRow[] = finished.map((r, i) => ({
    rank: i + 1,
    bib: r.bib,
    name: r.name,
    gender: r.gender,
    finishTime: padClock(r.finishSec! - r.startOffsetSec),
    status: "Finished",
  }));

  const running = live
    .filter((r) => r.status === "running" || r.status === "flagged")
    .sort((a, b) => b.courseKm - a.courseKm);

  for (const r of running) {
    rows.push({
      rank: rows.length + 1,
      bib: r.bib,
      name: r.name,
      gender: r.gender,
      finishTime: null,
      status: `Đang chạy ${r.courseKm.toFixed(1)}km`,
    });
  }

  return rows;
}
