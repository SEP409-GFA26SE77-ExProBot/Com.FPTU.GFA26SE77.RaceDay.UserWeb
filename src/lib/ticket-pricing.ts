import type {
  EventDistanceDto,
  TicketPricingByDistanceDto,
  TicketPricingDto,
} from "@/dto/event.dto";

export type ResolvedTicketPhase = {
  key: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  price: number;
  /** true nếu là regular/standard (fallback khi không còn đợt ưu tiên) */
  isStandard: boolean;
};

export type ResolvedTicketPrice = {
  price: number;
  /** null = đang dùng giá gốc (base), không có phase active */
  phase: ResolvedTicketPhase | null;
  basePrice: number;
  phases: ResolvedTicketPhase[];
};

function ymdLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isStandardPhase(key: string, name: string): boolean {
  const blob = `${key} ${name}`.toLowerCase();
  return /^(regular|standard|base|gốc|gia goc|giá gốc)$/i.test(key.trim())
    || /\b(regular|standard|giá gốc|gia goc|mặc định|mac dinh)\b/i.test(blob);
}

function inDateRange(today: string, from: string, to: string): boolean {
  if (!from && !to) return false;
  if (from && today < from) return false;
  if (to && today > to) return false;
  return true;
}

function phasesForDistance(
  pricing: unknown,
  distanceName: string,
  fallbackBase: number
): { basePrice: number; phases: ResolvedTicketPhase[] } {
  const raw = (pricing || {}) as TicketPricingDto;
  const byName = raw.byDistanceName?.[distanceName] as
    | TicketPricingByDistanceDto
    | undefined;

  if (byName) {
    const phases = (byName.phases || []).map((p, i) => {
      const key = String(p.key || `phase-${i}`);
      const name = String(p.name || key || "Phase");
      return {
        key,
        name,
        dateFrom: String(p.dateFrom || "").slice(0, 10),
        dateTo: String(p.dateTo || "").slice(0, 10),
        price: Number(p.price) || 0,
        isStandard: isStandardPhase(key, name),
      };
    });
    return {
      basePrice: Number(byName.basePrice ?? fallbackBase) || 0,
      phases,
    };
  }

  // Legacy: phases[].pricesByDistanceName[name]
  if (Array.isArray(raw.phases) && raw.phases.length) {
    const phases: ResolvedTicketPhase[] = [];
    let basePrice = fallbackBase;
    for (const p of raw.phases) {
      const key = String(p.key || "");
      const name = String(p.name || key || "Phase");
      const prices = p.pricesByDistanceName || {};
      const price = Number(prices[distanceName] ?? 0) || 0;
      if (isStandardPhase(key, name) || key === "base") {
        if (price > 0) basePrice = price;
        phases.push({
          key: key || "regular",
          name: name || "Regular",
          dateFrom: String(p.dateFrom || "").slice(0, 10),
          dateTo: String(p.dateTo || "").slice(0, 10),
          price: price || basePrice,
          isStandard: true,
        });
        continue;
      }
      if (price > 0 || p.name) {
        phases.push({
          key: key || `legacy-${phases.length}`,
          name,
          dateFrom: String(p.dateFrom || "").slice(0, 10),
          dateTo: String(p.dateTo || "").slice(0, 10),
          price,
          isStandard: false,
        });
      }
    }
    return { basePrice, phases };
  }

  return { basePrice: fallbackBase, phases: [] };
}

/**
 * Giá áp dụng tại `now`:
 * 1. Phase đang trong khoảng ngày và KHÔNG phải standard → ưu tiên (early bird, …)
 * 2. Không có đợt ưu tiên → phase standard đang mở (nếu có)
 * 3. Không còn phase nào → giá gốc (basePrice / distance.price)
 */
export function resolveDistanceTicketPrice(
  pricing: unknown,
  distance: Pick<EventDistanceDto, "name" | "type" | "price">,
  now: Date = new Date()
): ResolvedTicketPrice {
  const name = (distance.name || distance.type || "").trim();
  const fallback = Number(distance.price) || 0;
  const { basePrice, phases } = phasesForDistance(pricing, name, fallback);
  const today = ymdLocal(now);

  const active = phases.filter(
    (p) => p.price > 0 && inDateRange(today, p.dateFrom, p.dateTo)
  );
  const promo = active.find((p) => !p.isStandard);
  if (promo) {
    return { price: promo.price, phase: promo, basePrice, phases };
  }
  const standard = active.find((p) => p.isStandard);
  if (standard) {
    return { price: standard.price, phase: standard, basePrice, phases };
  }
  return {
    price: basePrice > 0 ? basePrice : fallback,
    phase: null,
    basePrice: basePrice > 0 ? basePrice : fallback,
    phases,
  };
}

export function minResolvedEventPrice(
  pricing: unknown,
  distances: Array<Pick<EventDistanceDto, "name" | "type" | "price">>,
  now: Date = new Date()
): number | null {
  if (!distances.length) return null;
  return Math.min(
    ...distances.map((d) => resolveDistanceTicketPrice(pricing, d, now).price)
  );
}
