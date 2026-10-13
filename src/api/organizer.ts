import api from "@/config/axios";
import { getApiErrorMessage } from "@/lib/error";
import { resolveStoredFileUrl } from "@/lib/media-url";
import { getEventById, invalidateEventCache } from "@/api/events";
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
    const body: CreateRaceEventRequest = {
      ...payload,
      bannerImage: payload.bannerImage
        ? resolveStoredFileUrl(payload.bannerImage)
        : payload.bannerImage,
      documents: payload.documents?.map((d) =>
        d.fileUrl ? { ...d, fileUrl: resolveStoredFileUrl(d.fileUrl) } : d
      ),
    };
    return (await api.post(
      `${EVENT_API}/organizer/`,
      body
    )) as RaceEventDto;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Tạo giải thất bại."));
  }
}

/** Gửi duyệt từ nháp / bị từ chối — POST /organizer/{id}/submit */
export async function submitRaceEvent(eventId: string): Promise<RaceEventDto> {
  try {
    const result = (await api.post(
      `${EVENT_API}/organizer/${eventId}/submit`
    )) as RaceEventDto;
    invalidateEventCache(eventId);
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Gửi duyệt thất bại."));
  }
}

/**
 * Giải của user đang đăng nhập (GET /organizer/mine).
 * Mine list thường chỉ có distanceTypes ("road") — hydrate distances (tên cự ly)
 * từ GET /event/:id khi thiếu.
 */
export async function listOrganizerEvents(): Promise<RaceEventListItemDto[]> {
  try {
    const data = (await api.get(
      `${EVENT_API}/organizer/mine`
    )) as RaceEventListItemDto[];
    const items = Array.isArray(data) ? data : [];

    return Promise.all(
      items.map(async (item) => {
        const withBanner = {
          ...item,
          bannerImage: item.bannerImage
            ? resolveStoredFileUrl(item.bannerImage)
            : item.bannerImage,
        };
        if (withBanner.distances?.length) return withBanner;
        try {
          const detail = await getEventById(item.id);
          const banner = withBanner.bannerImage || detail.bannerImage;
          return {
            ...withBanner,
            distances: detail.distances ?? [],
            bannerImage: banner ? resolveStoredFileUrl(banner) : banner,
            tagline: withBanner.tagline || detail.tagline,
          };
        } catch {
          return withBanner;
        }
      })
    );
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
    return (Array.isArray(data) ? data : []).map((r) =>
      r.healthCertUrl
        ? { ...r, healthCertUrl: resolveStoredFileUrl(r.healthCertUrl) }
        : r
    );
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

export type OrganizerUploadPurpose = "banner" | "document";

/** Upload organizer file → POST organizer/uploads?purpose=banner|document */
export async function uploadOrganizerFile(
  file: File,
  purpose: OrganizerUploadPurpose = "document"
): Promise<StoredUpload> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const data = (await api.post(
      `${EVENT_API}/organizer/uploads?purpose=${purpose}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    )) as StoredUpload;
    if (!data?.fileUrl) throw new Error("Upload không trả về fileUrl.");
    return {
      ...data,
      fileUrl: resolveStoredFileUrl(data.fileUrl),
    };
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
