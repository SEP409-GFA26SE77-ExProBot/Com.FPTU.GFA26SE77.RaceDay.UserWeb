import { RaceEventDto } from "@/dto/event.dto";

export interface RaceScheduleItem {
  time: string;
  activity: string;
}

export interface RacePrize {
  category: string;
  reward: string;
}

/** Chi tiết race-day — chỉ lấy từ API (rules/rewards). Không bịa nội dung. */
export interface RaceDetails {
  kitPickup: string;
  startTime: string;
  cutOff: string;
  schedule: RaceScheduleItem[];
  rules: string[];
  guidelines: string[];
  prizes: RacePrize[];
  penalties: string[];
  tags: string[];
}

function asStringList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x : (x as { text?: string })?.text))
      .filter((x): x is string => Boolean(x && String(x).trim()));
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["items", "list", "rules", "guidelines", "penalties"]) {
      if (Array.isArray(o[key])) return asStringList(o[key]);
    }
  }
  return [];
}

function asPrizeList(raw: unknown): RacePrize[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const arr = Array.isArray(o.prizes)
    ? o.prizes
    : Array.isArray(o.items)
      ? o.items
      : Array.isArray(raw)
        ? raw
        : null;
  if (!arr) return [];
  return arr
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const row = p as Record<string, unknown>;
      const category = String(row.category || row.name || "").trim();
      const reward = String(row.reward || row.description || "").trim();
      if (!category || !reward) return null;
      return { category, reward };
    })
    .filter((x): x is RacePrize => Boolean(x));
}

function asSchedule(raw: unknown): RaceScheduleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (!s || typeof s !== "object") return null;
      const row = s as Record<string, unknown>;
      const time = String(row.time || row.when || "").trim();
      const activity = String(row.activity || row.title || row.description || "").trim();
      if (!time || !activity) return null;
      return { time, activity };
    })
    .filter((x): x is RaceScheduleItem => Boolean(x));
}

function isTrailEvent(event: RaceEventDto): boolean {
  const blob = `${event.name} ${event.tagline || ""} ${event.description || ""}`.toLowerCase();
  return /trail|núi|ultra|cao nguyên|vertical|sky|đồi|mountain/.test(blob);
}

function deriveTags(event: RaceEventDto): string[] {
  const tags = new Set<string>();
  for (const d of event.distances || []) {
    if (d.distanceKm <= 5) tags.add("5K");
    else if (d.distanceKm <= 10) tags.add("10K");
    else if (d.distanceKm <= 21.2) tags.add("Half Marathon");
    else if (d.distanceKm <= 42.3) tags.add("Marathon");
    else tags.add("Ultra");
    if ((d.elevationGainM ?? 0) > 500 || isTrailEvent(event)) tags.add("Trail");
  }
  return Array.from(tags);
}

export function getRaceDetails(event: RaceEventDto): RaceDetails {
  const rulesObj = event.rules as Record<string, unknown> | undefined;
  const rewardsObj = event.rewards as Record<string, unknown> | undefined;

  return {
    kitPickup:
      typeof rulesObj?.kitPickup === "string" ? rulesObj.kitPickup.trim() : "",
    startTime:
      (typeof rulesObj?.startTimeNote === "string" && rulesObj.startTimeNote.trim()) ||
      event.startTime ||
      "",
    cutOff: typeof rulesObj?.cutOff === "string" ? rulesObj.cutOff.trim() : "",
    tags: deriveTags(event),
    schedule: asSchedule(rulesObj?.schedule ?? rewardsObj?.schedule),
    rules: asStringList(rulesObj?.items ?? rulesObj?.list ?? rulesObj),
    guidelines: asStringList(rulesObj?.guidelines ?? rewardsObj?.guidelines),
    prizes: asPrizeList(rewardsObj),
    penalties: asStringList(rulesObj?.penalties ?? rewardsObj?.penalties),
  };
}
