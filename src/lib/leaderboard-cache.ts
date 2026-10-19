import type { LeaderboardPageDto } from "@/dto/leaderboard.dto";

export const LEADERBOARD_CACHE_TTL = 24 * 60 * 60 * 1000;
const PREFIX = "raceday:leaderboard:v1:";
type CacheEntry = { expiresAt: number; value: LeaderboardPageDto };
const memoryCache = new Map<string, CacheEntry>();

export function leaderboardCacheKey(
  eventId: string,
  distanceId: string,
  gender: string,
  page: number,
  pageSize: number
): string {
  return PREFIX + JSON.stringify([eventId, distanceId, gender, page, pageSize]);
}

export function readLeaderboardCache(key: string): LeaderboardPageDto | null {
  const memory = memoryCache.get(key);
  if (memory && memory.expiresAt > Date.now()) return memory.value;
  memoryCache.delete(key);
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.expiresAt > Date.now() && Array.isArray(entry.value?.items)) {
      memoryCache.set(key, entry);
      return entry.value;
    }
    window.localStorage.removeItem(key);
  } catch {
    // Private browsing or unavailable storage still allows API requests.
  }
  return null;
}

export function writeLeaderboardCache(key: string, value: LeaderboardPageDto): void {
  const entry = { expiresAt: value.fetchedAt + LEADERBOARD_CACHE_TTL, value };
  memoryCache.set(key, entry);
  if (typeof window === "undefined") return;
  try {
    // Remove expired pages before writing so they do not fill browser storage.
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const storedKey = window.localStorage.key(i);
      if (!storedKey?.startsWith(PREFIX)) continue;
      try {
        const stored = JSON.parse(window.localStorage.getItem(storedKey) || "null") as CacheEntry | null;
        if (!stored || stored.expiresAt <= Date.now()) window.localStorage.removeItem(storedKey);
      } catch {
        window.localStorage.removeItem(storedKey);
      }
    }
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Memory caching remains available if persistent storage is full or disabled.
  }
}
