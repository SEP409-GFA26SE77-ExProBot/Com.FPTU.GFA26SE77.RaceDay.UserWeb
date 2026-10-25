"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildCheckpoints,
  createDefaultCourse,
  createEmptyCourse,
  defaultCpDrafts,
  midPointKind,
  normalizeCpDrafts,
  rebuildCourseFromSnap,
  type CheckpointDraft,
  type CourseConfig,
} from "@/lib/race-map/course";
import type { LatLng } from "@/api/race-map.mock-data";
import {
  getEventCourse,
  hasEventCourse,
  saveEventCourse,
} from "@/api/race-map";
import { getEventById } from "@/api/events";
import type { EventDistanceDto } from "@/dto/event.dto";
import { fetchOsrmRoute } from "@/lib/race-map/osrm";
import { nearestPointOnPolyline } from "@/lib/race-map/geo";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";

/** CP / điểm tiếp tế phải nằm trong ~45m so với polyline */
const CP_MAX_OFF_ROUTE_KM = 0.045;

export type SetupTool =
  | "start-end"
  | "reshape"
  | "checkpoint"
  | "aid"
  | "view";

function draftsFromCourse(course: CourseConfig): CheckpointDraft[] {
  return course.checkpoints.map((c) => {
    const mid =
      c.type !== "start" && c.type !== "finish"
        ? midPointKind(c.type, c.name)
        : undefined;
    return {
      name: c.name,
      km: c.km,
      cutoff: c.cutoff,
      ...(mid ? { type: mid } : {}),
    };
  });
}

interface CourseContextValue {
  eventId: string;
  distances: EventDistanceDto[];
  distancesLoading: boolean;
  selectedDistanceId: string | null;
  selectDistance: (distanceId: string) => Promise<void>;
  courseReadyByDistance: Record<string, boolean>;
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
  /** Lưu / áp dụng course cho cự ly đang chọn */
  applyCourse: () => void;
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
  const empty = useMemo(() => createEmptyCourse("Cự ly"), []);
  const [tool, setTool] = useState<SetupTool>("start-end");
  const [applied, setApplied] = useState<CourseConfig>(empty);
  const [draft, setDraft] = useState<CourseConfig>(empty);
  const [cpDrafts, setCpDraftsState] = useState<CheckpointDraft[]>([]);
  const [snapping, setSnapping] = useState(false);
  const [appliedVersion, setAppliedVersion] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [pendingStart, setPendingStart] = useState<LatLng | null>(null);
  const [distances, setDistances] = useState<EventDistanceDto[]>([]);
  const [distancesLoading, setDistancesLoading] = useState(true);
  const [selectedDistanceId, setSelectedDistanceId] = useState<string | null>(
    null
  );
  const [courseReadyByDistance, setCourseReadyByDistance] = useState<
    Record<string, boolean>
  >({});
  const selectedDistanceIdRef = useRef<string | null>(null);
  selectedDistanceIdRef.current = selectedDistanceId;

  const applyCourseLocal = useCallback((course: CourseConfig) => {
    const drafts = draftsFromCourse(course);
    const normalized =
      course.polyline.length >= 2 && course.distanceKm > 0
        ? {
            ...course,
            checkpoints: buildCheckpoints(
              course.polyline,
              course.distanceKm,
              drafts
            ),
          }
        : course;
    setApplied(normalized);
    setDraft(normalized);
    setCpDraftsState(drafts);
    setPendingStart(null);
    setAppliedVersion((v) => v + 1);
    if (normalized.polyline.length >= 2) {
      setTool("checkpoint");
    } else {
      setTool("start-end");
    }
  }, []);

  const refreshReadyFlags = useCallback(
    async (eventKey: string, list: EventDistanceDto[]) => {
      const entries = await Promise.all(
        list.map(async (d) => {
          const ok = await hasEventCourse(eventKey, d.id);
          return [d.id, ok] as const;
        })
      );
      setCourseReadyByDistance(Object.fromEntries(entries));
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    setDistancesLoading(true);
    (async () => {
      try {
        const ev = await getEventById(eventId);
        if (cancelled) return;
        const list = Array.isArray(ev.distances) ? ev.distances : [];
        setDistances(list);
        if (list.length === 0) {
          const blank = createEmptyCourse("Chưa có cự ly");
          applyCourseLocal(blank);
          setSelectedDistanceId(null);
          setCourseReadyByDistance({});
          return;
        }
        const firstId = list[0].id;
        setSelectedDistanceId(firstId);
        const course = await getEventCourse(
          eventId,
          firstId,
          list[0].name
        );
        if (cancelled) return;
        applyCourseLocal({ ...course, distanceId: firstId });
        await refreshReadyFlags(eventId, list);
      } catch {
        if (!cancelled) {
          setDistances([]);
          setSelectedDistanceId(null);
          applyCourseLocal(createEmptyCourse("Cự ly"));
        }
      } finally {
        if (!cancelled) {
          setDistancesLoading(false);
          setHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, applyCourseLocal, refreshReadyFlags]);

  useEffect(() => {
    if (!hydrated || !selectedDistanceId) return;
    void saveEventCourse(eventId, selectedDistanceId, {
      ...applied,
      distanceId: selectedDistanceId,
    }).then(() => {
      setCourseReadyByDistance((prev) => ({
        ...prev,
        [selectedDistanceId]:
          applied.polyline.length >= 2 && applied.distanceKm > 0,
      }));
    });
  }, [applied, hydrated, eventId, selectedDistanceId]);

  const selectDistance = useCallback(
    async (distanceId: string) => {
      if (distanceId === selectedDistanceIdRef.current) return;
      const meta = distances.find((d) => d.id === distanceId);
      setHydrated(false);
      setSelectedDistanceId(distanceId);
      try {
        const course = await getEventCourse(
          eventId,
          distanceId,
          meta?.name
        );
        applyCourseLocal({
          ...course,
          distanceId,
          title: course.title || meta?.name || "Cự ly",
        });
        await refreshReadyFlags(eventId, distances);
      } finally {
        setHydrated(true);
      }
    },
    [applyCourseLocal, distances, eventId, refreshReadyFlags]
  );

  const setTitle = useCallback((title: string) => {
    setDraft((d) => ({ ...d, title }));
  }, []);

  const runSnap = useCallback(
    async (waypoints: LatLng[], keepMidFraction = true, switchToReshape = true) => {
      setSnapping(true);
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

        const next: CourseConfig = {
          ...rebuildCourseFromSnap(
            draft.title,
            waypoints,
            result.polyline,
            dist,
            defs
          ),
          distanceId: draft.distanceId ?? selectedDistanceIdRef.current,
        };
        setDraft(next);
        setCpDraftsState(draftsFromCourse(next));
        setPendingStart(null);
        toastInfo(
          `Route gợi ý ~${dist}km · ${result.polyline.length} điểm bám đường — kéo START/FINISH để đổi chỗ`
        );
        if (switchToReshape) setTool("reshape");
      } catch (e) {
        toastError(e, "Không gợi ý được route");
      } finally {
        setSnapping(false);
      }
    },
    [cpDrafts, draft.distanceKm, draft.title, draft.distanceId]
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
    toastInfo("Click map chọn START (chỗ bất kỳ trên đường) → rồi click FINISH");
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
      if (tool === "view") return;

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
          toastInfo("Đã chọn START mới — click FINISH (chỗ bạn muốn kết thúc)");
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
          toastInfo("Đã chọn START — click FINISH trên map");
          return;
        }

        await runSnap([pendingStart, p], false);
        return;
      }

      if (tool === "reshape") {
        if (draft.waypoints.length < 2 || draft.polyline.length < 2) {
          toastError("Chọn Start → Finish trước (tool Start/End).");
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
        await runSnap(nextWps, true);
        return;
      }

      if (tool === "checkpoint" || tool === "aid") {
        const isAid = tool === "aid";
        const label = isAid ? "điểm tiếp tế" : "checkpoint";
        if (draft.polyline.length < 2 || draft.distanceKm <= 0) {
          toastError(`Cần có route trước khi đặt ${label}.`);
          return;
        }
        const snap = nearestPointOnPolyline(draft.polyline, p);
        if (!snap) return;
        if (snap.distKm > CP_MAX_OFF_ROUTE_KM) {
          toastError(
            `${isAid ? "Điểm tiếp tế" : "Checkpoint"} ngoài đường chạy (cách ~${Math.round(snap.distKm * 1000)}m > 45m). Hãy click sát đường cam trên bản đồ.`
          );
          return;
        }
        const km = Math.round(snap.kmAlong * 1000) / 1000;
        if (km < 0.05 || km > draft.distanceKm - 0.05) {
          toastError(
            "Start/Finish đã cố định ở hai đầu — đặt điểm ở giữa route."
          );
          return;
        }
        const tooClose = cpDrafts.some((d) => Math.abs(d.km - km) < 0.08);
        if (tooClose) {
          toastError("Đã có điểm gần vị trí này.");
          return;
        }

        const mid = [
          ...midDraftsOnly(cpDrafts, draft.distanceKm),
          {
            km,
            name: isAid ? `Tiếp tế ${km}km` : `CP ${km}km`,
            type: isAid ? ("aid" as const) : ("cp" as const),
          },
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
        toastSuccess(
          isAid
            ? `Đã đặt điểm tiếp tế @ ${km}km`
            : `Đã đặt CP @ ${km}km (snap trên route)`
        );
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
    toastInfo("Click Start trên map");
  }, []);

  const applyCourse = useCallback(() => {
    if (!selectedDistanceId) {
      toastError("Chọn cự ly trước khi áp dụng.");
      return;
    }
    if (draft.polyline.length < 2 || draft.checkpoints.length < 2) {
      toastError("Cần Start/Finish + route trước khi áp dụng.");
      return;
    }
    const next = {
      ...draft,
      distanceId: selectedDistanceId,
      updatedAt: new Date().toISOString(),
    };
    setApplied(next);
    setAppliedVersion((v) => v + 1);
    void saveEventCourse(eventId, selectedDistanceId, next)
      .then(() => {
        toastSuccess(
          "Thiết lập thành công — đã lưu lộ trình, checkpoint & điểm tiếp tế cự ly này."
        );
        setCourseReadyByDistance((prev) => ({
          ...prev,
          [selectedDistanceId]: true,
        }));
      })
      .catch((e) => {
        toastError(e, "Lưu bản đồ thất bại.");
      });
  }, [draft, eventId, selectedDistanceId]);

  const resetToDefault = useCallback(() => {
    const d = createDefaultCourse(selectedDistanceId);
    applyCourseLocal(d);
    toastSuccess("Đã load route demo Mỹ Khê 5K cho cự ly đang chọn");
  }, [applyCourseLocal, selectedDistanceId]);

  const startEndPhase: CourseContextValue["startEndPhase"] = pendingStart
    ? "need-end"
    : draft.waypoints.length >= 2 && draft.polyline.length >= 2
      ? "ready"
      : "need-start";

  const value: CourseContextValue = {
    eventId,
    distances,
    distancesLoading,
    selectedDistanceId,
    selectDistance,
    courseReadyByDistance,
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
    applyCourse,
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
