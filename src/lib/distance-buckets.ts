/**
 * Bucket cự ly cố định cho filter khám phá giải.
 * Organizer nhập distanceKm / tên tự do — filter gom theo khoảng km thực tế.
 *
 * Filter theo khoảng km — không theo tên marketing (Fun Run / 10K…).
 * Chip: ~5 / ~10 / ~21… ; list API cần `distanceKms` (không dùng type mặt đường).
 */

export const DISTANCE_BUCKETS = [
  {
    key: "fun5",
    label: "~5km",
    minKm: 0,
    maxKm: 7.5, // exclusive → 3.419, 5, 7.4…
  },
  {
    key: "d10",
    label: "~10km",
    minKm: 7.5,
    maxKm: 15,
  },
  {
    key: "half",
    label: "~21km",
    minKm: 15,
    maxKm: 30,
  },
  {
    key: "full",
    label: "~42km",
    minKm: 30,
    maxKm: 50,
  },
  {
    key: "ultra",
    label: "~50–100km",
    minKm: 50,
    maxKm: 100,
  },
  {
    key: "super",
    label: ">100km",
    minKm: 100,
    maxKm: Infinity,
  },
] as const;

export type DistanceBucketKey = (typeof DISTANCE_BUCKETS)[number]["key"] | "all";

/** Type mặt đường — từng bị nhầm vào distanceTypes list API. */
const SURFACE_TYPES = new Set([
  "road",
  "trail",
  "ultra",
  "track",
  "other",
  "mixed",
]);

/** Parse "10K" / "21 km" / "5" từ label chip / legacy. */
export function parseKmFromLabel(raw: string): number | null {
  const t = (raw || "").trim().toLowerCase().replace(/,/g, ".");
  if (!t || SURFACE_TYPES.has(t)) return null;
  const m =
    t.match(/(\d+(?:\.\d+)?)\s*k(?:m)?\b/) || t.match(/^(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function eventDistanceKms(event: {
  distanceKms?: number[] | null;
  distances?: Array<{ distanceKm?: number | null; name?: string | null }> | null;
  distanceTypes?: string[] | null;
}): number[] {
  const fromKmsField = (event.distanceKms || [])
    .map((km) => Number(km))
    .filter((km) => Number.isFinite(km) && km > 0);
  if (fromKmsField.length) return fromKmsField;

  const fromDistances = (event.distances || [])
    .map((d) => Number(d.distanceKm))
    .filter((km) => Number.isFinite(km) && km > 0);
  if (fromDistances.length) return fromDistances;

  // Legacy: parse label có số km — bỏ road/trail
  const fromNames = (event.distances || [])
    .map((d) => parseKmFromLabel(d.name || ""))
    .filter((km): km is number => km != null && km > 0);
  if (fromNames.length) return fromNames;

  return (event.distanceTypes || [])
    .map(parseKmFromLabel)
    .filter((km): km is number => km != null && km > 0);
}

export function matchesDistanceBucket(
  kms: number[],
  bucketKey: DistanceBucketKey
): boolean {
  if (bucketKey === "all") return true;
  if (!kms.length) return false;
  const bucket = DISTANCE_BUCKETS.find((b) => b.key === bucketKey);
  if (!bucket) return false;
  // Chỉ cần 1 cự ly nằm trong khoảng (giải multi-distance vẫn hiện đúng bucket đó)
  return kms.some((km) => km >= bucket.minKm && km < bucket.maxKm);
}
