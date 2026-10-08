import api from "@/config/axios";
import {
  RaceEventDto,
  RaceEventListItemDto,
  CreateRegistrationDto,
  RegistrationDto,
} from "@/dto/event.dto";

const EVENT_API = "api/v1/event";

// ─── Public ────────────────────────────────────────────

/** List public events (approved / registration-open…) */
export async function getEvents(): Promise<RaceEventListItemDto[]> {
  return api.get(EVENT_API);
}

/** Get event detail by ID (public) */
export async function getEventById(eventId: string): Promise<RaceEventDto> {
  return api.get(`${EVENT_API}/${eventId}`);
}

// ─── Runner uploads ────────────────────────────────────

/** Upload health certificate (runner), returns fileUrl */
export async function uploadHealthCert(file: File): Promise<{ fileUrl: string; fileName: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`${EVENT_API}/uploads`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// ─── Runner registrations ──────────────────────────────

/** Runner registers for an event – creates pending_payment registration */
export async function createRegistration(
  eventId: string,
  data: CreateRegistrationDto
): Promise<RegistrationDto> {
  return api.post(`${EVENT_API}/${eventId}/registrations`, data);
}

/** Get my registrations */
export async function getMyRegistrations(): Promise<RegistrationDto[]> {
  return api.get(`${EVENT_API}/registrations/mine`);
}

/** Get registration detail (includes BIB + QR when confirmed) */
export async function getRegistrationById(registrationId: string): Promise<RegistrationDto> {
  return api.get(`${EVENT_API}/registrations/${registrationId}`);
}

/** Cancel a pending_payment registration */
export async function cancelRegistration(registrationId: string): Promise<void> {
  return api.post(`${EVENT_API}/registrations/${registrationId}/cancel`);
}
