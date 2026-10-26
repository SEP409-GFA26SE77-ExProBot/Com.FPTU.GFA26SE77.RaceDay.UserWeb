export interface RunnerPageDto<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface RecentJoinedEventDto {
  id: string;
  name: string;
  date: string;
  endDate: string | null;
  location: string;
}

export interface EventDisputeDto {
  id: string;
  eventId: string;
  eventName: string;
  title: string;
  description: string;
  status: "open" | "resolved" | "rejected";
  createdAtUtc: string;
}

export interface CreateEventDisputeDto {
  eventId: string;
  title: string;
  description: string;
}
