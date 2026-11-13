"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BasemapTileLayer } from "@/components/maps/BasemapTileLayer";
import type {
  EventStaffMemberDto,
  EventStaffRole,
  StaffMapPointType,
  StaffRouteDto,
  StaffStationDto,
} from "@/dto/event-staff.dto";
import { memberStationIds } from "@/dto/event-staff.dto";
import { mapStationsWithCoords } from "@/lib/event-staff-stations";
import { MAP_COLORS } from "@/lib/race-map/map-colors";

const KIND_FILTERS: {
  id: "all" | StaffMapPointType;
  label: string;
  raceStaffOnly?: boolean;
}[] = [
  { id: "all", label: "Tất cả" },
  { id: "start", label: "Xuất phát" },
  { id: "cp", label: "Checkpoint" },
  { id: "aid", label: "Tiếp tế", raceStaffOnly: true },
  { id: "finish", label: "Đích" },
];

function FitBounds({
  points,
  token,
}: {
  points: { lat: number; lng: number }[];
  token: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    try {
      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 14);
        return;
      }
      const b = L.latLngBounds(
        points.map((p) => [p.lat, p.lng] as [number, number])
      );
      map.fitBounds(b, { padding: [36, 36], maxZoom: 15 });
    } catch {
      /* remount */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, token]);
  return null;
}

function mapTypeLabel(t?: StaffMapPointType | null) {
  switch (t) {
    case "start":
      return "Xuất phát";
    case "finish":
      return "Đích";
    case "cp":
      return "Checkpoint";
    case "aid":
      return "Tiếp tế";
    default:
      return "Điểm map";
  }
}

export default function StaffAssignmentMap({
  role,
  stations,
  routes = [],
  members,
  selectedStationId,
  onSelectStation,
}: {
  role: EventStaffRole;
  stations: StaffStationDto[];
  routes?: StaffRouteDto[];
  members: EventStaffMemberDto[];
  selectedStationId: string | null;
  onSelectStation: (stationId: string | null) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [distanceId, setDistanceId] = useState<string>("");
  const [kind, setKind] = useState<"all" | StaffMapPointType>("all");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const mapStations = useMemo(() => mapStationsWithCoords(stations), [stations]);

  const distances = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of mapStations) {
      if (s.distanceId) {
        map.set(s.distanceId, s.distanceName || "Cự ly");
      }
    }
    for (const r of routes) {
      if (r.distanceId && !map.has(r.distanceId)) {
        map.set(r.distanceId, r.distanceName || "Cự ly");
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [mapStations, routes]);

  useEffect(() => {
    setKind("all");
    onSelectStation(null);
    setDistanceId((prev) => {
      if (prev && distances.some((d) => d.id === prev)) return prev;
      return distances[0]?.id ?? "";
    });
  }, [role, onSelectStation, distances]);

  const assignedIds = useMemo(() => {
    const set = new Set<string>();
    for (const m of members) {
      for (const id of memberStationIds(m)) set.add(id);
    }
    return set;
  }, [members]);

  const filtered = useMemo(() => {
    if (!distanceId) return [];
    return mapStations.filter((s) => {
      if (s.distanceId !== distanceId) return false;
      if (kind !== "all" && s.mapType !== kind) return false;
      return true;
    });
  }, [mapStations, distanceId, kind]);

  const visibleRoutes = useMemo(() => {
    if (!distanceId) return [];
    return routes.filter((r) => r.distanceId === distanceId);
  }, [routes, distanceId]);

  const selected = filtered.find((s) => s.id === selectedStationId) ?? null;
  const assignees = useMemo(() => {
    if (!selectedStationId) return [];
    return members.filter((m) =>
      memberStationIds(m).includes(selectedStationId)
    );
  }, [members, selectedStationId]);

  const fitPoints = useMemo(() => {
    const pts: { lat: number; lng: number }[] = filtered.map((s) => ({
      lat: s.lat!,
      lng: s.lng!,
    }));
    for (const r of visibleRoutes) {
      for (const p of r.polyline) pts.push(p);
    }
    return pts;
  }, [filtered, visibleRoutes]);

  const fitToken = useMemo(() => {
    if (fitPoints.length === 0) return "empty";
    const first = fitPoints[0];
    const routeLen = visibleRoutes.reduce((n, r) => n + r.polyline.length, 0);
    return `${filtered.length}-${routeLen}-${first.lat}-${first.lng}-${distanceId}-${kind}`;
  }, [fitPoints, filtered.length, visibleRoutes, distanceId, kind]);

  const kindFilters = KIND_FILTERS.filter(
    (f) => !f.raceStaffOnly || role === "race-staff"
  );

  const assignedCount = filtered.filter((s) => assignedIds.has(s.id)).length;
  const unassignedCount = filtered.length - assignedCount;

  if (!mounted) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-sm text-muted-foreground">
        Đang tải bản đồ…
      </div>
    );
  }

  if (mapStations.length === 0 && routes.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 px-4 text-center text-sm text-amber-900">
        <p className="font-semibold">Chưa có điểm map có tọa độ</p>
        <p className="text-xs">
          Vào <span className="font-semibold">Thiết lập bản đồ</span> thêm{" "}
          {role === "race-staff"
            ? "checkpoint / tiếp tế / xuất phát / đích"
            : "checkpoint / xuất phát / đích"}
          .
        </p>
      </div>
    );
  }

  const centerLat = fitPoints[0]?.lat ?? 16.05;
  const centerLng = fitPoints[0]?.lng ?? 108.24;

  return (
    <div className="flex h-full min-h-[320px] flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          value={distanceId}
          onChange={(e) => {
            setDistanceId(e.target.value);
            onSelectStation(null);
          }}
          disabled={distances.length === 0}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-[11px] font-semibold disabled:opacity-50"
        >
          {distances.length === 0 ? (
            <option value="">Chưa có cự ly</option>
          ) : (
            distances.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))
          )}
        </select>
        {kindFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setKind(f.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              kind === f.id
                ? "bg-orange-500/15 text-orange-700"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Đã phân bổ ({assignedCount})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          Chưa phân bổ ({unassignedCount})
        </span>
      </div>

      <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-2xl border border-border/60">
        <MapContainer
          key={fitToken}
          center={[centerLat, centerLng]}
          zoom={13}
          className="h-full min-h-[280px] w-full z-0"
          scrollWheelZoom
        >
          <BasemapTileLayer />
          <FitBounds points={fitPoints} token={fitToken} />
          {visibleRoutes.map((r) => (
            <Polyline
              key={r.distanceId}
              positions={r.polyline.map(
                (p) => [p.lat, p.lng] as [number, number]
              )}
              pathOptions={{
                color: MAP_COLORS.route,
                weight: 5,
                opacity: 0.88,
              }}
            />
          ))}
          {filtered.map((s) => {
            const assigned = assignedIds.has(s.id);
            const active = selectedStationId === s.id;
            const fill = assigned ? "#10b981" : "#ef4444";
            return (
              <CircleMarker
                key={s.id}
                center={[s.lat!, s.lng!]}
                radius={active ? 11 : 8}
                eventHandlers={{
                  click: () =>
                    onSelectStation(selectedStationId === s.id ? null : s.id),
                }}
                pathOptions={{
                  color: active ? "#ea580c" : "#fff7ed",
                  fillColor: fill,
                  fillOpacity: 0.95,
                  weight: active ? 3 : 2,
                }}
              >
                <Popup>
                  <strong>{s.label}</strong>
                  <br />
                  {mapTypeLabel(s.mapType)}
                  {assigned ? " · đã phân bổ" : " · chưa phân bổ"}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {selected ? (
        <div className="rounded-xl border border-border bg-card p-3 text-xs shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {mapTypeLabel(selected.mapType)}
                {selected.distanceName ? ` · ${selected.distanceName}` : ""}
              </p>
              <p className="mt-0.5 truncate font-bold text-foreground">
                {selected.label}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                assignedIds.has(selected.id)
                  ? "bg-emerald-500/15 text-emerald-800"
                  : "bg-red-500/15 text-red-800"
              }`}
            >
              {assignedIds.has(selected.id) ? "Đã gán" : "Chưa gán"}
            </span>
          </div>
          {assignees.length === 0 ? (
            <p className="mt-2 text-muted-foreground">
              Chưa có {role === "photographer" ? "photographer" : "nhân viên"}{" "}
              được gán điểm này.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {assignees.map((m) => (
                <li key={m.id} className="font-medium text-foreground">
                  {m.fullName}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {m.email}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
