export interface RunnerRegistration {
  id: string;
  user_id: number;
  bib: number;
  event_id: number;
  eventTitle: string;
  distance: number;
  distanceLabel: string;
  fullName: string;
  email: string;
  phone: string;
  price: number;
  shirt?: { type: string; size: string; color: string } | null;
  registeredAt: string;
  paymentMethod: string;
  status: "confirmed" | "finished" | "dns" | "dnf";
}

const STORAGE_KEY = "raceday_registrations";

export const SEED_REGISTRATIONS: RunnerRegistration[] = [
  {
    id: "reg-seed-1",
    user_id: 1,
    bib: 1234,
    event_id: 1,
    eventTitle: "Vietnam Mountain Marathon 2026 — Sa Pa",
    distance: 10,
    distanceLabel: "10K Chạy vui",
    fullName: "Nguyễn Văn An",
    email: "runner@raceday.vn",
    phone: "0901234567",
    price: 500000,
    shirt: { type: "Áo thun", size: "M", color: "Đỏ RaceDay" },
    registeredAt: "2026-09-01T10:00:00+07:00",
    paymentMethod: "PayOS",
    status: "finished",
  },
  {
    id: "reg-seed-2",
    user_id: 1,
    bib: 2048,
    event_id: 2,
    eventTitle: "Marathon TP. Hồ Chí Minh 2026",
    distance: 21,
    distanceLabel: "21K Bán marathon",
    fullName: "Nguyễn Văn An",
    email: "runner@raceday.vn",
    phone: "0901234567",
    price: 1000000,
    shirt: null,
    registeredAt: "2026-09-15T14:30:00+07:00",
    paymentMethod: "PayOS",
    status: "confirmed",
  },
  {
    id: "reg-seed-3",
    user_id: 1,
    bib: 2610,
    event_id: 4,
    eventTitle: "Chạy Di sản Hà Nội 2026",
    distance: 10,
    distanceLabel: "10K Khám phá",
    fullName: "Nguyễn Văn An",
    email: "runner@raceday.vn",
    phone: "0901234567",
    price: 500000,
    shirt: { type: "Áo thun", size: "M", color: "Cam" },
    registeredAt: "2026-08-20T09:00:00+07:00",
    paymentMethod: "PayOS",
    status: "confirmed",
  },
  {
    id: "reg-seed-4",
    user_id: 1,
    bib: 881,
    event_id: 6,
    eventTitle: "Đà Lạt Ultra Trail 2026",
    distance: 25,
    distanceLabel: "25K Trail",
    fullName: "Nguyễn Văn An",
    email: "runner@raceday.vn",
    phone: "0901234567",
    price: 1100000,
    shirt: null,
    registeredAt: "2026-08-05T11:20:00+07:00",
    paymentMethod: "PayOS",
    status: "confirmed",
  },
  {
    id: "reg-seed-5",
    user_id: 1,
    bib: 512,
    event_id: 7,
    eventTitle: "Chạy đêm Kinh thành Huế",
    distance: 10,
    distanceLabel: "10K Ánh trăng",
    fullName: "Nguyễn Văn An",
    email: "runner@raceday.vn",
    phone: "0901234567",
    price: 550000,
    shirt: { type: "Áo thun", size: "L", color: "Đen" },
    registeredAt: "2026-07-28T16:00:00+07:00",
    paymentMethod: "PayOS",
    status: "finished",
  },
  {
    id: "reg-seed-6",
    user_id: 1,
    bib: 777,
    event_id: 10,
    eventTitle: "Trail Đèo Hải Vân",
    distance: 15,
    distanceLabel: "15K Trail",
    fullName: "Nguyễn Văn An",
    email: "runner@raceday.vn",
    phone: "0901234567",
    price: 800000,
    shirt: null,
    registeredAt: "2026-07-10T08:45:00+07:00",
    paymentMethod: "PayOS",
    status: "confirmed",
  },
  {
    id: "reg-seed-7",
    user_id: 1,
    bib: 333,
    event_id: 11,
    eventTitle: "Saigon Color Run 2026",
    distance: 5,
    distanceLabel: "5K Color",
    fullName: "Nguyễn Văn An",
    email: "runner@raceday.vn",
    phone: "0901234567",
    price: 350000,
    shirt: { type: "Áo thun", size: "M", color: "Trắng" },
    registeredAt: "2026-06-18T13:10:00+07:00",
    paymentMethod: "PayOS",
    status: "finished",
  },
  {
    id: "reg-seed-8",
    user_id: 1,
    bib: 1900,
    event_id: 15,
    eventTitle: "Giải núi Ba Vì",
    distance: 12,
    distanceLabel: "12K Núi",
    fullName: "Nguyễn Văn An",
    email: "runner@raceday.vn",
    phone: "0901234567",
    price: 600000,
    shirt: null,
    registeredAt: "2026-06-01T07:30:00+07:00",
    paymentMethod: "PayOS",
    status: "confirmed",
  },
];

export function loadRegistrations(): RunnerRegistration[] {
  if (typeof window === "undefined") return SEED_REGISTRATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REGISTRATIONS));
      return [...SEED_REGISTRATIONS];
    }
    const parsed = JSON.parse(raw) as RunnerRegistration[];
    // Merge seed IDs missing from older localStorage (giữ vé user vừa đăng ký)
    const byId = new Map(parsed.map((r) => [r.id, r]));
    for (const seed of SEED_REGISTRATIONS) {
      if (!byId.has(seed.id)) byId.set(seed.id, seed);
    }
    const merged = Array.from(byId.values()).sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return [...SEED_REGISTRATIONS];
  }
}

export function saveRegistrations(list: RunnerRegistration[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addRegistration(
  data: Omit<RunnerRegistration, "id" | "status"> & { status?: RunnerRegistration["status"] }
): RunnerRegistration {
  const list = loadRegistrations();
  const item: RunnerRegistration = {
    ...data,
    id: `reg-${Date.now()}`,
    status: data.status ?? "confirmed",
  };
  list.unshift(item);
  saveRegistrations(list);
  return item;
}

export function getRegistrationById(id: string): RunnerRegistration | undefined {
  return loadRegistrations().find((r) => r.id === id);
}

export function getRegistrationByBib(bib: number, eventId?: number) {
  return loadRegistrations().find(
    (r) => r.bib === bib && (eventId == null || r.event_id === eventId)
  );
}
