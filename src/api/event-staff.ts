/**
 * Nhân sự theo event.
 * MOCK mặc định: NEXT_PUBLIC_EVENT_STAFF_USE_MOCK !== "false"
 */
import api from "@/config/axios";
import type {
  AddStaffDto,
  AssignStaffStationDto,
  EventStaffMemberDto,
  EventStaffRole,
  InviteStaffDto,
  StaffStationDto,
} from "@/dto/event-staff.dto";

const STAFF_API = "api/v1/event";

export const EVENT_STAFF_USE_MOCK =
  process.env.NEXT_PUBLIC_EVENT_STAFF_USE_MOCK !== "false";

export async function listStaffStations(
  role: EventStaffRole
): Promise<StaffStationDto[]> {
  if (EVENT_STAFF_USE_MOCK) {
    const m = await import("./event-staff.mock");
    return m.listStationsMock(role);
  }
  return api.get(
    `${STAFF_API}/staff/stations?role=${encodeURIComponent(role)}`
  );
}

export async function listEventStaff(
  eventId: string,
  role?: EventStaffRole
): Promise<EventStaffMemberDto[]> {
  if (EVENT_STAFF_USE_MOCK) {
    const m = await import("./event-staff.mock");
    return m.listEventStaffMock(eventId, role);
  }
  const q = role ? `?role=${encodeURIComponent(role)}` : "";
  return api.get(`${STAFF_API}/organizer/${eventId}/staff${q}`);
}

export async function inviteEventStaff(
  eventId: string,
  body: InviteStaffDto
): Promise<EventStaffMemberDto> {
  if (EVENT_STAFF_USE_MOCK) {
    const m = await import("./event-staff.mock");
    return m.inviteStaffMock(eventId, body);
  }
  return api.post(`${STAFF_API}/organizer/${eventId}/staff/invite`, body);
}

export async function addEventStaff(
  eventId: string,
  body: AddStaffDto
): Promise<EventStaffMemberDto> {
  if (EVENT_STAFF_USE_MOCK) {
    const m = await import("./event-staff.mock");
    return m.addStaffMock(eventId, body);
  }
  return api.post(`${STAFF_API}/organizer/${eventId}/staff`, body);
}

export async function assignEventStaffStation(
  eventId: string,
  body: AssignStaffStationDto
): Promise<EventStaffMemberDto> {
  if (EVENT_STAFF_USE_MOCK) {
    const m = await import("./event-staff.mock");
    return m.assignStationMock(eventId, body);
  }
  return api.patch(
    `${STAFF_API}/organizer/${eventId}/staff/${body.memberId}/station`,
    { stationId: body.stationId }
  );
}

export async function revokeEventStaff(
  eventId: string,
  memberId: string
): Promise<void> {
  if (EVENT_STAFF_USE_MOCK) {
    const m = await import("./event-staff.mock");
    return m.revokeStaffMock(eventId, memberId);
  }
  return api.delete(`${STAFF_API}/organizer/${eventId}/staff/${memberId}`);
}
