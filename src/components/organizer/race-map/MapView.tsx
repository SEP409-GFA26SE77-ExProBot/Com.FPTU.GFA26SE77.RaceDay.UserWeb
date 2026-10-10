"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEMO_EVENT, type Checkpoint, type LatLng } from "@/api/race-map.mock-data";
import { positionAtCourseKm } from "@/lib/race-map/geo";
import type { RunnerLive } from "@/lib/race-map/timing";

function FitBounds({ points, token }: { points: LatLng[]; token: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    try {
      const b = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(b, { padding: [48, 48], maxZoom: 15 });
    } catch {
      /* remount */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, token]);
  return null;
}

function runnerIcon(bib: number, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${active ? "#2563eb" : "#64748b"};
      color:#fff;font:700 10px/1 system-ui;
      padding:4px 6px;border-radius:8px;
      border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);
      white-space:nowrap">#${bib}</div>`,
    iconSize: [48, 22],
    iconAnchor: [24, 11],
  });
}

/** Chỉ vẽ sample — không render cả field nghìn người */
export function pickMapRunners(live: RunnerLive[], focusBib?: number): RunnerLive[] {
  const limit = DEMO_EVENT.mapMarkerLimit;
  const focus = live.find((r) => r.bib === focusBib);
  const movers = live
    .filter((r) => r.status === "running" || r.status === "finished" || r.status === "flagged")
    .slice()
    .sort((a, b) => b.courseKm - a.courseKm);

  const picked: RunnerLive[] = [];
  const seen = new Set<number>();
  if (focus) {
    picked.push(focus);
    seen.add(focus.bib);
  }
  for (const r of movers) {
    if (picked.length >= limit) break;
    if (seen.has(r.bib)) continue;
    picked.push(r);
    seen.add(r.bib);
  }
  return picked;
}

export default function MapView({
  live,
  focusBib,
  polyline,
  checkpoints,
  distanceKm,
}: {
  live: RunnerLive[];
  focusBib?: number;
  polyline: LatLng[];
  checkpoints: Checkpoint[];
  distanceKm: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const markers = useMemo(() => pickMapRunners(live, focusBib), [live, focusBib]);
  const center = polyline[Math.floor(polyline.length / 2)] ?? { lat: 16.05, lng: 108.24 };
  const fitToken =
    polyline.length >= 2
      ? `${polyline.length}-${polyline[0].lat.toFixed(5)}-${polyline[polyline.length - 1].lng.toFixed(5)}-${distanceKm}`
      : `empty-${distanceKm}`;

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-800 text-sm text-slate-400">
        Đang tải bản đồ…
      </div>
    );
  }

  if (polyline.length < 2) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-800 text-sm text-slate-400">
        Chưa có route — vào Organizer setup map để vẽ rồi Apply.
      </div>
    );
  }

  return (
    <MapContainer
      key={fitToken}
      center={[center.lat, center.lng]}
      zoom={14}
      className="h-full w-full rounded-xl z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={polyline} token={fitToken} />
      <Polyline
        positions={polyline.map((p) => [p.lat, p.lng] as [number, number])}
        pathOptions={{ color: "#38bdf8", weight: 5, opacity: 0.9 }}
      />
      {checkpoints.map((cp) => (
        <CircleMarker
          key={cp.id}
          center={[cp.lat, cp.lng]}
          radius={cp.type === "finish" || cp.type === "start" ? 10 : 8}
          pathOptions={{
            color: cp.type === "finish" ? "#ef4444" : "#22c55e",
            fillColor: cp.type === "finish" ? "#ef4444" : "#22c55e",
            fillOpacity: 0.85,
          }}
        >
          <Popup>
            <strong>{cp.name}</strong>
            <br />
            {cp.km} km
            {cp.cutoff ? ` · cutoff ${cp.cutoff}` : ""}
          </Popup>
        </CircleMarker>
      ))}
      {markers.map((r) => {
        const pos = positionAtCourseKm(polyline, r.courseKm, distanceKm);
        return (
          <Marker
            key={r.bib}
            position={[pos.lat, pos.lng]}
            icon={runnerIcon(r.bib, r.bib === focusBib)}
          >
            <Popup>
              BIB {r.bib} · {r.name}
              <br />
              {r.courseKm.toFixed(2)} / {distanceKm} km · {r.chipId}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
