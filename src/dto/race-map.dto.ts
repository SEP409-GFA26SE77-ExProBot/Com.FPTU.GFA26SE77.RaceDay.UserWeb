/** Course / checkpoint shape — khớp demo Map & (tương lai) Event.RouteGeometryJson */

export type CheckpointType = "start" | "aid" | "finish";

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

/** Config đường đua + CP — lưu mock localStorage hoặc PUT BE sau này */
export interface CourseConfigDto {
  title: string;
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
