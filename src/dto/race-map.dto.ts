/** Course / checkpoint shape — khớp demo Map & (tương lai) Event.RouteGeometryJson */

/** start/finish cố định; cp = checkpoint timing; aid = điểm tiếp tế */
export type CheckpointType = "start" | "cp" | "aid" | "finish";

export interface LatLngDto {
  lat: number;
  lng: number;
}

export interface RaceCheckpointDto {
  id: string;
  name: string;
  km: number;
  lat: number;
  lng: number;
  type: CheckpointType;
  cutoff?: string;
}

/** Config đường đua + CP — mỗi cự ly (distanceId) một course riêng */
export interface CourseConfigDto {
  title: string;
  /** Cự ly thuộc event — null = legacy 1 map / event */
  distanceId?: string | null;
  distanceKm: number;
  waypoints: LatLngDto[];
  polyline: LatLngDto[];
  checkpoints: RaceCheckpointDto[];
  updatedAt: string;
}

export interface CheckpointDraftDto {
  name: string;
  km: number;
  cutoff?: string;
  /** Chỉ dùng cho điểm giữa route */
  type?: "cp" | "aid";
}

export interface SimRunnerDto {
  bib: number;
  chipId: string;
  name: string;
  gender: "Nam" | "Nữ";
  speedKmh: number;
  startOffsetSec: number;
  spoofChip?: boolean;
}

export interface DemoEventMetaDto {
  id: string;
  title: string;
  city: string;
  gunTimeIso: string;
  distanceKm: number;
  maxPlausibleKmh: number;
  duplicateWindowSec: number;
  mapMarkerLimit: number;
  uiFlushMs: number;
}
