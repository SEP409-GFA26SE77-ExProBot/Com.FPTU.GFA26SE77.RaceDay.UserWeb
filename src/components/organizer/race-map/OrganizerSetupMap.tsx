"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Check,
  Flag,
  MapPin,
  PencilRuler,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useCourse, type SetupTool } from "@/components/organizer/race-map/CourseContext";
import { courseLengthLabel } from "@/lib/race-map/course";
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
    hint: "Click sát đường đua để đặt CP",
    icon: MapPin,
  },
];

const panel =
  "rounded-xl border border-border/60 bg-card shadow-sm";

export default function OrganizerSetupMap() {
  const {
    draft,
    tool,
    setTool,
    setTitle,
    handleMapClick,
    moveWaypoint,
    removeViaAt,
    renameCheckpoint,
    removeMidCheckpoint,
    clearCourse,
    snapping,
    snapError,
    mapHint,
    applyToSimulation,
    resetToDefault,
    startEndPhase,
  } = useCourse();

  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null);

  const toolMeta = TOOLS.find((t) => t.id === tool) ?? TOOLS[0];

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

  return (
    <div className="grid min-h-[640px] grid-cols-1 gap-3 xl:grid-cols-[280px_1fr]">
      <aside className={`${panel} flex flex-col gap-3 p-4`}>
        <label className="block space-y-1 text-xs">
          <span className="font-semibold text-muted-foreground">Tên cự ly</span>
          <input
            value={draft.title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
          />
        </label>

        <div className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
          <p className="font-semibold text-foreground">
            {snapping ? "Đang snap…" : routeStatus}
          </p>
          {mapHint ? (
            <p className="mt-0.5 text-orange-600">{mapHint}</p>
          ) : (
            <p className="mt-0.5">{toolMeta.hint}</p>
          )}
        </div>

        {snapError ? (
          <p className="rounded-lg border border-red-500/25 bg-red-500/5 px-2.5 py-2 text-[11px] text-red-700">
            {snapError}
          </p>
        ) : null}

        <div className="min-h-0 flex-1 space-y-2 border-t border-border/60 pt-3">
          <p className="text-xs font-bold text-foreground">Checkpoints</p>
          <ul className="max-h-56 space-y-1.5 overflow-auto">
            {draft.checkpoints.map((cp) => (
              <li
                key={cp.id}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2 py-1.5 text-[11px]"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    cp.type === "finish"
                      ? "bg-red-500"
                      : cp.type === "start"
                        ? "bg-emerald-500"
                        : "bg-orange-500"
                  }`}
                />
                {cp.type === "aid" ? (
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
                {cp.type === "aid" ? (
                  <button
                    type="button"
                    onClick={() => removeMidCheckpoint(cp.km)}
                    className="text-red-500 hover:text-red-600"
                    title="Xóa CP"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </li>
            ))}
            {draft.checkpoints.length === 0 ? (
              <li className="text-muted-foreground">Chưa có checkpoint.</li>
            ) : null}
          </ul>
        </div>

        <button
          type="button"
          onClick={applyToSimulation}
          disabled={
            draft.polyline.length < 2 ||
            draft.checkpoints.length < 2 ||
            snapping
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40"
        >
          <Check className="h-4 w-4" /> Áp dụng → Simulation
        </button>
      </aside>

      <main
        className={`${panel} relative min-h-[440px] overflow-hidden`}
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
              onClick={clearCourse}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-muted-foreground hover:border-orange-400/60 hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" /> Xóa
            </button>
            <button
              type="button"
              onClick={resetToDefault}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-muted-foreground hover:border-orange-400/60 hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Gợi ý map
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
