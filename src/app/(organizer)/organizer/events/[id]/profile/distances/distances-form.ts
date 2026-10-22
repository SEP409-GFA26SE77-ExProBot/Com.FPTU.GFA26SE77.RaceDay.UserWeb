import type {
  DistancePriceTypeDto,
  OrganizerDistancesDetailDto,
  ReplaceEventDistancesRequest,
} from "@/dto/event-distance.dto";

export const FIXED_DISTANCES = [5, 10, 21, 42] as const;

export type PriceType = {
  key: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  price: string;
};

export type DistanceRow = {
  id?: string;
  distanceKm: number;
  selected: boolean;
  name: string;
  capacity: string;
  registeredCount: number;
  startAt: string;
  endAt: string;
  types: PriceType[];
};

function isRegular(type: Pick<DistancePriceTypeDto, "key">) {
  return ["regular", "standard", "base"].includes((type.key ?? "").trim().toLowerCase());
}

export function createDistanceRows(data: OrganizerDistancesDetailDto): DistanceRow[] {
  // Do not silently omit existing distances from a replacement snapshot.
  if (data.distances.some((d) => !FIXED_DISTANCES.some((km) => km === d.distanceKm)) ||
      new Set(data.distances.map((d) => d.distanceKm)).size !== data.distances.length) {
    throw new Error("Giải có cự ly ngoài 5, 10, 21, 42 km hoặc trùng số km. Không thể chỉnh sửa bằng mẫu cự ly cố định này.");
  }
  const rows = FIXED_DISTANCES.map((distanceKm) => {
    const distance = data.distances.find((d) => d.distanceKm === distanceKm);
    const pricing = distance ? data.ticketPricing?.byDistanceName?.[distance.name] : undefined;
    const legacy = distance ? data.ticketPricing?.phases?.map((p) => ({
      ...p, price: p.pricesByDistanceName?.[distance.name] ?? 0,
    })) : undefined;
    const types = pricing?.types ?? pricing?.phases ?? legacy ?? [];
    const regular = types.find(isRegular);
    return {
      id: distance?.id,
      distanceKm,
      selected: !!distance,
      name: distance?.name ?? `${distanceKm}K`,
      capacity: String(distance?.capacity ?? 100),
      registeredCount: distance?.registeredCount ?? 0,
      startAt: distance?.startAt ?? "",
      endAt: distance?.endAt ?? "",
      types: [
        {
          key: "regular", name: "Regular",
          dateFrom: regular?.dateFrom ?? "", dateTo: regular?.dateTo ?? "",
          price: String(regular?.price ?? pricing?.basePrice ?? distance?.basePrice ?? 0),
        },
        ...types.filter((t) => !isRegular(t)).map((t) => ({
          key: t.key ?? "", name: t.name ?? "", dateFrom: t.dateFrom ?? "",
          dateTo: t.dateTo ?? "", price: String(t.price ?? 0),
        })),
      ],
    };
  });
  return sharePriceTypes(rows);
}

/** One shared set of definitions, with an independent amount for each distance. */
export function sharePriceTypes(rows: DistanceRow[]): DistanceRow[] {
  const regular = rows.find((r) => r.selected)?.types[0] ?? rows[0]?.types[0];
  if (!regular) return rows;
  const identity = (type: PriceType) => JSON.stringify([
    type.key.trim().toLowerCase(), type.name, type.dateFrom, type.dateTo,
  ]);
  // Preserve differing legacy definitions rather than silently dropping their dates.
  // Duplicate keys are shown in the shared editor and must be resolved before saving.
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
    types: [...row.types, { key: "", name: "", dateFrom: "", dateTo: "", price: "" }],
  }));
}

export function updateSharedPriceType(
  rows: DistanceRow[], index: number, patch: Partial<Omit<PriceType, "price">>
): DistanceRow[] {
  return rows.map((row) => ({
    ...row,
    types: row.types.map((type, i) => i === index ? { ...type, ...patch } : type),
  }));
}

export function removeSharedPriceType(rows: DistanceRow[], index: number): DistanceRow[] {
  if (index === 0) return rows;
  return rows.map((row) => ({ ...row, types: row.types.filter((_, i) => i !== index) }));
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
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function getPriceTypeDateError(
  type: PriceType, regular: PriceType, regularDatesRequired: boolean
): string | null {
  const key = type.key.trim().toLowerCase();
  const isRegularType = key === "regular";
  if ((type.dateFrom && !validDate(type.dateFrom)) || (type.dateTo && !validDate(type.dateTo))) {
    return "Ngày áp dụng không hợp lệ.";
  }
  if (!type.dateFrom || !type.dateTo) {
    if (isRegularType && regularDatesRequired) return "Nhập khoảng ngày Regular để thiết lập thứ tự Early → Regular → Late.";
    if (!isRegularType) return "Nhập đầy đủ khoảng ngày áp dụng.";
    if (type.dateFrom || type.dateTo) return "Nhập cả ngày bắt đầu và kết thúc.";
    return null;
  }
  if (type.dateFrom > type.dateTo) return "Ngày kết thúc phải từ ngày bắt đầu trở đi.";
  if (!isRegularType && (key.includes("early") || key.includes("late"))) {
    if (!regular.dateFrom || !regular.dateTo || !validDate(regular.dateFrom) || !validDate(regular.dateTo) || regular.dateFrom > regular.dateTo) {
      return "Nhập khoảng ngày Regular hợp lệ trước.";
    }
    // Date ranges include both endpoints, so sharing a boundary day is an overlap.
    if (key.includes("early") && type.dateTo >= regular.dateFrom) return "Đợt early phải kết thúc trước ngày bắt đầu Regular.";
    if (key.includes("late") && type.dateFrom <= regular.dateTo) return "Đợt late phải bắt đầu sau ngày kết thúc Regular.";
  }
  return null;
}

export function getPriceTypeError(type: PriceType, regularPrice: string): string | null {
  if (!type.name.trim() || !type.key.trim()) return "Nhập tên và key cho loại giá.";
  const price = Number(type.price);
  if (!type.price.trim() || !Number.isFinite(price) || price < 0 || price > 100_000_000) {
    return "Giá phải từ 0 đến 100.000.000 VND.";
  }
  const key = type.key.trim().toLowerCase();
  if (key.includes("early") && price >= Number(regularPrice)) return "Key chứa early: giá phải thấp hơn Regular.";
  if (key.includes("late") && price <= Number(regularPrice)) return "Key chứa late: giá phải cao hơn Regular.";
  return null;
}

export function validateDistanceRows(rows: DistanceRow[], packageCap?: number): string | null {
  const selected = rows.filter((r) => r.selected);
  if (!selected.length) return "Chọn ít nhất một cự ly.";
  const names = new Set<string>();
  for (const row of selected) {
    const prefix = `${row.distanceKm} km: `;
    const name = row.name.trim();
    if (!name || name.length > 100) return prefix + "Tên cự ly cần từ 1 đến 100 ký tự.";
    if (names.has(name.toLowerCase())) return "Tên các cự ly không được trùng nhau.";
    names.add(name.toLowerCase());
    const capacity = Number(row.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500_000) return prefix + "Sức chứa phải là số nguyên từ 1 đến 500.000.";
    if (capacity < row.registeredCount) return prefix + "Sức chứa không được thấp hơn số VĐV đã đăng ký.";
    if (row.startAt && row.endAt && timeWithSeconds(row.endAt) < timeWithSeconds(row.startAt)) return prefix + "Giờ kết thúc phải từ giờ xuất phát trở đi.";
    const regular = row.types[0];
    if (!regular || regular.key !== "regular" || regular.name !== "Regular") return prefix + "Phải có giá Regular.";
    const keys = new Set<string>();
    for (const [index, type] of row.types.entries()) {
      const key = type.key.trim().toLowerCase();
      if (keys.has(key)) return prefix + "Key các loại giá không được trùng nhau.";
      keys.add(key);
      if (index > 0 && isRegular(type)) return prefix + "Chỉ được có một loại giá Regular (không dùng key standard/base).";
      const error = getPriceTypeDateError(type, regular, requiresRegularDates(row.types)) ??
        getPriceTypeError(type, regular.price);
      if (error) return prefix + `${type.name || "Loại giá"}: ${error}`;
    }
  }
  if (packageCap && selected.reduce((sum, r) => sum + Number(r.capacity), 0) > packageCap) {
    return `Tổng sức chứa vượt quy mô gói (${packageCap.toLocaleString("vi-VN")} VĐV).`;
  }
  return null;
}

export function buildDistancesPayload(rows: DistanceRow[]): ReplaceEventDistancesRequest {
  const selected = rows.filter((r) => r.selected);
  return {
    distances: selected.map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      name: r.name.trim(), distanceKm: r.distanceKm, capacity: Number(r.capacity),
      basePrice: Number(r.types[0].price),
      startAt: r.startAt ? timeWithSeconds(r.startAt) : null,
      endAt: r.endAt ? timeWithSeconds(r.endAt) : null,
    })),
    ticketPricing: {
      byDistanceName: Object.fromEntries(selected.map((r) => [r.name.trim(), {
        basePrice: Number(r.types[0].price),
        types: r.types.map((t) => ({ ...t, key: t.key.trim(), name: t.name.trim(), price: Number(t.price) })),
      }])),
    },
  };
}

function timeWithSeconds(time: string) {
  return time.length === 5 ? `${time}:00` : time;
}
