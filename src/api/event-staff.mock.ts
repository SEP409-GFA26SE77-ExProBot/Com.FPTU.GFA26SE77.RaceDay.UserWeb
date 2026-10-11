import type {
  AddStaffDto,
  AssignStaffStationDto,
  EventStaffMemberDto,
  EventStaffRole,
  InviteStaffDto,
  StaffStationDto,
} from "@/dto/event-staff.dto";

const LS = "raceday.event-staff.v1";

type Store = Record<string, EventStaffMemberDto[]>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS, JSON.stringify(store));
}

const STATIONS: Record<EventStaffRole, StaffStationDto[]> = {
  coordinator: [
    { id: "st-start", label: "Xuất phát / Start", kind: "checkpoint" },
    { id: "st-finish", label: "Vạch đích / Finish", kind: "checkpoint" },
    { id: "st-cp-mid", label: "Checkpoint giữa cung", kind: "checkpoint" },
    { id: "st-medical", label: "Y tế", kind: "medical" },
    { id: "st-ops", label: "Trung tâm điều hành", kind: "other" },
  ],
  photographer: [
    { id: "pz-start", label: "Zone ảnh — Start", kind: "photo_zone" },
    { id: "pz-coast", label: "Zone ảnh — Cung biển", kind: "photo_zone" },
    { id: "pz-finish", label: "Zone ảnh — Finish", kind: "photo_zone" },
  ],
  volunteer: [
    { id: "vol-checkin", label: "Quầy check-in", kind: "check_in" },
    { id: "vol-kit", label: "Quầy nhận kit / BIB", kind: "kit" },
  ],
};

function seed(eventId: string): EventStaffMemberDto[] {
  return [
    {
      id: `sm-${eventId}-c1`,
      eventId,
      role: "coordinator",
      fullName: "Nguyễn Minh Khoa",
      email: "khoa.coord@raceday.vn",
      phone: "0901111222",
      status: "active",
      stationId: "st-ops",
      stationLabel: "Trung tâm điều hành",
      createdAt: "2026-09-01T08:00:00.000Z",
    },
    {
      id: `sm-${eventId}-p1`,
      eventId,
      role: "photographer",
      fullName: "Trần Ảnh",
      email: "anh.photo@raceday.vn",
      status: "invited",
      stationId: "pz-coast",
      stationLabel: "Zone ảnh — Cung biển",
      createdAt: "2026-09-10T08:00:00.000Z",
    },
    {
      id: `sm-${eventId}-v1`,
      eventId,
      role: "volunteer",
      fullName: "Lê Tình Nguyện",
      email: "tnv@raceday.vn",
      status: "active",
      stationId: "vol-checkin",
      stationLabel: "Quầy check-in",
      createdAt: "2026-09-12T08:00:00.000Z",
    },
  ];
}

function listFor(eventId: string): EventStaffMemberDto[] {
  const store = readStore();
  if (!store[eventId]) {
    store[eventId] = seed(eventId);
    writeStore(store);
  }
  return store[eventId];
}

function saveFor(eventId: string, list: EventStaffMemberDto[]) {
  const store = readStore();
  store[eventId] = list;
  writeStore(store);
}

function stationLabel(role: EventStaffRole, stationId?: string | null) {
  if (!stationId) return null;
  return STATIONS[role].find((s) => s.id === stationId)?.label ?? stationId;
}

export async function listStationsMock(
  role: EventStaffRole
): Promise<StaffStationDto[]> {
  return STATIONS[role];
}

export async function listEventStaffMock(
  eventId: string,
  role?: EventStaffRole
): Promise<EventStaffMemberDto[]> {
  const list = listFor(eventId);
  return role ? list.filter((m) => m.role === role) : list;
}

export async function inviteStaffMock(
  eventId: string,
  body: InviteStaffDto
): Promise<EventStaffMemberDto> {
  const email = body.email.trim().toLowerCase();
  if (!email) throw new Error("Email bắt buộc khi mời.");
  const list = listFor(eventId);
  if (list.some((m) => m.email === email && m.role === body.role && m.status !== "revoked")) {
    throw new Error("Email đã có trong danh sách role này.");
  }
  const row: EventStaffMemberDto = {
    id: `sm-${Date.now()}`,
    eventId,
    role: body.role,
    fullName: body.fullName.trim() || email.split("@")[0],
    email,
    phone: body.phone?.trim(),
    status: "invited",
    stationId: body.stationId || null,
    stationLabel: stationLabel(body.role, body.stationId),
    createdAt: new Date().toISOString(),
  };
  saveFor(eventId, [row, ...list]);
  return row;
}

export async function addStaffMock(
  eventId: string,
  body: AddStaffDto
): Promise<EventStaffMemberDto> {
  if (!body.fullName.trim()) throw new Error("Tên bắt buộc.");
  const list = listFor(eventId);
  const email =
    body.email?.trim().toLowerCase() ||
    `local.${Date.now()}@staff.raceday.local`;
  const row: EventStaffMemberDto = {
    id: `sm-${Date.now()}`,
    eventId,
    role: body.role,
    fullName: body.fullName.trim(),
    email,
    phone: body.phone?.trim(),
    status: "active",
    stationId: body.stationId || null,
    stationLabel: stationLabel(body.role, body.stationId),
    createdAt: new Date().toISOString(),
  };
  saveFor(eventId, [row, ...list]);
  return row;
}

export async function assignStationMock(
  eventId: string,
  body: AssignStaffStationDto
): Promise<EventStaffMemberDto> {
  const list = listFor(eventId);
  const idx = list.findIndex((m) => m.id === body.memberId);
  if (idx < 0) throw new Error("Không tìm thấy nhân sự.");
  const m = list[idx];
  const next: EventStaffMemberDto = {
    ...m,
    stationId: body.stationId,
    stationLabel: stationLabel(m.role, body.stationId),
  };
  const copy = [...list];
  copy[idx] = next;
  saveFor(eventId, copy);
  return next;
}

export async function revokeStaffMock(
  eventId: string,
  memberId: string
): Promise<void> {
  const list = listFor(eventId).map((m) =>
    m.id === memberId ? { ...m, status: "revoked" as const } : m
  );
  saveFor(eventId, list);
}
