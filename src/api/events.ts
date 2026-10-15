import api from "@/config/axios";
import {
  RaceEventDto,
  RaceEventListItemDto,
  CreateRegistrationDto,
  RegistrationDto,
  EventDocumentDto,
} from "@/dto/event.dto";
import { resolveStoredFileUrl } from "@/lib/media-url";

const EVENT_API = "api/v1/event";

function withResolvedBanner<T extends { bannerImage?: string | null }>(item: T): T {
  if (!item?.bannerImage) return item;
  return { ...item, bannerImage: resolveStoredFileUrl(item.bannerImage) };
}

function withResolvedDocuments(event: RaceEventDto): RaceEventDto {
  const docs = event.documents;
  if (!docs?.length) return withResolvedBanner(event);
  return withResolvedBanner({
    ...event,
    documents: docs.map(
      (d): EventDocumentDto =>
        d.fileUrl ? { ...d, fileUrl: resolveStoredFileUrl(d.fileUrl) } : d
    ),
  });
}

function withResolvedReg(reg: RegistrationDto): RegistrationDto {
  const raw = reg as RegistrationDto & { distanceLabel?: string | null };
  const distanceName = reg.distanceName || raw.distanceLabel || undefined;
  const next: RegistrationDto = {
    ...reg,
    ...(distanceName ? { distanceName } : {}),
  };
  if (!next.healthCertUrl) return next;
  return {
    ...next,
    healthCertUrl: resolveStoredFileUrl(next.healthCertUrl),
  };
}

// ─── Public ────────────────────────────────────────────

/** List public events (approved / registration-open…) */
export async function getEvents(): Promise<RaceEventListItemDto[]> {
  const data = (await api.get(EVENT_API)) as RaceEventListItemDto[];
  return (Array.isArray(data) ? data : []).map(withResolvedBanner);
}

/** Short TTL cache — tránh shell + page gọi đôi → 429 rate limit. */
const eventDetailCache = new Map<
  string,
  { at: number; promise: Promise<RaceEventDto> }
>();
const EVENT_CACHE_TTL_MS = 20_000;

export function invalidateEventCache(eventId?: string) {
  if (eventId) eventDetailCache.delete(eventId);
  else eventDetailCache.clear();
}

/** Get event detail by ID (public) */
export async function getEventById(eventId: string): Promise<RaceEventDto> {
  const now = Date.now();
  const hit = eventDetailCache.get(eventId);
  if (hit && now - hit.at < EVENT_CACHE_TTL_MS) {
    return hit.promise;
  }
  const promise = (async () => {
    try {
      const data = (await api.get(`${EVENT_API}/${eventId}`)) as RaceEventDto;
      return withResolvedDocuments(data);
    } catch (e) {
      eventDetailCache.delete(eventId);
      throw e;
    }
  })();
  eventDetailCache.set(eventId, { at: now, promise });
  return promise;
}

// ─── Runner uploads ────────────────────────────────────

/** Upload health certificate (runner), returns fileUrl (đã chuẩn CDN/API) */
export async function uploadHealthCert(
  file: File
): Promise<{ fileUrl: string; fileName: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const data = (await api.post(`${EVENT_API}/uploads`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })) as { fileUrl?: string; fileName?: string };
  if (!data?.fileUrl) throw new Error("Upload không trả về fileUrl.");
  return {
    fileName: data.fileName || file.name,
    fileUrl: resolveStoredFileUrl(data.fileUrl),
  };
}

// ─── Runner registrations ──────────────────────────────

/** Runner registers for an event – creates pending_payment registration */
export async function createRegistration(
  eventId: string,
  data: CreateRegistrationDto
): Promise<RegistrationDto> {
  const reg = (await api.post(
    `${EVENT_API}/${eventId}/registrations`,
    data
  )) as RegistrationDto;
  return withResolvedReg(reg);
}

/** Get my registrations */
export async function getMyRegistrations(): Promise<RegistrationDto[]> {
  const data = (await api.get(
    `${EVENT_API}/registrations/mine`
  )) as RegistrationDto[];
  return (Array.isArray(data) ? data : []).map(withResolvedReg);
}

/** Get registration detail (includes BIB + QR when confirmed) */
export async function getRegistrationById(
  registrationId: string
): Promise<RegistrationDto> {
  const reg = (await api.get(
    `${EVENT_API}/registrations/${registrationId}`
  )) as RegistrationDto;
  return withResolvedReg(reg);
}

/** Cancel a pending_payment registration */
export async function cancelRegistration(registrationId: string): Promise<void> {
  return api.post(`${EVENT_API}/registrations/${registrationId}/cancel`);
}

/**
 * Rejected + đã paid → sửa hồ sơ & nộp lại pending_approval (không thanh toán lại).
 * Body giống CreateRegistrationDto (không cần distanceId).
 */
export async function resubmitRejectedRegistration(
  registrationId: string,
  data: Omit<CreateRegistrationDto, "distanceId" | "dateOfBirth"> & {
    dateOfBirth?: string;
  }
): Promise<RegistrationDto> {
  const reg = (await api.put(
    `${EVENT_API}/registrations/${registrationId}/resubmit`,
    data
  )) as RegistrationDto;
  return withResolvedReg(reg);
}
