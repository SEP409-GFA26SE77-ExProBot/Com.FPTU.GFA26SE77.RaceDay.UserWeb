import api from "@/config/axios";
import type { AthleteMotion, SimulationCheckpointDto, SimulationLatLng, SimulationPhase, SimulationDecisionDto } from "@/api/simulation";

export type StaffAthlete = {
  registrationId: string; bib: string; fullName: string; motion: AthleteMotion; sos: boolean;
  courseKm: number; speedKmh: number; passedAtSeconds: number | null; remainingKm: number;
  canDnf: boolean; canDns: boolean; canReport: boolean;
};

export type StaffCheckpointSnapshot = {
  eventId: string; eventName: string; distanceId: string; title: string;
  checkpoint: SimulationCheckpointDto; polyline: SimulationLatLng[]; distanceKm: number;
  runId: string | null; generation: number; version: number; phase: SimulationPhase | null;
  simulatedSeconds: number; playbackRate: number; commitState: string | null;
  athletes: StaffAthlete[]; decisions: SimulationDecisionDto[];
};

export const getStaffCheckpoint = (eventId: string): Promise<StaffCheckpointSnapshot> =>
  api.get(`api/v1/simulation/staff/events/${eventId}/checkpoint`);

export const recordStaffDecision = (eventId: string, runId: string, registrationId: string,
  body: { status: "DNF" | "DNS" | "DQ"; reason: string; evidence?: string }): Promise<StaffCheckpointSnapshot> =>
  api.post(`api/v1/simulation/staff/events/${eventId}/runs/${runId}/athletes/${registrationId}/decisions`, body);
