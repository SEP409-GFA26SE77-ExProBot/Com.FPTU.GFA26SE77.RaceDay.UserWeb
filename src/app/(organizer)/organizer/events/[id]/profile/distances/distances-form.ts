import type {
  DistancePriceTypeDto,
  OrganizerDistanceDto,
  OrganizerDistancesDetailDto,
  ReplaceEventDistancesRequest,
} from "@/dto/event-distance.dto";
import {
  normalizeDistanceType,
  type DistanceLeaderboardCode,
} from "@/lib/distance-types";
import { timeOnlyToInput } from "../_shared";

/**
 * Slot cố định = catalog BE (trừ OTHER).
 * OTHER: thêm riêng, nhập km tự do — khớp EventPermitRegistration / BIB.
 */
export const FIXED_TYPE_SLOTS = [
  { type: "3KM" as const, km: 3, label: "3 km" },
  { type: "5KM" as const, km: 5, label: "5 km" },
  { type: "10KM" as const, km: 10, label: "10 km" },
  { type: "15KM" as const, km: 15, label: "15 km" },
  { type: "HM" as const, km: 21, label: "21 km · HM" },
  { type: "M" as const, km: 42, label: "42 km · M" },
] as const;

export type FixedLeaderboardType = (typeof FIXED_TYPE_SLOTS)[number]["type"];

export type PriceType = {
  key: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  price: string;
};

export type DistanceRow = {
  /** `slot-5KM` | `other-<id>` */
  rowKey: string;
  id?: string;
  type: DistanceLeaderboardCode;
  /** Km gửi BE — OTHER cho sửa; slot cố định khóa theo type. */
  distanceKm: string;
  kmLocked: boolean;
  selected: boolean;
  name: string;
  capacity: string;
  registeredCount: number;
  startAt: string;
  endAt: string;
  types: PriceType[];
};

function isRegular(type: Pick<DistancePriceTypeDto, "key">) {
  return ["regular", "standard", "base"].includes(
    (type.key ?? "").trim().toLowerCase()
  );
}

function defaultTypes(
  distance: OrganizerDistanceDto | undefined,
  data: OrganizerDistancesDetailDto
): PriceType[] {
  const pricing = distance
    ? data.ticketPricing?.byDistanceName?.[distance.name]
    : undefined;
  const legacy = distance
    ? data.ticketPricing?.phases?.map((p) => ({
        ...p,
        price: p.pricesByDistanceName?.[distance.name] ?? 0,
      }))
    : undefined;
  const types = pricing?.types ?? pricing?.phases ?? legacy ?? [];
  const regular = types.find(isRegular);
  return [
    {
      key: "regular",
      name: "Regular",
      dateFrom: regular?.dateFrom ?? "",
      dateTo: regular?.dateTo ?? "",
      price: String(
        regular?.price ?? pricing?.basePrice ?? distance?.basePrice ?? 0
      ),
    },
    ...types
      .filter((t) => !isRegular(t))
      .map((t) => ({
        key: t.key ?? "",
        name: t.name ?? "",
        dateFrom: t.dateFrom ?? "",
        dateTo: t.dateTo ?? "",
        price: String(t.price ?? 0),
      })),
  ];
}

function emptyFixedRow(
  slot: (typeof FIXED_TYPE_SLOTS)[number],
  types: PriceType[]
): DistanceRow {
  return {
    rowKey: `slot-${slot.type}`,
    type: slot.type,
    distanceKm: String(slot.km),
    kmLocked: true,
    selected: false,
    name: `${slot.km}K`,
    capacity: "100",
    registeredCount: 0,
    startAt: "",
    endAt: "",
    types,
  };
}

function rowFromDistance(
  d: OrganizerDistanceDto,
  type: DistanceLeaderboardCode,
  data: OrganizerDistancesDetailDto,
  rowKey: string,
  kmLocked: boolean
): DistanceRow {
  return {
    rowKey,
    id: d.id,
    type,
    distanceKm: String(d.distanceKm),
    kmLocked,
    selected: true,
    name: d.name,
    capacity: String(d.capacity ?? 100),
    registeredCount: d.registeredCount ?? 0,
    startAt: timeOnlyToInput(d.startAt ?? ""),
    endAt: timeOnlyToInput(d.endAt ?? ""),
    types: defaultTypes(d, data),
  };
}

/** Type cố định (không OTHER) từ km gần đúng. */
export function suggestFixedTypeFromKm(
  km: number
): FixedLeaderboardType | null {
  if (!Number.isFinite(km)) return null;
  if (Math.abs(km - 3) < 0.05) return "3KM";
  if (Math.abs(km - 5) < 0.05) return "5KM";
  if (Math.abs(km - 10) < 0.05) return "10KM";
  if (Math.abs(km - 15) < 0.05) return "15KM";
  if (Math.abs(km - 21) < 0.6 || Math.abs(km - 21.0975) < 0.35) return "HM";
  if (Math.abs(km - 42) < 0.6 || Math.abs(km - 42.195) < 0.4) return "M";
  return null;
}

export function resolveSlotType(
  d: Pick<OrganizerDistanceDto, "type" | "distanceKm">
): DistanceLeaderboardCode {
  const code = normalizeDistanceType(d.type, d.distanceKm);
  if (code !== "OTHER") return code;
  return suggestFixedTypeFromKm(d.distanceKm) ?? "OTHER";
}

export function createDistanceRows(
  data: OrganizerDistancesDetailDto
): DistanceRow[] {
  const blankTypes: PriceType[] = [
    {
      key: "regular",
      name: "Regular",
      dateFrom: "",
      dateTo: "",
      price: "0",
    },
  ];

  const fixed = new Map<FixedLeaderboardType, DistanceRow>(
    FIXED_TYPE_SLOTS.map((s) => [s.type, emptyFixedRow(s, blankTypes)])
  );
  const others: DistanceRow[] = [];

  for (const d of data.distances) {
    const type = resolveSlotType(d);
    if (type === "OTHER") {
      others.push(
        rowFromDistance(d, "OTHER", data, `other-${d.id}`, false)
      );
      continue;
    }
    const existing = fixed.get(type as FixedLeaderboardType);
    if (!existing) {
      others.push(
        rowFromDistance(d, type, data, `other-${d.id}`, false)
      );
      continue;
    }
    if (existing.selected) {
      throw new Error(
        `Giải có hai cự ly cùng type ${type}. Không thể chỉnh bằng mẫu cố định.`
      );
    }
    fixed.set(
      type as FixedLeaderboardType,
      rowFromDistance(d, type, data, `slot-${type}`, true)
    );
  }

  return sharePriceTypes([
    ...FIXED_TYPE_SLOTS.map((s) => fixed.get(s.type)!),
    ...others,
  ]);
}

export function addOtherDistanceRow(rows: DistanceRow[]): DistanceRow[] {
  const templateTypes =
    rows.find((r) => r.selected)?.types ??
    rows[0]?.types ?? [
      {
        key: "regular",
        name: "Regular",
        dateFrom: "",
        dateTo: "",
        price: "0",
      },
    ];
  const types = templateTypes.map((t) => ({
    ...t,
    price: t.key === "regular" ? t.price : "",
  }));
  const next: DistanceRow = {
    rowKey: `other-new-${Date.now()}`,
    type: "OTHER",
    distanceKm: "",
    kmLocked: false,
    selected: true,
    name: "Cự ly khác",
    capacity: "100",
    registeredCount: 0,
    startAt: "",
    endAt: "",
    types,
  };
  return sharePriceTypes([...rows, next]);
}

export function removeOtherDistanceRow(
  rows: DistanceRow[],
  rowKey: string
): DistanceRow[] {
  const row = rows.find((r) => r.rowKey === rowKey);
  if (!row || row.type !== "OTHER") return rows;
  if (row.registeredCount > 0) return rows;
  return sharePriceTypes(rows.filter((r) => r.rowKey !== rowKey));
}

/** One shared set of definitions, with an independent amount for each distance. */
export function sharePriceTypes(rows: DistanceRow[]): DistanceRow[] {
  const regular = rows.find((r) => r.selected)?.types[0] ?? rows[0]?.types[0];
  if (!regular) return rows;
  const identity = (type: PriceType) =>
    JSON.stringify([
      type.key.trim().toLowerCase(),
      type.name,
      type.dateFrom,
      type.dateTo,
    ]);
  const definitions = new Map<string, PriceType>();
  for (const row of rows) {
    for (const type of row.types.slice(1)) definitions.set(identity(type), type);
  }
  return rows.map((row) => ({
    ...row,
    types: [
      { ...regular, price: row.types[0]?.price ?? "0" },
      ...Array.from(definitions, ([id, definition]) => ({
        ...definition,
        price: row.types.slice(1).find((t) => identity(t) === id)?.price ?? "",
      })),
    ],
  }));
}

export function addSharedPriceType(rows: DistanceRow[]): DistanceRow[] {
  return rows.map((row) => ({
    ...row,
    types: [
      ...row.types,
      { key: "", name: "", dateFrom: "", dateTo: "", price: "" },
    ],
  }));
}

export function updateSharedPriceType(
  rows: DistanceRow[],
  index: number,
  patch: Partial<Omit<PriceType, "price">>
): DistanceRow[] {
  return rows.map((row) => ({
    ...row,
    types: row.types.map((type, i) =>
      i === index ? { ...type, ...patch } : type
    ),
  }));
}

export function removeSharedPriceType(
  rows: DistanceRow[],
  index: number
): DistanceRow[] {
  if (index === 0) return rows;
  return rows.map((row) => ({
    ...row,
    types: row.types.filter((_, i) => i !== index),
  }));
}

export function requiresRegularDates(types: PriceType[]): boolean {
  return types.some((type) => {
    const key = type.key.trim().toLowerCase();
    return key.includes("early") || key.includes("late");
  });
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function getPriceTypeDateError(
  type: PriceType,
  regular: PriceType,
  regularDatesRequired: boolean
): string | null {
  const key = type.key.trim().toLowerCase();
  const isRegularType = key === "regular";
  if (
    (type.dateFrom && !validDate(type.dateFrom)) ||
    (type.dateTo && !validDate(type.dateTo))
  ) {
    return "Ngày áp dụng không hợp lệ.";
  }
  if (!type.dateFrom || !type.dateTo) {
    if (isRegularType && regularDatesRequired) {
      return "Nhập khoảng ngày Regular để thiết lập thứ tự Early → Regular → Late.";
    }
    if (!isRegularType) return "Nhập đầy đủ khoảng ngày áp dụng.";
    if (type.dateFrom || type.dateTo) return "Nhập cả ngày bắt đầu và kết thúc.";
    return null;
  }
  if (type.dateFrom > type.dateTo) {
    return "Ngày kết thúc phải từ ngày bắt đầu trở đi.";
  }
  if (!isRegularType && (key.includes("early") || key.includes("late"))) {
    if (
      !regular.dateFrom ||
      !regular.dateTo ||
      !validDate(regular.dateFrom) ||
      !validDate(regular.dateTo) ||
      regular.dateFrom > regular.dateTo
    ) {
      return "Nhập khoảng ngày Regular hợp lệ trước.";
    }
    if (key.includes("early") && type.dateTo >= regular.dateFrom) {
      return "Đợt early phải kết thúc trước ngày bắt đầu Regular.";
    }
    if (key.includes("late") && type.dateFrom <= regular.dateTo) {
      return "Đợt late phải bắt đầu sau ngày kết thúc Regular.";
    }
  }
  return null;
}

export function getPriceTypeError(
  type: PriceType,
  regularPrice: string
): string | null {
  if (!type.name.trim() || !type.key.trim()) {
    return "Nhập tên và key cho loại giá.";
  }
  const price = Number(type.price);
  if (
    !type.price.trim() ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 100_000_000
  ) {
    return "Giá phải từ 0 đến 100.000.000 VND.";
  }
  const key = type.key.trim().toLowerCase();
  if (key.includes("early") && price >= Number(regularPrice)) {
    return "Key chứa early: giá phải thấp hơn Regular.";
  }
  if (key.includes("late") && price <= Number(regularPrice)) {
    return "Key chứa late: giá phải cao hơn Regular.";
  }
  return null;
}

export function validateDistanceRows(
  rows: DistanceRow[],
  packageCap?: number
): string | null {
  const selected = rows.filter((r) => r.selected);
  if (!selected.length) return "Chọn ít nhất một cự ly.";
  const names = new Set<string>();
  const kms = new Set<string>();
  for (const row of selected) {
    const km = Number(String(row.distanceKm).replace(",", "."));
    const label =
      row.type === "OTHER"
        ? `OTHER (${row.distanceKm || "?"} km)`
        : `${row.type}`;
    const prefix = `${label}: `;
    if (!Number.isFinite(km) || km < 0.1 || km > 500) {
      return prefix + "Km phải từ 0.1 đến 500.";
    }
    const kmKey = km.toFixed(4);
    if (kms.has(kmKey)) {
      return "Hai cự ly không được trùng số km.";
    }
    kms.add(kmKey);
    const name = row.name.trim();
    if (!name || name.length > 100) {
      return prefix + "Tên cự ly cần từ 1 đến 100 ký tự.";
    }
    if (names.has(name.toLowerCase())) {
      return "Tên các cự ly không được trùng nhau.";
    }
    names.add(name.toLowerCase());
    const capacity = Number(row.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500_000) {
      return prefix + "Sức chứa phải là số nguyên từ 1 đến 500.000.";
    }
    if (capacity < row.registeredCount) {
      return prefix + "Sức chứa không được thấp hơn số VĐV đã đăng ký.";
    }
    if (
      row.startAt &&
      row.endAt &&
      timeWithSeconds(row.endAt) < timeWithSeconds(row.startAt)
    ) {
      return prefix + "Giờ kết thúc phải từ giờ xuất phát trở đi.";
    }
    const regular = row.types[0];
    if (!regular || regular.key !== "regular" || regular.name !== "Regular") {
      return prefix + "Phải có giá Regular.";
    }
    const keys = new Set<string>();
    for (const [index, type] of row.types.entries()) {
      const key = type.key.trim().toLowerCase();
      if (keys.has(key)) {
        return prefix + "Key các loại giá không được trùng nhau.";
      }
      keys.add(key);
      if (index > 0 && isRegular(type)) {
        return (
          prefix +
          "Chỉ được có một loại giá Regular (không dùng key standard/base)."
        );
      }
      const error =
        getPriceTypeDateError(type, regular, requiresRegularDates(row.types)) ??
        getPriceTypeError(type, regular.price);
      if (error) return prefix + `${type.name || "Loại giá"}: ${error}`;
    }
  }
  if (
    packageCap &&
    selected.reduce((sum, r) => sum + Number(r.capacity), 0) > packageCap
  ) {
    return `Tổng sức chứa vượt quy mô gói (${packageCap.toLocaleString("vi-VN")} VĐV).`;
  }
  return null;
}

export function buildDistancesPayload(
  rows: DistanceRow[]
): ReplaceEventDistancesRequest {
  const selected = rows.filter((r) => r.selected);
  return {
    distances: selected.map((r) => {
      const km = Number(String(r.distanceKm).replace(",", "."));
      return {
        ...(r.id ? { id: r.id } : {}),
        name: r.name.trim(),
        distanceKm: km,
        type: r.type,
        capacity: Number(r.capacity),
        basePrice: Number(r.types[0].price),
        startAt: r.startAt ? timeWithSeconds(r.startAt) : null,
        endAt: r.endAt ? timeWithSeconds(r.endAt) : null,
      };
    }),
    ticketPricing: {
      byDistanceName: Object.fromEntries(
        selected.map((r) => [
          r.name.trim(),
          {
            basePrice: Number(r.types[0].price),
            types: r.types.map((t) => ({
              ...t,
              key: t.key.trim(),
              name: t.name.trim(),
              price: Number(t.price),
            })),
          },
        ])
      ),
    },
  };
}

function timeWithSeconds(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}
