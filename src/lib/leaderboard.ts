import type {
  LeaderboardDistanceDto,
  LeaderboardEntryDto,
  LeaderboardGender,
  LeaderboardPageDto,
} from "@/dto/leaderboard.dto";
import { normalizeDistanceType } from "@/lib/distance-types";

export const LEADERBOARD_GENDERS: {
  value: LeaderboardGender;
  code: string;
  label: string;
}[] = [
  { value: "All", code: "All", label: "Tất cả" },
  { value: "Male", code: "M", label: "Nam" },
  { value: "Female", code: "F", label: "Nữ" },
];

export function distanceCategory(distance: LeaderboardDistanceDto): string {
  // Ưu tiên type chip BXH đã lưu; fallback suy từ km (map vẫn dùng distanceKm).
  const fromType = normalizeDistanceType(distance.type, distance.distanceKm);
  if (fromType !== "OTHER") return fromType;
  if (Math.abs(distance.distanceKm - 42.195) < 0.3) return "M";
  if (Math.abs(distance.distanceKm - 21.0975) < 0.2) return "HM";
  return distance.distanceKm > 0
    ? `${distance.distanceKm}KM`.replace(/\.0+KM$/, "KM")
    : fromType;
}

export function leaderboardEntryKey(entry: LeaderboardEntryDto): string {
  return entry.bib || `${entry.fullName}:${entry.startAtUtc}:${entry.rank}`;
}

export function mergeLeaderboardEntries(
  previous: LeaderboardEntryDto[],
  incoming: LeaderboardEntryDto[]
): LeaderboardEntryDto[] {
  const entries = new Map(previous.map((entry) => [leaderboardEntryKey(entry), entry]));
  for (const entry of incoming) entries.set(leaderboardEntryKey(entry), entry);
  return Array.from(entries.values());
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

/** Supports the API's row array and paginated items/data envelopes. */
export function normalizeLeaderboardPage(
  response: unknown,
  page: number,
  pageSize: number
): LeaderboardPageDto {
  const envelope = asRecord(response);
  const nested = asRecord(envelope?.data);
  const body = nested ?? envelope;
  const rows = Array.isArray(response)
    ? response
    : body?.items ?? body?.data ?? (response == null ? [] : undefined);
  if (!Array.isArray(rows)) throw new Error("Dữ liệu bảng xếp hạng không hợp lệ.");

  const totalCount = body?.totalCount ?? envelope?.totalCount;
  const totalPages = body?.totalPages ?? envelope?.totalPages;
  const hasNextPage = body?.hasNextPage ?? body?.hasMore ?? envelope?.hasNextPage;
  const hasMore = rows.length > 0 && (
    typeof hasNextPage === "boolean"
      ? hasNextPage
      : typeof totalPages === "number"
        ? page < totalPages
        : typeof totalCount === "number"
          ? page * pageSize < totalCount
          : rows.length >= pageSize
  );

  return {
    items: rows as LeaderboardEntryDto[],
    page,
    hasMore,
    ...(typeof totalCount === "number" ? { totalCount } : {}),
    fetchedAt: Date.now(),
  };
}

export function normalizeMyLeaderboard(response: unknown): LeaderboardEntryDto | null {
  if (response == null || response === "") return null;
  const body = asRecord(response);
  if (body && "data" in body) return normalizeMyLeaderboard(body.data);
  if (body && "items" in body) return normalizeMyLeaderboard(body.items);
  if (Array.isArray(response)) return normalizeMyLeaderboard(response[0]);
  if (body && "rank" in body) return body as unknown as LeaderboardEntryDto;
  throw new Error("Dữ liệu thứ hạng cá nhân không hợp lệ.");
}
