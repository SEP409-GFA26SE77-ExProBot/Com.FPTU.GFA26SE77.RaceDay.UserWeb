import api from "@/config/axios";
import type {
  ComplaintDto,
  ComplaintFilters,
  ComplaintsPageDto,
  CreateComplaintDto,
  ReplyComplaintDto,
} from "@/dto/complaint.dto";
import { normalizeComplaintStatus } from "@/lib/complaints";

export interface ComplaintEventOption {
  id: string;
  name: string;
}

const API = "api/v1/event";
const normalize = (complaint: ComplaintDto): ComplaintDto => ({
  ...complaint,
  status: normalizeComplaintStatus(complaint.status),
});
const normalizePage = (data: ComplaintsPageDto): ComplaintsPageDto => ({
  ...data,
  items: data.items.map(normalize),
});

export async function getMyComplaints(
  page = 1,
  pageSize = 10,
): Promise<ComplaintsPageDto> {
  // Omit eventId and status so the API returns every complaint belonging to the runner.
  return normalizePage(
    await api.get<ComplaintsPageDto, ComplaintsPageDto>(
      `${API}/complaints/mine`,
      { params: { page, pageSize } },
    ),
  );
}

export async function getOrganizerComplaints(
  filters: ComplaintFilters = {},
): Promise<ComplaintsPageDto> {
  return normalizePage(
    await api.get<ComplaintsPageDto, ComplaintsPageDto>(
      `${API}/organizer/complaints`,
      {
        params: {
          ...filters,
          page: filters.page ?? 1,
          pageSize: filters.pageSize ?? 10,
        },
      },
    ),
  );
}

export function getComplaintEvents(): Promise<ComplaintEventOption[]> {
  return api.get<ComplaintEventOption[], ComplaintEventOption[]>(
    `${API}/organizer/mine`,
  );
}

export async function getComplaintDetail(
  complaintId: string,
): Promise<ComplaintDto> {
  return normalize(
    await api.get<ComplaintDto, ComplaintDto>(`${API}/complaints/detail`, {
      params: { complaintId },
    }),
  );
}

export async function createComplaint(
  body: CreateComplaintDto,
): Promise<ComplaintDto> {
  return normalize(
    await api.post<ComplaintDto, ComplaintDto>(`${API}/complaints`, body),
  );
}

export async function replyToComplaint(
  complaintId: string,
  body: ReplyComplaintDto,
): Promise<ComplaintDto> {
  return normalize(
    await api.post<ComplaintDto, ComplaintDto>(
      `${API}/organizer/complaints/${complaintId}/reply`,
      body,
    ),
  );
}
