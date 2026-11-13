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
  InviteStaffResultDto,
  ResetStaffPasswordResultDto,
  StaffRouteDto,
  StaffStationDto,
  UpdateStaffDto,
} from "@/dto/event-staff.dto";
import {
  buildStaffMapDataForEvent,
  buildStaffStationsForEvent,
} from "@/lib/event-staff-stations";

const STAFF_API = "api/v1/event";

/** Checkpoint từ map, điểm tiếp tế cho race-staff và nhiệm vụ không gắn map. */
export async function listStaffStations(
  eventId: string,
  role: EventStaffRole
): Promise<StaffStationDto[]> {
  return buildStaffStationsForEvent(eventId, role);
}

/** Stations + polyline lộ trình theo cự ly (một lần load course). */
export async function listStaffMapData(
  eventId: string,
  role: EventStaffRole
): Promise<{ stations: StaffStationDto[]; routes: StaffRouteDto[] }> {
  return buildStaffMapDataForEvent(eventId, role);
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
): Promise<InviteStaffResultDto> {
  const payload: Record<string, unknown> = {
    role: body.role,
    fullName: body.fullName,
  };
  if (body.email?.trim()) payload.email = body.email.trim();
  if (body.phone?.trim()) payload.phone = body.phone.trim();
  if (body.password?.trim()) payload.password = body.password.trim();
  if (body.stationId) payload.stationId = body.stationId;
  if (body.stationLabel) payload.stationLabel = body.stationLabel;
  if (body.stations?.length) payload.stations = body.stations;
  return api.post(`${STAFF_API}/organizer/${eventId}/staff/invite`, payload);
}

export async function addEventStaff(
  eventId: string,
  body: AddStaffDto
): Promise<EventStaffMemberDto> {
  return api.post(`${STAFF_API}/organizer/${eventId}/staff`, body);
}

export async function updateEventStaff(
  eventId: string,
  memberId: string,
  body: UpdateStaffDto
): Promise<EventStaffMemberDto> {
  return api.post(`${STAFF_API}/organizer/${eventId}/staff/${memberId}/update`, {
    fullName: body.fullName,
    email: body.email?.trim() ?? "",
    phone: body.phone ?? null,
    stationId: body.stationId ?? null,
    stationLabel: body.stationLabel ?? null,
    stations: body.stations ?? [],
  });
}

export async function assignEventStaffStation(
  eventId: string,
  body: AssignStaffStationDto
): Promise<EventStaffMemberDto> {
  return api.post(
    `${STAFF_API}/organizer/${eventId}/staff/${body.memberId}/station`,
    {
      stationId: body.stationId,
      stationLabel: body.stationLabel ?? null,
      stations: body.stations ?? undefined,
    }
  );
}

export async function resetEventStaffPassword(
  eventId: string,
  memberId: string
): Promise<ResetStaffPasswordResultDto> {
  return api.post(
    `${STAFF_API}/organizer/${eventId}/staff/${memberId}/reset-password`
  );
}

export async function setEventStaffLock(
  eventId: string,
  memberId: string,
  locked: boolean
): Promise<void> {
  return api.post(`${STAFF_API}/organizer/${eventId}/staff/${memberId}/lock`, {
    locked,
  });
}

export async function revokeEventStaff(
  eventId: string,
  memberId: string
): Promise<void> {
  return api.delete(`${STAFF_API}/organizer/${eventId}/staff/${memberId}`);
}
