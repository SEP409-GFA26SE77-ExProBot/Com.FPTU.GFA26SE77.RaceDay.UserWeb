export const COMPLAINT_STATUSES = ["Pending", "Accepted", "Rejected"] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export interface ComplaintDto {
  id: string;
  eventId: string;
  eventName: string;
  distanceId: string;
  distanceName: string;
  userId: string;
  title: string;
  content: string;
  evidenceLinks: string[];
  status: ComplaintStatus;
  processingStatus: string;
  responseContent: string | null;
  createdAtUtc: string;
  repliedAtUtc: string | null;
}

export interface ComplaintsPageDto {
  items: ComplaintDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  pendingCount?: number;
}

export interface ComplaintFilters {
  eventId?: string | null;
  status?: ComplaintStatus | null;
  fromDate?: string | null;
  toDate?: string | null;
  page?: number;
  pageSize?: number;
}

export interface CreateComplaintDto {
  eventId: string;
  distanceId: string;
  title: string;
  content: string;
  evidenceLinks: string[];
}

export interface ReplyComplaintDto {
  responseContent: string;
  decision: Exclude<ComplaintStatus, "Pending">;
}
