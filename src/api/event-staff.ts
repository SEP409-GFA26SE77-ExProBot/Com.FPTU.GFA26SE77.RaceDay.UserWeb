/**
 * Nhân sự theo event — BE Event module.
 * Stations (checkpoint / aid): build FE từ Map course + duty cố định.
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
import { buildStaffStationsForEvent } from "@/lib/event-staff-stations";

const STAFF_API = "api/v1/event";

/** Checkpoint (coord/photo) / điểm tiếp tế (volunteer) từ map + nhiệm vụ không gán map */
export async function listStaffStations(
  eventId: string,
  role: EventStaffRole
): Promise<StaffStationDto[]> {
  return buildStaffStationsForEvent(eventId, role);
}

export async function listEventStaff(
  eventId: string,
  role?: EventStaffRole
): Promise<EventStaffMemberDto[]> {
  const q = role ? `?role=${encodeURIComponent(role)}` : "";
  return api.get(`${STAFF_API}/organizer/${eventId}/staff${q}`);
}

export async function inviteEventStaff(
  eventId: string,
  body: InviteStaffDto
): Promise<EventStaffMemberDto> {
  return api.post(`${STAFF_API}/organizer/${eventId}/staff/invite`, body);
}

export async function addEventStaff(
  eventId: string,
  body: AddStaffDto
): Promise<EventStaffMemberDto> {
  return api.post(`${STAFF_API}/organizer/${eventId}/staff`, body);
}

export async function assignEventStaffStation(
  eventId: string,
  body: AssignStaffStationDto
): Promise<EventStaffMemberDto> {
  return api.patch(
    `${STAFF_API}/organizer/${eventId}/staff/${body.memberId}/station`,
    { stationId: body.stationId, stationLabel: body.stationLabel ?? null }
  );
}

export async function revokeEventStaff(
  eventId: string,
  memberId: string
): Promise<void> {
  return api.delete(`${STAFF_API}/organizer/${eventId}/staff/${memberId}`);
}
