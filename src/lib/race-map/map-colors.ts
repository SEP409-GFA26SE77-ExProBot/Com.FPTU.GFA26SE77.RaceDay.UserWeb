import type { CheckpointType } from "@/dto/race-map.dto";

/**
 * Palette map RaceDay — ấm theo brand orange→red, đọc được trên OSM sáng.
 * Tránh neon sky/violet tách khỏi UI.
 */
export const MAP_COLORS = {
  route: "#ea580c",
  routeSoft: "#fb923c",
  start: "#0f766e",
  finish: "#b91c1c",
  checkpoint: "#c2410c",
  aid: "#a16207",
  via: "#9a3412",
} as const;

export function checkpointMapColor(type: CheckpointType | string): string {
  switch (type) {
    case "finish":
      return MAP_COLORS.finish;
    case "start":
      return MAP_COLORS.start;
    case "aid":
      return MAP_COLORS.aid;
    case "cp":
    default:
      return MAP_COLORS.checkpoint;
  }
}

/** Dot class cho list/sidebar — cùng họ màu với map */
export function checkpointDotClass(type: CheckpointType | string): string {
  switch (type) {
    case "finish":
      return "bg-red-700";
    case "start":
      return "bg-teal-700";
    case "aid":
      return "bg-amber-700";
    case "cp":
    default:
      return "bg-orange-700";
  }
}
