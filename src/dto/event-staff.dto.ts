/** Nhân sự theo event — race-staff / photographer */

export type EventStaffRole = "race-staff" | "photographer";

export type EventStaffStatus = "invited" | "active" | "revoked";

/** start | finish | cp | aid — loại điểm trên map (không gồm check-in desk) */
export type StaffMapPointType = "start" | "finish" | "cp" | "aid";

/** Photographer tối đa số điểm (khớp BE MaxPhotographerStations). */
export const PHOTOGRAPHER_MAX_STATIONS = 5;

/** Mật khẩu gốc staff — khớp BE StaffCredentialDefaults.FallbackPassword / seed. */
export const STAFF_DEFAULT_PASSWORD = "MatKhau@123";

export interface StaffStationDto {
  id: string;
  label: string;
  /** check_in | kit | medical | checkpoint | photo_zone | aid | other */
  kind: string;
  /** map = từ course checkpoint/aid; duty = nhiệm vụ không gắn map */
  source?: "map" | "duty";
  mapCheckpointId?: string | null;
  distanceId?: string | null;
  distanceName?: string | null;
  /** Loại điểm map gốc (start/cp/aid/finish) */
  mapType?: StaffMapPointType | null;
  lat?: number | null;
  lng?: number | null;
}

/** Polyline lộ trình theo cự ly — vẽ trên map phân bổ */
export interface StaffRouteDto {
  distanceId: string;
  distanceName: string;
  polyline: { lat: number; lng: number }[];
}

export interface StaffStationItemDto {
  stationId: string;
  stationLabel?: string | null;
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
  /** Photographer: nhiều điểm; race-staff thường 0–1. */
  stations?: StaffStationItemDto[];
  createdAt: string;
  userId?: string | null;
  accountLocked?: boolean;
}

export interface InviteStaffDto {
  role: EventStaffRole;
  email?: string;
  fullName: string;
  phone?: string;
  stationId?: string;
  stationLabel?: string;
  stations?: StaffStationItemDto[];
  password?: string;
}

export interface InviteStaffResultDto {
  member: EventStaffMemberDto;
  username?: string | null;
  password: string;
  passwordSentByEmail: boolean;
}

export interface ResetStaffPasswordResultDto {
  username: string;
  password: string;
  passwordSentByEmail: boolean;
}

export interface AddStaffDto {
  role: EventStaffRole;
  fullName: string;
  email?: string;
  phone?: string;
  stationId?: string;
  stationLabel?: string;
  stations?: StaffStationItemDto[];
}

export interface UpdateStaffDto {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  stationId?: string | null;
  stationLabel?: string | null;
  stations?: StaffStationItemDto[];
}

export interface AssignStaffStationDto {
  memberId: string;
  stationId: string | null;
  stationLabel?: string | null;
  stations?: StaffStationItemDto[];
}

export function memberStationIds(m: EventStaffMemberDto): string[] {
  if (m.stations && m.stations.length > 0) {
    return m.stations.map((s) => s.stationId).filter(Boolean);
  }
  return m.stationId ? [m.stationId] : [];
}

/** Cảnh báo mềm khi điểm quá xa / lệch ca — không chặn lưu. */
export function softWarnFarStations(
  selectedIds: string[],
  catalog: StaffStationDto[]
): string | null {
  const selected = selectedIds
    .map((id) => catalog.find((s) => s.id === id))
    .filter((s): s is StaffStationDto => !!s && s.source === "map");
  if (selected.length < 2) return null;

  const distanceIds = new Set(
    selected.map((s) => s.distanceId).filter((d): d is string => !!d)
  );
  if (distanceIds.size > 1) {
    return "Các điểm thuộc nhiều cự ly — khó cover trong cùng một ca.";
  }

  const types = new Set(selected.map((s) => s.mapType).filter(Boolean));
  if (types.has("start") && types.has("finish")) {
    return "Start và Finish cùng lúc thường khó — cân nhắc Di động hoặc tách ca.";
  }

  return null;
}

export function toStationItems(
  ids: string[],
  catalog: StaffStationDto[]
): StaffStationItemDto[] {
  return ids
    .map((id) => {
      const s = catalog.find((x) => x.id === id);
      return {
        stationId: id,
        stationLabel: s?.label ?? id,
      };
    })
    .filter((x) => !!x.stationId);
}
