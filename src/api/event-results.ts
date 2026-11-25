import api from "@/config/axios";
import { getApiErrorMessage } from "@/lib/error";
import type { LeaderboardGender } from "@/dto/leaderboard.dto";

const EVENT_API = "api/v1/event";

export type OrganizerLeaderboardItemDto = {
  rank: number;
  eventName: string;
  distanceName: string;
  bib: string;
  fullName: string;
  gender: string | null;
  startAtUtc: string | null;
  finishAtUtc: string | null;
  totalTime: string;
  pace: string;
};

export type OrganizerLeaderboardPageDto = {
  items: OrganizerLeaderboardItemDto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  resultsPublished: boolean;
};

export type DistanceResultsPublishStatusDto = {
  distanceId: string;
  name: string;
  distanceKm: number;
  resultsPublished: boolean;
  resultsPublishedAtUtc: string | null;
  finishedCount: number;
};

function asPage(raw: unknown, page: number, pageSize: number): OrganizerLeaderboardPageDto {
  const o = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(o.items) ? (o.items as OrganizerLeaderboardItemDto[]) : [];
  return {
    items: items.map((row) => ({
      rank: Number(row.rank) || 0,
      eventName: String(row.eventName ?? ""),
      distanceName: String(row.distanceName ?? ""),
      bib: String(row.bib ?? ""),
      fullName: String(row.fullName ?? ""),
      gender: row.gender == null ? null : String(row.gender),
      startAtUtc: row.startAtUtc == null ? null : String(row.startAtUtc),
      finishAtUtc: row.finishAtUtc == null ? null : String(row.finishAtUtc),
      totalTime: String(row.totalTime ?? "—"),
      pace: String(row.pace ?? "—"),
    })),
    totalCount: Number(o.totalCount ?? items.length) || 0,
    totalPages: Number(o.totalPages ?? 1) || 1,
    currentPage: Number(o.currentPage ?? page) || page,
    pageSize: Number(o.pageSize ?? pageSize) || pageSize,
    resultsPublished: Boolean(o.resultsPublished),
  };
}

export async function getOrganizerDistanceLeaderboard(
  eventId: string,
  distanceId: string,
  opts?: {
    gender?: LeaderboardGender;
    page?: number;
    pageSize?: number;
  }
): Promise<OrganizerLeaderboardPageDto> {
  const page = opts?.page ?? 1;
  const pageSize = opts?.pageSize ?? 20;
  try {
    const raw = await api.get(
      `${EVENT_API}/organizer/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/leaderboard`,
      {
        params: {
          gender: opts?.gender && opts.gender !== "All" ? opts.gender : undefined,
          page,
          pageSize,
        },
      }
    );
    return asPage(raw, page, pageSize);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không tải bảng kết quả."));
  }
}

export async function getDistanceResultsPublishStatus(
  eventId: string,
  distanceId: string
): Promise<DistanceResultsPublishStatusDto> {
  try {
    return (await api.get(
      `${EVENT_API}/organizer/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/results-publish`
    )) as DistanceResultsPublishStatusDto;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không tải trạng thái công bố."));
  }
}

export async function setDistanceResultsPublished(
  eventId: string,
  distanceId: string,
  published: boolean
): Promise<DistanceResultsPublishStatusDto> {
  try {
    return (await api.post(
      `${EVENT_API}/organizer/${encodeURIComponent(eventId)}/distances/${encodeURIComponent(distanceId)}/results-publish`,
      { published }
    )) as DistanceResultsPublishStatusDto;
  } catch (e) {
    throw new Error(
      getApiErrorMessage(
        e,
        published ? "Công bố kết quả thất bại." : "Ẩn kết quả thất bại."
      )
    );
  }
}
