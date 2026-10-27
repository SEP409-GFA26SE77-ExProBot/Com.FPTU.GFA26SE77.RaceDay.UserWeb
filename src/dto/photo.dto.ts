/** Khớp RaceDay.Modules.Photo PhotoDtos / DisputeDto (camelCase). */

export interface PhotoTagDto {
  bib: string;
  confidence: number;
  source: string;
  bboxJson?: string | null;
}

export interface PhotoListItemDto {
  id: string;
  eventId: string;
  url: string;
  status: string;
  zone?: string | null;
  tags: PhotoTagDto[];
  createdAtUtc: string;
  discardReason?: string | null;
}

export interface PhotoDetailDto {
  id: string;
  eventId: string;
  url: string;
  status: string;
  zone?: string | null;
  originalFileName?: string | null;
  discardReason?: string | null;
  tags: PhotoTagDto[];
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface PagedPhotosDto {
  items: PhotoListItemDto[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PhotoDisputeDto {
  id: string;
  photoId: string;
  eventId: string;
  reporterUserId: string;
  reason: string;
  status: string;
  reviewNote?: string | null;
  createdAtUtc: string;
  reviewedAtUtc?: string | null;
}
