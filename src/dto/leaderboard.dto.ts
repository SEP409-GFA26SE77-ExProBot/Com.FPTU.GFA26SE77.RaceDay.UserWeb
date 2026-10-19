export type LeaderboardGender = "All" | "Male" | "Female";

export interface LeaderboardDistanceDto {
  id: string;
  type: string;
  distanceKm: number;
}

export interface LeaderboardEntryDto {
  rank: number | null;
  eventName: string;
  distanceName: string;
  bib: string | null;
  fullName: string;
  startAtUtc: string | null;
  finishAtUtc: string | null;
  totalTime: string | null;
  pace: string | null;
}

export interface LeaderboardPageDto {
  items: LeaderboardEntryDto[];
  page: number;
  hasMore: boolean;
  totalCount?: number;
  fetchedAt: number;
}
