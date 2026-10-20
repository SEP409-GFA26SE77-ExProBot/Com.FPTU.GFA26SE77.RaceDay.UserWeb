import { isAxiosError } from "axios";
import api from "@/config/axios";
import type {
  LeaderboardDistanceDto,
  LeaderboardEntryDto,
  LeaderboardGender,
  LeaderboardPageDto,
} from "@/dto/leaderboard.dto";
import { normalizeLeaderboardPage, normalizeMyLeaderboard } from "@/lib/leaderboard";
import {
  leaderboardCacheKey,
  readLeaderboardCache,
  writeLeaderboardCache,
} from "@/lib/leaderboard-cache";

const EVENT_API = "api/v1/event";
export const LEADERBOARD_PAGE_SIZE = 50;
const pendingPages = new Map<string, Promise<LeaderboardPageDto>>();

export async function getLeaderboardDistances(eventId: string): Promise<LeaderboardDistanceDto[]> {
  const response = (await api.get(`${EVENT_API}/distances`, {
    params: { eventId },
  })) as unknown;
  if (!Array.isArray(response)) throw new Error("Không tải được danh sách cự ly của giải.");
  return response as LeaderboardDistanceDto[];
}

export async function getEventLeaderboard(
  eventId: string,
  distanceId: string,
  gender: LeaderboardGender = "All",
  page = 1,
  pageSize = LEADERBOARD_PAGE_SIZE
): Promise<LeaderboardPageDto> {
  const key = leaderboardCacheKey(eventId, distanceId, gender, page, pageSize);
  const cached = readLeaderboardCache(key);
  if (cached) return cached;
  const pending = pendingPages.get(key);
  if (pending) return pending;

  const request = (async () => {
    const response = await api.get(
      `${EVENT_API}/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/leaderboard`,
      { params: { gender, page, pageSize } }
    );
    const result = normalizeLeaderboardPage(response, page, pageSize);
    writeLeaderboardCache(key, result);
    return result;
  })();
  pendingPages.set(key, request);
  try {
    return await request;
  } finally {
    pendingPages.delete(key);
  }
}

/** Personal results are fetched fresh and never stored in the public browser cache. */
export async function getMyLeaderboard(
  eventId: string,
  distanceId: string,
  gender: LeaderboardGender = "All"
): Promise<LeaderboardEntryDto | null> {
  try {
    const response = await api.get(`${EVENT_API}/leaderboards/mine`, {
      params: { eventId, distanceId, gender },
    });
    return normalizeMyLeaderboard(response);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}
