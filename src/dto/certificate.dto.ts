export interface RunnerCertificateDto {
  registrationId: string;
  runnerName: string;
  eventName: string;
  bib: string | null;
  distance: string;
  raceDate: string;
  status: "finished";
  /** Elapsed race time (HH:mm:ss); hours can exceed 24. */
  finishTime: string;
  resultSeconds: number;
  finishedAtUtc: string;
  startedAtUtc: string | null;
  distanceKm: number;
  /** Average pace (mm:ss per kilometre), rounded to the nearest second. */
  pace: string;
}

export type RunnerCertificateResponse = RunnerCertificateDto | false;
