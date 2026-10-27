import type {
  EventDistanceDto,
  TicketPricingByDistanceDto,
  TicketPricingDto,
} from "@/dto/event.dto";

export type ResolvedTicketType = {
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
  /** null = đang dùng giá gốc (base), không có type active */
  activeType: ResolvedTicketType | null;
  /** @deprecated alias activeType — giữ cho UI cũ */
  phase: ResolvedTicketType | null;
  basePrice: number;
  types: ResolvedTicketType[];
  /** @deprecated alias types */
  phases: ResolvedTicketType[];
};

function ymdLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isStandardType(key: string, name: string): boolean {
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

function rowTypes(
  byName: TicketPricingByDistanceDto
): NonNullable<TicketPricingByDistanceDto["types"]> {
  return byName.types?.length ? byName.types : byName.phases || [];
}

function typesForDistance(
  pricing: unknown,
  distanceName: string,
  fallbackBase: number
): { basePrice: number; types: ResolvedTicketType[] } {
  const raw = (pricing || {}) as TicketPricingDto;
  const byName = raw.byDistanceName?.[distanceName] as
    | TicketPricingByDistanceDto
    | undefined;

  if (byName) {
    const types = rowTypes(byName).map((p, i) => {
      const key = String(p.key || `type-${i}`);
      const name = String(p.name || key || "Type");
      return {
        key,
        name,
        dateFrom: String(p.dateFrom || "").slice(0, 10),
        dateTo: String(p.dateTo || "").slice(0, 10),
        price: Number(p.price) || 0,
        isStandard: isStandardType(key, name),
      };
    });
    return {
      basePrice: Number(byName.basePrice ?? fallbackBase) || 0,
      types,
    };
  }

  // Legacy root array: types | phases với pricesByDistanceName
  const legacy = (raw.types?.length ? raw.types : raw.phases) || [];
  if (legacy.length) {
    const types: ResolvedTicketType[] = [];
    let basePrice = fallbackBase;
    for (const p of legacy) {
      const key = String(p.key || "");
      const name = String(p.name || key || "Type");
      const prices = p.pricesByDistanceName || {};
      const price = Number(prices[distanceName] ?? 0) || 0;
      if (isStandardType(key, name) || key === "base") {
        if (price > 0) basePrice = price;
        types.push({
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
        types.push({
          key: key || `legacy-${types.length}`,
          name,
          dateFrom: String(p.dateFrom || "").slice(0, 10),
          dateTo: String(p.dateTo || "").slice(0, 10),
          price,
          isStandard: false,
        });
      }
    }
    return { basePrice, types };
  }

  return { basePrice: fallbackBase, types: [] };
}

/**
 * Giá áp dụng tại `now`:
 * 1. Type đang trong khoảng ngày và KHÔNG phải standard → ưu tiên (early bird, …)
 * 2. Không có đợt ưu tiên → type standard đang mở (nếu có)
 * 3. Không còn type nào → giá gốc (ticket basePrice / distance.basePrice)
 */
export function resolveDistanceTicketPrice(
  pricing: unknown,
  distance: Pick<EventDistanceDto, "name" | "type" | "basePrice" | "price">,
  now: Date = new Date()
): ResolvedTicketPrice {
  const name = (distance.name || distance.type || "").trim();
  const fallback = Number(distance.basePrice ?? distance.price) || 0;
  const { basePrice, types } = typesForDistance(pricing, name, fallback);
  const today = ymdLocal(now);

  const active = types.filter(
    (p) => p.price > 0 && inDateRange(today, p.dateFrom, p.dateTo)
  );
  const promo = active.find((p) => !p.isStandard);
  if (promo) {
    return {
      price: promo.price,
      activeType: promo,
      phase: promo,
      basePrice,
      types,
      phases: types,
    };
  }
  const standard = active.find((p) => p.isStandard);
  if (standard) {
    return {
      price: standard.price,
      activeType: standard,
      phase: standard,
      basePrice,
      types,
      phases: types,
    };
  }
  const base = basePrice > 0 ? basePrice : fallback;
  return {
    price: base,
    activeType: null,
    phase: null,
    basePrice: base,
    types,
    phases: types,
  };
}

export function minResolvedEventPrice(
  pricing: unknown,
  distances: Array<Pick<EventDistanceDto, "name" | "type" | "basePrice" | "price">>,
  now: Date = new Date()
): number | null {
  if (!distances.length) return null;
  return Math.min(
    ...distances.map((d) => resolveDistanceTicketPrice(pricing, d, now).price)
  );
}
