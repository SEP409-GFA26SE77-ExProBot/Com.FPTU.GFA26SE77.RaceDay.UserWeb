"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Droplets,
  Eye,
  Flag,
  MapPin,
  PencilRuler,
  Trash2,
  X,
} from "lucide-react";
import { useCourse, type SetupTool } from "@/components/organizer/race-map/CourseContext";
import { courseLengthLabel } from "@/lib/race-map/course";
import { checkpointDotClass } from "@/lib/race-map/map-colors";
import PlaceSearch, { type PlaceHit } from "@/components/organizer/race-map/PlaceSearch";
import type { MapFocusTarget } from "@/components/organizer/race-map/SetupMapCanvas";

const SetupMapCanvas = dynamic(
  () => import("@/components/organizer/race-map/SetupMapCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-sm text-muted-foreground">
        Đang tải bản đồ…
      </div>
    ),
  }
);

const TOOLS: {
  id: SetupTool;
  short: string;
  hint: string;
  icon: typeof Flag;
}[] = [
  {
    id: "start-end",
    short: "Start/Finish",
    hint: "Click Start rồi Finish trên map",
    icon: Flag,
  },
  {
    id: "reshape",
    short: "Route",
    hint: "Kéo điểm hoặc thêm VIA",
    icon: PencilRuler,
  },
  {
    id: "checkpoint",
    short: "Checkpoint",
    hint:
      "Checkpoint phải nằm trên đường chạy (≤45m). Điểm ngoài route sẽ bị từ chối — click sát đường cam.",
    icon: MapPin,
  },
  {
    id: "aid",
    short: "Điểm tiếp tế",
    hint:
      "Điểm tiếp tế phải trên đường chạy (≤45m). Click sát đường cam — không đặt ngoài route.",
    icon: Droplets,
  },
];

const VIEW_HINT =
  "Click điểm đã setup trên map để xem loại & khoảng cách từ xuất phát";

const panel =
  "rounded-xl border border-border/60 bg-card shadow-sm";

function isMidEditable(type: string) {
  return type === "cp" || type === "aid";
}

export default function OrganizerSetupMap() {
  const {
    draft,
    tool,
    setTool,
    handleMapClick,
    moveWaypoint,
    removeViaAt,
    renameCheckpoint,
    removeMidCheckpoint,
    clearCourse,
    snapping,
    applyCourse,
    startEndPhase,
  } = useCourse();

  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toolMeta =
    tool === "view"
      ? { hint: VIEW_HINT }
      : (TOOLS.find((t) => t.id === tool) ?? TOOLS[0]);

  useEffect(() => {
    setFocusTarget(null);
  }, [draft.polyline.length, draft.distanceKm]);

  const onPlaceSelect = (place: PlaceHit) => {
    setFocusTarget({
      token: `search-${place.lat}-${place.lng}-${Date.now()}`,
      lat: place.lat,
      lng: place.lng,
      zoom: place.bbox ? undefined : 15,
      bbox: place.bbox,
    });
  };

  const routeStatus =
    draft.distanceKm > 0
      ? courseLengthLabel(draft)
      : startEndPhase === "need-end"
        ? "Chờ Finish…"
        : "Chưa có route";

  const canApply =
    draft.polyline.length >= 2 &&
    draft.checkpoints.length >= 2 &&
    !snapping;

  const onConfirmApply = () => {
    applyCourse();
    setConfirmOpen(false);
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[260px_1fr]">
      <aside className={`${panel} flex min-h-0 flex-col gap-2.5 overflow-hidden p-3`}>
        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
          <p className="text-sm font-bold text-foreground">
            {snapping ? "Đang snap…" : routeStatus}
          </p>
          <p className="mt-1 text-sm leading-snug text-foreground/80">
            {toolMeta.hint}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-2 border-t border-border/60 pt-3">
          <p className="text-xs font-bold text-foreground">
            Checkpoint & điểm tiếp tế
          </p>
          <ul className="max-h-[min(22rem,40vh)] space-y-1.5 overflow-y-auto overscroll-contain pr-0.5">
            {draft.checkpoints.map((cp) => (
              <li
                key={cp.id}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2 py-1.5 text-[11px]"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${checkpointDotClass(cp.type)}`}
                />
                {isMidEditable(cp.type) ? (
                  <input
                    value={cp.name}
                    onChange={(e) => renameCheckpoint(cp.km, e.target.value)}
                    className="min-w-0 flex-1 rounded border border-border bg-background px-1.5 py-1"
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {cp.name}
                  </span>
                )}
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {cp.km}k
                </span>
                {isMidEditable(cp.type) ? (
                  <button
                    type="button"
                    onClick={() => removeMidCheckpoint(cp.km)}
                    className="text-red-500 hover:text-red-600"
                    title="Xóa điểm"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </li>
            ))}
            {draft.checkpoints.length === 0 ? (
              <li className="text-muted-foreground">
                Chưa có checkpoint / điểm tiếp tế.
              </li>
            ) : null}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!canApply}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40"
        >
          <Check className="h-4 w-4" /> Áp dụng
        </button>
      </aside>

      <main
        className={`${panel} relative isolate h-[min(60vh,560px)] overflow-hidden xl:h-full xl:min-h-0`}
      >
        <SetupMapCanvas
          tool={tool}
          waypoints={draft.waypoints}
          polyline={draft.polyline}
          checkpoints={draft.checkpoints}
          focusTarget={focusTarget}
          onMapClick={(p) => void handleMapClick(p)}
          onMoveWaypoint={(i, p) => void moveWaypoint(i, p)}
          onRemoveVia={(i) => void removeViaAt(i)}
        />
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-[1000]">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-card/95 p-1.5 shadow-md backdrop-blur-sm">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              const active = tool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTool(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.short}
                </button>
              );
            })}
            <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <PlaceSearch onSelect={onPlaceSelect} />
            <button
              type="button"
              onClick={() => setTool("view")}
              className={`ml-auto inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                tool === "view"
                  ? "border-transparent bg-gradient-to-r from-orange-500 to-red-600 text-white"
                  : "border-border bg-white text-muted-foreground hover:border-orange-400/60 hover:text-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> View
            </button>
            <button
              type="button"
              onClick={clearCourse}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-muted-foreground hover:border-orange-400/60 hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" /> Xóa
            </button>
          </div>
        </div>
      </main>

      {mounted && confirmOpen
        ? createPortal(
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="apply-map-title"
                className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                      Xác nhận
                    </p>
                    <h2
                      id="apply-map-title"
                      className="mt-2 text-lg font-black text-foreground"
                    >
                      Bạn có muốn lưu thay đổi này?
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Lộ trình, checkpoint và điểm tiếp tế của cự ly đang chọn
                      sẽ được lưu.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Đóng"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={onConfirmApply}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    <Check className="h-4 w-4" /> Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
