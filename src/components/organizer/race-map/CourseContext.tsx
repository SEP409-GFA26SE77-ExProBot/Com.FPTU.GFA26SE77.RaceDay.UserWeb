"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  buildCheckpoints,
  createDefaultCourse,
  defaultCpDrafts,
  normalizeCpDrafts,
  rebuildCourseFromSnap,
  type CheckpointDraft,
  type CourseConfig,
} from "@/lib/race-map/course";
import type { LatLng } from "@/api/race-map.mock-data";
import { getEventCourse, saveEventCourse } from "@/api/race-map";
import { fetchOsrmRoute } from "@/lib/race-map/osrm";
import { nearestPointOnPolyline } from "@/lib/race-map/geo";

/** CP phải nằm trong ~45m so với polyline */
const CP_MAX_OFF_ROUTE_KM = 0.045;

export type SetupTool = "start-end" | "reshape" | "checkpoint";

interface CourseContextValue {
  eventId: string;
  tool: SetupTool;
  setTool: (t: SetupTool) => void;
  draft: CourseConfig;
  applied: CourseConfig;
  cpDrafts: CheckpointDraft[];
  setTitle: (title: string) => void;
  /** Click theo tool hiện tại */
  handleMapClick: (p: LatLng) => Promise<void>;
  /** Kéo Start / Finish / Via → snap lại route */
  moveWaypoint: (index: number, p: LatLng) => Promise<void>;
  removeViaAt: (index: number) => Promise<void>;
  renameCheckpoint: (km: number, name: string) => void;
  removeMidCheckpoint: (km: number) => void;
  clearCourse: () => void;
  /** Xóa route cũ, vào chế độ chọn Start rồi Finish tự do trên map */
  beginRedrawStartFinish: () => void;
  snapping: boolean;
  snapError: string | null;
  mapHint: string | null;
  /** Lưu course + chuyển sang sidebar Race simulation */
  applyToSimulation: () => void;
  resetToDefault: () => void;
  appliedVersion: number;
  /** start chưa có / đang chờ end */
  startEndPhase: "need-start" | "need-end" | "ready";
}

const CourseContext = createContext<CourseContextValue | null>(null);

function midDraftsOnly(defs: CheckpointDraft[], distanceKm: number): CheckpointDraft[] {
  return defs.filter((d) => d.km > 0.02 && d.km < distanceKm - 0.02);
}

export function CourseProvider({
  eventId,
  children,
}: {
  eventId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const defaults = useMemo(() => createDefaultCourse(), []);
  const [tool, setTool] = useState<SetupTool>("start-end");
  const [applied, setApplied] = useState<CourseConfig>(defaults);
  const [draft, setDraft] = useState<CourseConfig>(defaults);
  const [cpDrafts, setCpDraftsState] = useState<CheckpointDraft[]>(() =>
    defaults.checkpoints.map((c) => ({
      name: c.name,
      km: c.km,
      cutoff: c.cutoff,
    }))
  );
  const [snapping, setSnapping] = useState(false);
  const [snapError, setSnapError] = useState<string | null>(null);
  const [mapHint, setMapHint] = useState<string | null>(null);
  const [appliedVersion, setAppliedVersion] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [pendingStart, setPendingStart] = useState<LatLng | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    (async () => {
      try {
        const course = await getEventCourse(eventId);
        if (cancelled) return;
        setApplied(course);
        setDraft(course);
        setCpDraftsState(
          course.checkpoints.map((c) => ({
            name: c.name,
            km: c.km,
            cutoff: c.cutoff,
          }))
        );
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!hydrated) return;
    void saveEventCourse(eventId, applied);
  }, [applied, hydrated, eventId]);

  const setTitle = useCallback((title: string) => {
    setDraft((d) => ({ ...d, title }));
  }, []);

  const runSnap = useCallback(
    async (waypoints: LatLng[], keepMidFraction = true, switchToReshape = true) => {
      setSnapping(true);
      setSnapError(null);
      try {
        if (waypoints.length < 2) throw new Error("Cần Start và Finish.");
        const result = await fetchOsrmRoute(waypoints);
        if (result.polyline.length < 8) {
          throw new Error(
            "OSRM trả quá ít điểm — route có thể bị thẳng. Thử chọn lại Start/Finish sát mặt đường."
          );
        }
        const dist = Math.round(result.distanceKm * 1000) / 1000;

        let mid: CheckpointDraft[] = [];
        if (keepMidFraction && draft.distanceKm > 0 && cpDrafts.length) {
          mid = midDraftsOnly(cpDrafts, draft.distanceKm).map((d) => {
            const frac = d.km / draft.distanceKm;
            const km = Math.round(frac * dist * 1000) / 1000;
            return {
              ...d,
              km: Math.min(Math.max(0.05, km), dist - 0.05),
            };
          });
        }

        const defs =
          mid.length > 0
            ? normalizeCpDrafts(
                [
                  { km: 0, name: "Xuất phát", cutoff: "06:10" },
                  ...mid,
                  { km: dist, name: `Vạch đích ${dist}km`, cutoff: "07:00" },
                ],
                dist
              )
            : defaultCpDrafts(dist);

        const next = rebuildCourseFromSnap(
          draft.title,
          waypoints,
          result.polyline,
          dist,
          defs
        );
        setDraft(next);
        setCpDraftsState(
          next.checkpoints.map((c) => ({ name: c.name, km: c.km, cutoff: c.cutoff }))
        );
        setPendingStart(null);
        setMapHint(
          `Route gợi ý ~${dist}km · ${result.polyline.length} điểm bám đường — kéo START/FINISH để đổi chỗ`
        );
        if (switchToReshape) setTool("reshape");
      } catch (e) {
        setSnapError(e instanceof Error ? e.message : "Không gợi ý được route");
      } finally {
        setSnapping(false);
      }
    },
    [cpDrafts, draft.distanceKm, draft.title]
  );

  const beginRedrawStartFinish = useCallback(() => {
    setTool("start-end");
    setPendingStart(null);
    setDraft((d) => ({
      ...d,
      waypoints: [],
      polyline: [],
      checkpoints: [],
      distanceKm: 0,
    }));
    setCpDraftsState([
      { km: 0, name: "Xuất phát", cutoff: "06:10" },
      { km: 0, name: "Vạch đích", cutoff: "07:00" },
    ]);
    setSnapError(null);
    setMapHint("Click map chọn START (chỗ bất kỳ trên đường) → rồi click FINISH");
  }, []);

  const moveWaypoint = useCallback(
    async (index: number, p: LatLng) => {
      if (index < 0 || index >= draft.waypoints.length) return;
      if (draft.waypoints.length < 2) {
        // đang chỉ có start pending
        setPendingStart(p);
        setDraft((d) => ({ ...d, waypoints: [p] }));
        return;
      }
      const next = draft.waypoints.map((w, i) => (i === index ? p : w));
      await runSnap(next, true, false);
    },
    [draft.waypoints, runSnap]
  );

  const handleMapClick = useCallback(
    async (p: LatLng) => {
      setSnapError(null);
      setMapHint(null);

      if (tool === "start-end") {
        // Nếu đang có route sẵn mà chưa vào bước chọn lại → click đầu = bắt đầu vẽ lại
        if (!pendingStart && draft.polyline.length >= 2) {
          setPendingStart(p);
          setDraft((d) => ({
            ...d,
            waypoints: [p],
            polyline: [],
            checkpoints: [],
            distanceKm: 0,
          }));
          setCpDraftsState([
            { km: 0, name: "Xuất phát", cutoff: "06:10" },
            { km: 0, name: "Vạch đích", cutoff: "07:00" },
          ]);
          setMapHint("Đã chọn START mới — click FINISH (chỗ bạn muốn kết thúc)");
          return;
        }

        if (!pendingStart) {
          setPendingStart(p);
          setDraft((d) => ({
            ...d,
            waypoints: [p],
            polyline: [],
            checkpoints: [],
            distanceKm: 0,
          }));
          setCpDraftsState([
            { km: 0, name: "Xuất phát", cutoff: "06:10" },
            { km: 0, name: "Vạch đích", cutoff: "07:00" },
          ]);
          setMapHint("Đã chọn START — click FINISH trên map");
          return;
        }

        await runSnap([pendingStart, p], false);
        return;
      }

      if (tool === "reshape") {
        if (draft.waypoints.length < 2 || draft.polyline.length < 2) {
          setSnapError("Chọn Start → Finish trước (tool Start/End).");
          return;
        }
        // chèn via theo vị trí dọc route hiện tại
        const snap = nearestPointOnPolyline(draft.polyline, p);
        if (!snap) return;
        const start = draft.waypoints[0];
        const end = draft.waypoints[draft.waypoints.length - 1];
        const vias = draft.waypoints.slice(1, -1);
        const total = draft.distanceKm || 1;
        const insertFrac = snap.kmAlong / total;

        const withFrac = [
          ...vias.map((v) => {
            const vs = nearestPointOnPolyline(draft.polyline, v);
            return { p: v, frac: vs ? vs.kmAlong / total : 0.5 };
          }),
          { p, frac: insertFrac },
        ].sort((a, b) => a.frac - b.frac);

        const nextWps = [start, ...withFrac.map((x) => x.p), end];
        setMapHint("Đang chỉnh khúc route (via)…");
        await runSnap(nextWps, true);
        return;
      }

      if (tool === "checkpoint") {
        if (draft.polyline.length < 2 || draft.distanceKm <= 0) {
          setSnapError("Cần có route trước khi đặt checkpoint.");
          return;
        }
        const snap = nearestPointOnPolyline(draft.polyline, p);
        if (!snap) return;
        if (snap.distKm > CP_MAX_OFF_ROUTE_KM) {
          setSnapError(
            `Checkpoint phải nằm trên route (cách đường ~${Math.round(snap.distKm * 1000)}m > 45m). Click sát đường xanh.`
          );
          return;
        }
        const km = Math.round(snap.kmAlong * 1000) / 1000;
        if (km < 0.05 || km > draft.distanceKm - 0.05) {
          setSnapError("Start/Finish đã cố định ở hai đầu — đặt CP ở giữa route.");
          return;
        }
        // tránh trùng CP gần nhau
        const tooClose = cpDrafts.some((d) => Math.abs(d.km - km) < 0.08);
        if (tooClose) {
          setSnapError("Đã có checkpoint gần vị trí này.");
          return;
        }

        const mid = [
          ...midDraftsOnly(cpDrafts, draft.distanceKm),
          { km, name: `CP ${km}km` },
        ].sort((a, b) => a.km - b.km);

        const defs = normalizeCpDrafts(
          [
            { km: 0, name: "Xuất phát", cutoff: "06:10" },
            ...mid,
            {
              km: draft.distanceKm,
              name: `Vạch đích ${draft.distanceKm}km`,
              cutoff: "07:00",
            },
          ],
          draft.distanceKm
        );
        setCpDraftsState(defs);
        setDraft((d) => ({
          ...d,
          checkpoints: buildCheckpoints(d.polyline, d.distanceKm, defs),
          updatedAt: new Date().toISOString(),
        }));
        setMapHint(`Đã đặt CP @ ${km}km (snap trên route)`);
      }
    },
    [tool, pendingStart, draft, cpDrafts, runSnap]
  );

  const removeViaAt = useCallback(
    async (index: number) => {
      // index trong full waypoints; 0 và last không xóa
      if (index <= 0 || index >= draft.waypoints.length - 1) return;
      const next = draft.waypoints.filter((_, i) => i !== index);
      await runSnap(next, true);
    },
    [draft.waypoints, runSnap]
  );

  const renameCheckpoint = useCallback((km: number, name: string) => {
    setCpDraftsState((prev) => {
      const next = prev.map((d) => (Math.abs(d.km - km) < 0.001 ? { ...d, name } : d));
      return next;
    });
    setDraft((d) => {
      if (d.polyline.length < 2) return d;
      const next = cpDrafts.map((c) =>
        Math.abs(c.km - km) < 0.001 ? { ...c, name } : c
      );
      return {
        ...d,
        checkpoints: buildCheckpoints(
          d.polyline,
          d.distanceKm,
          normalizeCpDrafts(next, d.distanceKm)
        ),
      };
    });
  }, [cpDrafts]);

  const removeMidCheckpoint = useCallback((km: number) => {
    const next = cpDrafts.filter((d) => Math.abs(d.km - km) > 0.001);
    setCpDraftsState(next);
    setDraft((d) => {
      if (d.polyline.length < 2) return d;
      const defs = normalizeCpDrafts(next, d.distanceKm);
      return {
        ...d,
        checkpoints: buildCheckpoints(d.polyline, d.distanceKm, defs),
      };
    });
  }, [cpDrafts]);

  const clearCourse = useCallback(() => {
    setPendingStart(null);
    setDraft((d) => ({
      ...d,
      waypoints: [],
      polyline: [],
      checkpoints: [],
      distanceKm: 0,
    }));
    setCpDraftsState([
      { km: 0, name: "Xuất phát", cutoff: "06:10" },
      { km: 0, name: "Vạch đích", cutoff: "07:00" },
    ]);
    setTool("start-end");
    setMapHint("Click Start trên map");
    setSnapError(null);
  }, []);

  const applyToSimulation = useCallback(() => {
    if (draft.polyline.length < 2 || draft.checkpoints.length < 2) {
      setSnapError("Cần Start/Finish + route trước khi áp dụng.");
      return;
    }
    const next = { ...draft, updatedAt: new Date().toISOString() };
    setApplied(next);
    setAppliedVersion((v) => v + 1);
    setSnapError(null);
    void saveEventCourse(eventId, next).then(() => {
      router.push(`/organizer/events/${eventId}/race-simulation`);
    });
  }, [draft, eventId, router]);

  const resetToDefault = useCallback(() => {
    const d = createDefaultCourse();
    setDraft(d);
    setApplied(d);
    setCpDraftsState(
      d.checkpoints.map((c) => ({ name: c.name, km: c.km, cutoff: c.cutoff }))
    );
    setPendingStart(null);
    setAppliedVersion((v) => v + 1);
    setSnapError(null);
    setMapHint("Đã load route demo Mỹ Khê 5K");
    setTool("checkpoint");
  }, []);

  const startEndPhase: CourseContextValue["startEndPhase"] = pendingStart
    ? "need-end"
    : draft.waypoints.length >= 2 && draft.polyline.length >= 2
      ? "ready"
      : "need-start";

  const value: CourseContextValue = {
    eventId,
    tool,
    setTool,
    draft,
    applied,
    cpDrafts,
    setTitle,
    handleMapClick,
    moveWaypoint,
    removeViaAt,
    renameCheckpoint,
    removeMidCheckpoint,
    clearCourse,
    beginRedrawStartFinish,
    snapping,
    snapError,
    mapHint,
    applyToSimulation,
    resetToDefault,
    appliedVersion,
    startEndPhase,
  };

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourse must be used within CourseProvider");
  return ctx;
}
