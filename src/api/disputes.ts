import api from "@/config/axios";
import type {
  CreateEventDisputeDto,
  EventDisputeDto,
  RecentJoinedEventDto,
  RunnerPageDto,
} from "@/dto/dispute.dto";

const EVENT_API = "api/v1/event";

export async function getMyEventDisputes(
  page = 1,
  pageSize = 10,
): Promise<RunnerPageDto<EventDisputeDto>> {
  return (await api.get(`${EVENT_API}/disputes/mine`, {
    params: { page, pageSize },
  })) as RunnerPageDto<EventDisputeDto>;
}

export async function getRecentJoinedEvents(
  page = 1,
  pageSize = 20,
): Promise<RunnerPageDto<RecentJoinedEventDto>> {
  return (await api.get(`${EVENT_API}/joined/recent`, {
    params: { page, pageSize },
  })) as RunnerPageDto<RecentJoinedEventDto>;
}

export async function createEventDispute(
  body: CreateEventDisputeDto,
): Promise<EventDisputeDto> {
  return (await api.post(`${EVENT_API}/disputes`, body)) as EventDisputeDto;
}
