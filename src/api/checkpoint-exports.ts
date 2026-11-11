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

export const getStaffCheckpointExport = (eventId: string): Promise<CheckpointResultExport | null> =>
  api.get(`${base}/staff/events/${eventId}/checkpoint/export`);

export const submitStaffCheckpointExport = (eventId: string, runId: string): Promise<CheckpointResultExport> =>
  api.post(`${base}/staff/events/${eventId}/runs/${runId}/checkpoint/export`);

export const listCheckpointExports = (eventId: string, distanceId: string): Promise<CheckpointResultExport[]> =>
  api.get(`${base}/events/${eventId}/distances/${distanceId}/checkpoint-exports`);
