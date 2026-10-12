/** Nhân sự theo event — coordinator / photographer / volunteer */

export type EventStaffRole = "coordinator" | "photographer" | "volunteer";

export type EventStaffStatus = "invited" | "active" | "revoked";

export interface StaffStationDto {
  id: string;
  label: string;
  /** check_in | kit | medical | checkpoint | photo_zone | other */
  kind: string;
}

export interface EventStaffMemberDto {
  id: string;
  eventId: string;
  role: EventStaffRole;
  fullName: string;
  email: string;
  phone?: string;
  status: EventStaffStatus;
  stationId?: string | null;
  stationLabel?: string | null;
  createdAt: string;
}

export interface InviteStaffDto {
  role: EventStaffRole;
  email: string;
  fullName: string;
  phone?: string;
  stationId?: string;
}

export interface AddStaffDto {
  role: EventStaffRole;
  fullName: string;
  email?: string;
  phone?: string;
  stationId?: string;
}

export interface AssignStaffStationDto {
  memberId: string;
  stationId: string | null;
}
