"use client";
import { MapContainer, CircleMarker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { positionAtCourseKm } from "@/lib/race-map/geo";
import { checkpointMapColor } from "@/lib/race-map/map-colors";
import type { StaffCheckpointSnapshot } from "@/api/staff-simulation";
import { BasemapTileLayer } from "@/components/maps/BasemapTileLayer";

export default function StaffCheckpointMap({ snapshot }: { snapshot: StaffCheckpointSnapshot }) {
  const cp = snapshot.checkpoint;
  const nearby = snapshot.athletes.filter(a => a.motion === "Racing")
    .sort((a, b) => Math.abs(a.courseKm - cp.km) - Math.abs(b.courseKm - cp.km)).slice(0, 30);
  return <MapContainer center={[cp.lat, cp.lng]} zoom={14} className="h-full w-full" scrollWheelZoom>
    <BasemapTileLayer />
    <Polyline positions={snapshot.polyline.map(p => [p.lat, p.lng])} pathOptions={{ color: "#f97316", weight: 4 }} />
    <CircleMarker center={[cp.lat, cp.lng]} radius={12} pathOptions={{ color: checkpointMapColor(cp.type), fillOpacity: 0.9 }}>
      <Popup><strong>{cp.name}</strong><br />Checkpoint của bạn · km {cp.km}</Popup>
    </CircleMarker>
    {nearby.map(a => {
      const point = positionAtCourseKm(snapshot.polyline, a.courseKm);
      const passed = a.passedAtSeconds != null;
      return <CircleMarker key={a.registrationId} center={[point.lat, point.lng]} radius={5} pathOptions={{ color: passed ? "#16a34a" : "#2563eb", fillOpacity: 0.9 }}>
        <Popup>BIB {a.bib} · {a.fullName}<br />{passed ? `Đã qua mốc · hiện ở km ${a.courseKm.toFixed(2)}` : `Còn ${a.remainingKm.toFixed(2)} km tới mốc`}</Popup>
      </CircleMarker>;
    })}
  </MapContainer>;
}
