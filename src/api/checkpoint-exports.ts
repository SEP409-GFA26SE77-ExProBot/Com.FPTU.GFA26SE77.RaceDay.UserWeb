import api from "@/config/axios";

export type CheckpointResultExport = {
  runId: string;
  eventId: string;
  distanceId: string;
  checkpointId: string;
  checkpointName: string;
  checkpointKm: number;
  staffUserId: string;
  submittedAtUtc: string;
  rows: {
    registrationId: string;
    bib: string;
    fullName: string;
    motion: string;
    passedAtSeconds: number | null;
  }[];
  decisions: {
    registrationId: string;
    bib: string;
    status: string;
    reason: string;
    evidence: string | null;
    resolution: string;
  }[];
};

const base = "api/v1/simulation";

export const listCheckpointExports = (eventId: string, distanceId: string): Promise<CheckpointResultExport[]> =>
  api.get(`${base}/events/${eventId}/distances/${distanceId}/checkpoint-exports`);
