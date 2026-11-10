/**
 * Organizer race simulation — REST qua BFF `/api/backend`.
 * Realtime vị trí: SignalR hub (xem `useSimulationHub`).
 */
import api from "@/config/axios";

const SIM = "api/v1/simulation";

export type SimulationPhase = "Ready" | "Running" | "Paused" | "Finished";
export type SimulationCommitState =
  | "Idle"
  | "Committing"
  | "Partial"
  | "Committed";
export type AthleteMotion = "Racing" | "Finished" | "Dnf";

export type SimulationLatLng = { lat: number; lng: number };

export type SimulationCheckpointDto = {
  id: string;
  name: string;
  km: number;
  lat: number;
  lng: number;
  type: string;
};

export type SimulationAthleteSplitDto = {
  checkpointId: string;
  name: string;
  km: number;
  simSeconds: number;
};

export type SimulationAthleteDto = {
  registrationId: string;
  bib: string;
  fullName: string;
  chipId: string;
  baseKmh: number;
  speedKmh: number;
  courseKm: number;
  motion: AthleteMotion;
  sos: boolean;
  validFinish: boolean;
  resultSeconds: number | null;
  finishSimSeconds: number | null;
  splits: SimulationAthleteSplitDto[];
};

export type SimulationRankingRowDto = {
  rank: number;
  registrationId: string;
  bib: string;
  fullName: string;
  resultSeconds: number;
  finishSimSeconds: number;
};

export type SimulationCheckpointLeaderDto = {
  checkpointId: string;
  registrationId: string;
  bib: string;
  simSeconds: number;
};

export type SimulationLogLineDto = {
  sequence: number;
  simSeconds: number;
  kind: string;
  subject: string;
};

export type SimulationSnapshotDto = {
  runId: string;
  generation: number;
  version: number;
  eventId: string;
  distanceId: string;
  phase: SimulationPhase;
  commitState: SimulationCommitState;
  seed: number;
  playbackRate: number;
  simulatedSeconds: number;
  distanceKm: number;
  title: string;
  discardRequired: boolean;
  committedRegistrationIds: string[];
  polyline: SimulationLatLng[];
  checkpoints: SimulationCheckpointDto[];
  athletes: SimulationAthleteDto[];
  ranking: SimulationRankingRowDto[];
  checkpointLeaders: SimulationCheckpointLeaderDto[];
  log: SimulationLogLineDto[];
};

export type SimulationPreviewDto = {
  eventId: string;
  distanceId: string;
  title: string;
  distanceKm: number;
  eligibleCount: number;
  courseReady: boolean;
  courseError: string | null;
  polyline: SimulationLatLng[];
  checkpoints: SimulationCheckpointDto[];
  activeRunId: string | null;
};

export type SimulationRunReplacedDto = {
  previousRunId: string;
  previousGeneration: number;
  runId: string;
  generation: number;
  version: number;
};

export type SimulationCommitItemDto = {
  registrationId: string;
  outcome: string;
  reason: string | null;
  resultSeconds: number | null;
};

export type SimulationCommitResponseDto = {
  accepted: boolean;
  refusalReason: string | null;
  items: SimulationCommitItemDto[];
  snapshot: SimulationSnapshotDto;
};

function simError(e: unknown, fallback: string): Error {
  const data = (e as { response?: { data?: { error?: string } } })?.response
    ?.data;
  return new Error(data?.error || fallback);
}

export async function getSimulationPreview(
  eventId: string,
  distanceId: string
): Promise<SimulationPreviewDto> {
  try {
    return (await api.get(
      `${SIM}/events/${eventId}/distances/${distanceId}`
    )) as SimulationPreviewDto;
  } catch (e) {
    throw simError(e, "Không tải preview giả lập.");
  }
}

export async function createSimulationRun(
  eventId: string,
  distanceId: string,
  body?: { runnerCount?: number | null; seed?: number | null }
): Promise<SimulationSnapshotDto> {
  try {
    return (await api.post(
      `${SIM}/events/${eventId}/distances/${distanceId}/runs`,
      body ?? {}
    )) as SimulationSnapshotDto;
  } catch (e) {
    throw simError(e, "Không tạo lượt giả lập.");
  }
}

export async function getSimulationSnapshot(
  runId: string
): Promise<SimulationSnapshotDto> {
  try {
    return (await api.get(`${SIM}/runs/${runId}`)) as SimulationSnapshotDto;
  } catch (e) {
    throw simError(e, "Không tải snapshot giả lập.");
  }
}

async function postRun(
  runId: string,
  action: string,
  body?: unknown
): Promise<SimulationSnapshotDto> {
  try {
    return (await api.post(
      `${SIM}/runs/${runId}/${action}`,
      body ?? undefined
    )) as SimulationSnapshotDto;
  } catch (e) {
    throw simError(e, `Thao tác ${action} thất bại.`);
  }
}

export const startSimulationRun = (runId: string) => postRun(runId, "start");
export const pauseSimulationRun = (runId: string) => postRun(runId, "pause");
export const resumeSimulationRun = (runId: string) => postRun(runId, "resume");

export const setSimulationPlayback = (runId: string, rate: number) =>
  postRun(runId, "playback", { rate });

export const resetSimulationRun = (
  runId: string,
  confirmDiscard = false
) => postRun(runId, "reset", { confirmDiscard });

export const newSimulationRun = (
  runId: string,
  body?: {
    confirmDiscard?: boolean;
    seed?: number | null;
    runnerCount?: number | null;
  }
) => postRun(runId, "new", body ?? { confirmDiscard: true });

export async function commitSimulationRun(
  runId: string
): Promise<SimulationCommitResponseDto> {
  try {
    return (await api.post(
      `${SIM}/runs/${runId}/commit`
    )) as SimulationCommitResponseDto;
  } catch (e) {
    throw simError(e, "Ghi kết quả giả lập thất bại.");
  }
}

export const setAthleteSpeed = (
  runId: string,
  registrationId: string,
  kmh: number
) =>
  postRun(runId, `athletes/${registrationId}/speed`, { kmh });

export const markAthleteSos = (runId: string, registrationId: string) =>
  postRun(runId, `athletes/${registrationId}/sos`);

export const markAthleteDnf = (runId: string, registrationId: string) =>
  postRun(runId, `athletes/${registrationId}/dnf`);

export function simulationHubUrl(): string {
  const origin = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!origin) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_API_URL — hub SignalR cần gọi thẳng host API (vd http://localhost:5080)."
    );
  }
  return `${origin}/api/v1/simulation/hub`;
}

export async function fetchHubAccessToken(): Promise<string> {
  const res = await fetch("/api/auth/hub-token", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error("Không lấy được token cho SignalR (đăng nhập lại).");
  }
  const body = (await res.json()) as { accessToken?: string };
  if (!body.accessToken) {
    throw new Error("Token hub trống.");
  }
  return body.accessToken;
}

export function formatSimClock(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return "—";
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return [h, m, r].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Map BIB string → số ổn định cho MapView (marker key). */
export function bibMapKey(bib: string, fallback: number): number {
  const digits = parseInt(bib.replace(/\D/g, ""), 10);
  if (Number.isFinite(digits) && digits > 0) return digits;
  let h = 0;
  for (let i = 0; i < bib.length; i++) h = (h * 31 + bib.charCodeAt(i)) >>> 0;
  return (h % 900000) + fallback + 1;
}
