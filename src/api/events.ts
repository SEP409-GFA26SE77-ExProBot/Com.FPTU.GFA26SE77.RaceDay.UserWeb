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
  if (!reg?.healthCertUrl) return reg;
  return {
    ...reg,
    healthCertUrl: resolveStoredFileUrl(reg.healthCertUrl),
  };
}

// ─── Public ────────────────────────────────────────────

/** List public events (approved / registration-open…) */
export async function getEvents(): Promise<RaceEventListItemDto[]> {
  const data = (await api.get(EVENT_API)) as RaceEventListItemDto[];
  return (Array.isArray(data) ? data : []).map(withResolvedBanner);
}

/** Get event detail by ID (public) */
export async function getEventById(eventId: string): Promise<RaceEventDto> {
  const data = (await api.get(`${EVENT_API}/${eventId}`)) as RaceEventDto;
  return withResolvedDocuments(data);
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
