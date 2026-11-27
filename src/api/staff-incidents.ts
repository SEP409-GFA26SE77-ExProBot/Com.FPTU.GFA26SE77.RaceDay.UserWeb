/** Sự cố nhân viên (lượt ra ngoài vùng hoạt động + báo cáo từ app Staff) — BE Positioning module. */
import api from "@/config/axios";

export type StaffIncidentKind = "OutOfZone" | "Report";

export type StaffIncidentType =
  | "Weather"
  | "CourseHazard"
  | "Medical"
  | "Security"
  | "Logistics"
  | "Other";

export type StaffIncident = {
  id: string;
  kind: StaffIncidentKind;
  userId: string;
  staffName: string;
  /** Vai trò lúc ghi nhận, có thể nhiều vai trò cách nhau bằng dấu phẩy ("photographer, race-staff"). */
  role: string;
  /** Tên các vùng được phân công. */
  zoneName: string | null;
  incidentType: StaffIncidentType | null;
  description: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  /** Lúc ra khỏi vùng, hoặc lúc gửi báo cáo. */
  occurredAtUtc: string;
  /** Chỉ với OutOfZone: lúc vào lại vùng; null khi vẫn đang ở ngoài. */
  returnedAtUtc: string | null;
};

export type StaffIncidentPage = {
  items: StaffIncident[];
  total: number;
  page: number;
  pageSize: number;
  outOfZoneCount: number;
  reportCount: number;
  currentlyOutsideCount: number;
};

export type StaffIncidentQuery = {
  kind?: StaffIncidentKind;
  search?: string;
  page?: number;
  pageSize?: number;
};

/** GET sự cố nhân viên của giải (chỉ BTC của giải hoặc Admin), mới nhất trước. */
export async function listStaffIncidents(
  eventId: string,
  query: StaffIncidentQuery = {},
): Promise<StaffIncidentPage> {
  return (await api.get(
    `api/v1/positioning/events/${encodeURIComponent(eventId)}/staff-incidents`,
    {
      params: {
        kind: query.kind,
        search: query.search?.trim() || undefined,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      },
    },
  )) as StaffIncidentPage;
}
