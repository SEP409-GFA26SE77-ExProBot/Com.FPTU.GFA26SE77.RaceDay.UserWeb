import api from "@/config/axios";
import { getApiErrorMessage } from "@/lib/error";
import type { RaceEventDto, RaceEventListItemDto } from "@/dto/event.dto";
import type {
  ApiRegistration,
  CreateRaceEventRequest,
} from "@/dto/organizer.dto";

const EVENT_API = "api/v1/event";

/** Tạo giải (đã login — PublicUser; không bắt role ORGANIZER) */
export async function createRaceEvent(
  payload: CreateRaceEventRequest
): Promise<RaceEventDto> {
  try {
    return (await api.post(
      `${EVENT_API}/organizer/`,
      payload
    )) as RaceEventDto;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Tạo giải thất bại."));
  }
}

/** Giải của user đang đăng nhập (GET /organizer/mine → RaceEventListItemDto[]) */
export async function listOrganizerEvents(): Promise<RaceEventListItemDto[]> {
  try {
    const data = (await api.get(
      `${EVENT_API}/organizer/mine`
    )) as RaceEventListItemDto[];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(
      getApiErrorMessage(e, "Không tải được danh sách giải của bạn.")
    );
  }
}

/** Registrations of an organizer's event */
export async function listEventRegistrations(eventId: string): Promise<ApiRegistration[]> {
  try {
    const data = (await api.get(
      `${EVENT_API}/organizer/${eventId}/registrations`
    )) as ApiRegistration[];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không tải được danh sách đăng ký."));
  }
}

export type StoredUpload = {
  fileName: string;
  fileUrl: string;
  contentType: string;
  sizeBytes: number;
};

/** Upload organizer file (banner / hồ sơ) → POST organizer/uploads */
export async function uploadOrganizerFile(file: File): Promise<StoredUpload> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const data = (await api.post(`${EVENT_API}/organizer/uploads`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })) as StoredUpload;
    if (!data?.fileUrl) throw new Error("Upload không trả về fileUrl.");
    return data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Upload thất bại."));
  }
}

export async function approveRegistrationApi(
  registrationId: string,
  bibNumber?: string | null
): Promise<ApiRegistration> {
  try {
    return (await api.post(`${EVENT_API}/organizer/registrations/${registrationId}/approve`, {
      bibNumber: bibNumber ?? null,
    })) as ApiRegistration;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Duyệt đăng ký thất bại."));
  }
}

export async function rejectRegistrationApi(
  registrationId: string,
  reason: string
): Promise<ApiRegistration> {
  try {
    return (await api.post(`${EVENT_API}/organizer/registrations/${registrationId}/reject`, {
      reason,
    })) as ApiRegistration;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Từ chối đăng ký thất bại."));
  }
}
