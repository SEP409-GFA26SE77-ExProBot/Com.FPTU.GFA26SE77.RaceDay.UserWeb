import api from "@/config/axios";
import type {
  EventDashboardDto,
  OrganizerDashboardDto,
  RegistrationTrendDto,
  RevenueTrendDto,
} from "@/dto/dashboard.dto";
import type { DateRange } from "@/lib/dashboard";

export function getOrganizerDashboard(): Promise<OrganizerDashboardDto> {
  return api.get("api/v1/event/organizer/dashboard");
}
export function getEventDashboard(eventId: string): Promise<EventDashboardDto> {
  return api.get(
    `api/v1/event/organizer/${encodeURIComponent(eventId)}/dashboard`,
  );
}
export function getRegistrationTrend(
  eventId: string,
  range: DateRange,
): Promise<RegistrationTrendDto> {
  return api.get(
    `api/v1/event/organizer/${encodeURIComponent(eventId)}/dashboard/registrations-trend`,
    { params: range },
  );
}
export function getRevenueTrend(
  range: DateRange,
  eventId?: string,
): Promise<RevenueTrendDto> {
  return api.get("api/v1/finance/organizer/revenue-trend", {
    params: { ...range, eventId },
  });
}

export function exportOrganizerDashboard(
  range: DateRange, format: "xlsx" | "pdf", eventId?: string, distanceId?: string,
): Promise<Blob> {
  const path = eventId
    ? `api/v1/event/organizer/${encodeURIComponent(eventId)}/dashboard/export`
    : "api/v1/event/organizer/dashboard/export";
  return api.get(path, {
    params: { ...range, format, distanceId: distanceId || undefined },
    responseType: "blob",
    timeout: 60000,
  });
}
