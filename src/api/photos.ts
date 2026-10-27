import api from "@/config/axios";
import type {
  PagedPhotosDto,
  PhotoDetailDto,
  PhotoDisputeDto,
} from "@/dto/photo.dto";
import { resolveStoredFileUrl } from "@/lib/media-url";

const PHOTO_API = "api/v1/photo";

function withResolvedUrl<T extends { url: string }>(item: T): T {
  if (!item?.url) return item;
  return { ...item, url: resolveStoredFileUrl(item.url) };
}

function normalizePaged(raw: PagedPhotosDto | null | undefined): PagedPhotosDto {
  const items = Array.isArray(raw?.items) ? raw!.items.map(withResolvedUrl) : [];
  return {
    items,
    page: raw?.page ?? 1,
    pageSize: raw?.pageSize ?? 50,
    total: raw?.total ?? items.length,
  };
}

// ─── Authenticated (runner) ────────────────────────────

/** Search ảnh đã index theo event + BIB (Matched / ManualCorrected). Không gọi OCR. */
export async function searchPhotos(params: {
  eventId: string;
  bib: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedPhotosDto> {
  const q = new URLSearchParams({
    eventId: params.eventId,
    bib: params.bib.trim(),
  });
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  const raw = await api.get<PagedPhotosDto, PagedPhotosDto>(`${PHOTO_API}/photos?${q.toString()}`);
  return normalizePaged(raw);
}

export async function getPhotoDetail(photoId: string): Promise<PhotoDetailDto> {
  const raw = (await api.get(
    `${PHOTO_API}/photos/${photoId}`
  )) as PhotoDetailDto;
  return withResolvedUrl(raw);
}

/** Runner báo sai BIB / ảnh → RunnerReported */
export async function createPhotoDispute(
  photoId: string,
  reason: string
): Promise<PhotoDisputeDto> {
  return api.post(`${PHOTO_API}/photos/${photoId}/disputes`, {
    reason: reason.trim(),
  });
}

export async function listMyPhotoDisputes(): Promise<PhotoDisputeDto[]> {
  const raw = await api.get(`${PHOTO_API}/me/disputes`);
  return Array.isArray(raw) ? raw : [];
}
