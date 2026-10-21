/**
 * Mã type cự ly cho chip BXH (All-3KM, All-HM…).
 * Khớp BE DistanceLeaderboardTypes — map route vẫn dùng distanceKm.
 */

/** Dropdown type phổ biến — cự ly lẻ chọn OTHER + nhập km. */
export const DISTANCE_LEADERBOARD_TYPES = [
  { code: "3KM", suggestedKm: 3, label: "3 km" },
  { code: "5KM", suggestedKm: 5, label: "5 km" },
  { code: "10KM", suggestedKm: 10, label: "10 km" },
  { code: "15KM", suggestedKm: 15, label: "15 km" },
  { code: "HM", suggestedKm: 21.0975, label: "Half Marathon (HM)" },
  { code: "M", suggestedKm: 42.195, label: "Marathon (M)" },
  { code: "OTHER", suggestedKm: 0, label: "Khác" },
] as const;

export type DistanceLeaderboardCode =
  (typeof DISTANCE_LEADERBOARD_TYPES)[number]["code"];

/** Mặt đường cũ — không gồm "other" (trùng mã chip BXH OTHER). */
const SURFACE = new Set(["road", "trail", "ultra", "track", "mixed"]);

const KNOWN = new Set(
  DISTANCE_LEADERBOARD_TYPES.map((t) => t.code.toUpperCase())
);

export function suggestDistanceTypeFromKm(km: number): DistanceLeaderboardCode {
  if (!Number.isFinite(km) || km <= 0) return "OTHER";
  if (Math.abs(km - 21.0975) < 0.35 || Math.abs(km - 21.1) < 0.2 || Math.abs(km - 21) < 0.15)
    return "HM";
  if (Math.abs(km - 42.195) < 0.4 || Math.abs(km - 42.2) < 0.25 || Math.abs(km - 42) < 0.2)
    return "M";

  let best: DistanceLeaderboardCode = "OTHER";
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const t of DISTANCE_LEADERBOARD_TYPES) {
    if (t.code === "OTHER" || t.suggestedKm <= 0) continue;
    const delta = Math.abs(km - t.suggestedKm);
    const tol = Math.max(0.6, t.suggestedKm * 0.08);
    if (delta <= tol && delta < bestDelta) {
      bestDelta = delta;
      best = t.code;
    }
  }
  return best;
}

export function normalizeDistanceType(
  raw?: string | null,
  distanceKm = 0
): DistanceLeaderboardCode {
  if (!raw || !String(raw).trim() || SURFACE.has(String(raw).trim().toLowerCase())) {
    return suggestDistanceTypeFromKm(distanceKm);
  }
  let t = String(raw).trim().toUpperCase().replace(/[\s-]/g, "");
  const alias: Record<string, DistanceLeaderboardCode> = {
    "5K": "5KM",
    "10K": "10KM",
    "15K": "15KM",
    "20K": "20KM",
    "21K": "HM",
    "21KM": "HM",
    HALF: "HM",
    HALFMARATHON: "HM",
    "42K": "M",
    "42KM": "M",
    MARATHON: "M",
    FULL: "M",
    "1K": "1KM",
    "2K": "2KM",
    "3K": "3KM",
    "50K": "50KM",
    "100K": "100KM",
    KHAC: "OTHER",
    OTHER: "OTHER",
  };
  t = alias[t] || t;
  if (KNOWN.has(t)) return t as DistanceLeaderboardCode;
  return suggestDistanceTypeFromKm(distanceKm);
}

export function suggestedKmForType(code: string): number | null {
  const hit = DISTANCE_LEADERBOARD_TYPES.find(
    (t) => t.code === normalizeDistanceType(code)
  );
  return hit && hit.suggestedKm > 0 ? hit.suggestedKm : null;
}

/** Prefix BIB theo type — chỉ số km (HM→21, M→42); OTHER → trống. */
export function suggestBibPrefix(type?: string | null, distanceKm = 0): string {
  const n = normalizeDistanceType(type, distanceKm);
  switch (n) {
    case "3KM":
      return "3";
    case "5KM":
      return "5";
    case "10KM":
      return "10";
    case "15KM":
      return "15";
    case "HM":
      return "21";
    case "M":
      return "42";
    default:
      return "";
  }
}

/** Chuẩn hoá input số BIB → 1–9999 (1 và 0001 đều thành 1; hiển thị D4). */
export function parseBibSequenceInput(raw: string): number | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  if (!/^\d{1,4}$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isInteger(n) || n < 1 || n > 9999) return null;
  return n;
}

export function formatBibPreview(prefix: string, sequence: number): string {
  const num = String(sequence).padStart(4, "0");
  const p = prefix.trim().toUpperCase();
  return p ? `${p}${num}` : num;
}
