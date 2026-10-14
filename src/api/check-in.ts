import api from "@/config/axios";
import { getApiErrorMessage } from "@/lib/error";

const EVENT_API = "api/v1/event";

export type CheckInRequest = {
  eventId: string;
  bib?: string;
  qrPayload?: string;
};

export type CheckInResult = {
  registrationId: string;
  eventId: string;
  bibNumber: string;
  fullName: string;
  status: string;
  checkedInAtUtc: string;
  alreadyCheckedIn: boolean;
  distanceLabel?: string | null;
  distanceKm?: number | null;
};

export type StaffAssignmentDto = {
  eventId: string;
  eventName: string;
  role: string;
  status: string;
  stationId?: string | null;
  stationLabel?: string | null;
  eventDate?: string | null;
};

/** GET /api/v1/event/staff/me — giải staff Active được assign */
export async function listMyStaffAssignments(): Promise<StaffAssignmentDto[]> {
  try {
    const data = await api.get(`${EVENT_API}/staff/me`);
    return Array.isArray(data) ? (data as StaffAssignmentDto[]) : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không tải được phân công nhân sự."));
  }
}

/** POST /api/v1/event/check-in — staff / organizer / admin */
export async function checkInRegistration(
  body: CheckInRequest
): Promise<CheckInResult> {
  try {
    return (await api.post(`${EVENT_API}/check-in`, body)) as CheckInResult;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Check-in thất bại."));
  }
}

export type CheckInListItem = {
  registrationId: string;
  bibNumber: string;
  fullName: string;
  status: string;
  checkedIn: boolean;
  checkedInAtUtc?: string | null;
  distanceLabel?: string | null;
  distanceKm?: number | null;
};

/** GET /api/v1/event/check-ins?eventId= */
export async function listEventCheckIns(
  eventId: string
): Promise<CheckInListItem[]> {
  try {
    const data = await api.get(`${EVENT_API}/check-ins`, {
      params: { eventId },
    });
    return Array.isArray(data) ? (data as CheckInListItem[]) : [];
  } catch (e) {
    throw new Error(
      getApiErrorMessage(e, "Không tải được danh sách check-in.")
    );
  }
}
