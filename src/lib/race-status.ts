import type { RaceStatus } from "@/dto/race-status.dto";

type RegistrationRaceStatus = { status: string; raceStatus?: RaceStatus | null };

/** Keep registration workflow status intact; use race status for the runner's result. */
export function getRegistrationDisplayStatus(registration: RegistrationRaceStatus): string {
  if (registration.status !== "confirmed" && registration.status !== "finished") return registration.status;
  return registration.raceStatus && registration.raceStatus !== "not_started"
    ? registration.raceStatus
    : registration.status;
}

/** Missing raceStatus supports API responses from before the race-status migration. */
export function hasFinishedRace(registration: RegistrationRaceStatus): boolean {
  return registration.status === "finished"
    && (registration.raceStatus == null || registration.raceStatus === "finished");
}
