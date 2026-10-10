"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Checkpoint, LatLng } from "@/api/race-map.mock-data";
import type { SetupTool } from "@/components/organizer/race-map/CourseContext";

function FitBounds({ points, token }: { points: LatLng[]; token: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    try {
      const b = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(b, { padding: [56, 56], maxZoom: 15 });
    } catch {
      /* ignore during remount */
    }
    // chỉ theo token — tránh loop khi points đổi reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, token]);
  return null;
}

function ClickCapture({ onClick }: { onClick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export type MapFocusTarget = {
  token: string;
  lat: number;
  lng: number;
  zoom?: number;
  bbox?: { south: number; north: number; west: number; east: number } | null;
};

function FlyToPlace({ target }: { target: MapFocusTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    try {
      if (target.bbox) {
        map.fitBounds(
          [
            [target.bbox.south, target.bbox.west],
            [target.bbox.north, target.bbox.east],
          ],
          { padding: [48, 48], maxZoom: 16 }
        );
      } else {
        map.flyTo([target.lat, target.lng], target.zoom ?? 15, { duration: 1.1 });
      }
    } catch {
      /* remount */
    }
  }, [map, target?.token]);
  return null;
}


function pinIcon(label: string, color: string) {
  return L.divIcon({
    className: "setup-pin",
    html: `<div style="
      background:${color};color:#fff;font:700 10px/1.1 system-ui,sans-serif;
      padding:4px 8px;border-radius:6px;white-space:nowrap;
      border:1px solid rgba(255,255,255,.85);box-shadow:0 1px 3px rgba(0,0,0,.25);cursor:grab">${label}</div>`,
    iconSize: [72, 22],
    iconAnchor: [36, 11],
  });
}

export default function SetupMapCanvas({
  tool,
  waypoints,
  polyline,
  checkpoints,
  focusTarget,
  onMapClick,
  onMoveWaypoint,
  onRemoveVia,
}: {
  tool: SetupTool;
  waypoints: LatLng[];
  polyline: LatLng[];
  checkpoints: Checkpoint[];
  focusTarget: MapFocusTarget | null;
  onMapClick: (p: LatLng) => void;
  onMoveWaypoint: (index: number, p: LatLng) => void;
  onRemoveVia: (index: number) => void;
}) {
  /** Tránh lỗi Leaflet "Map container is already initialized" (Strict Mode / HMR) */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const center = polyline[0] ?? waypoints[0] ?? { lat: 16.054, lng: 108.245 };
  const fitPts = useMemo(
    () => (polyline.length >= 2 ? polyline : waypoints.length >= 2 ? waypoints : []),
    [polyline, waypoints]
  );
  const fitToken =
    polyline.length >= 2
      ? `poly-${polyline.length}-${polyline[0].lat.toFixed(5)}-${polyline[polyline.length - 1].lng.toFixed(5)}`
      : `wp-${waypoints.length}`;

  const placingStartFinish = tool === "start-end";
  const canDragPins = tool === "reshape" || (tool === "start-end" && polyline.length >= 2);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Đang mở bản đồ…
      </div>
    );
  }

  return (
    <MapContainer
      key="organizer-setup-map"
      center={[center.lat, center.lng]}
      zoom={14}
      className="h-full w-full z-0"
      style={{ cursor: "crosshair" }}
      scrollWheelZoom
      zoomControl={false}
    >
      {/* Zoom xuống dưới — tránh bị che bởi toolbar phía trên */}
      <ZoomControl position="bottomleft" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onClick={onMapClick} />
      <FlyToPlace target={focusTarget} />
      {/* Search đang active → không kéo map về route cũ (vd. Đà Nẵng) */}
      {fitPts.length >= 2 && !focusTarget && (
        <FitBounds points={fitPts} token={fitToken} />
      )}


      {polyline.length >= 2 && (
        <Polyline
          positions={polyline.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: "#38bdf8",
            weight: tool === "checkpoint" ? 8 : 5,
            opacity: 0.95,
            interactive: tool === "checkpoint",
          }}
        />
      )}

      {waypoints.map((p, i) => {
        const isStart = i === 0;
        const isEnd = i === waypoints.length - 1 && waypoints.length > 1;
        const label = isStart ? "START" : isEnd ? "FINISH" : `VIA ${i}`;
        const color = isStart ? "#059669" : isEnd ? "#dc2626" : "#ea580c";
        return (
          <Marker
            key={`wp-${i}-${label}`}
            position={[p.lat, p.lng]}
            icon={pinIcon(label, color)}
            draggable={canDragPins}
            opacity={placingStartFinish && !canDragPins ? 0.85 : 1}
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onMoveWaypoint(i, { lat: ll.lat, lng: ll.lng });
              },
            }}
          >
            {canDragPins && (
              <Popup>
                {label}
                <br />
                Kéo thả để đổi vị trí → route snap lại
                {!isStart && !isEnd && (
                  <>
                    <br />
                    <button type="button" onClick={() => onRemoveVia(i)}>
                      Xóa via
                    </button>
                  </>
                )}
              </Popup>
            )}
          </Marker>
        );
      })}

      {tool !== "start-end" &&
        checkpoints.map((cp) => (
          <CircleMarker
            key={cp.id}
            center={[cp.lat, cp.lng]}
            radius={cp.type === "finish" || cp.type === "start" ? 11 : 9}
            pathOptions={{
              color: cp.type === "finish" ? "#ef4444" : cp.type === "start" ? "#22c55e" : "#a3e635",
              fillColor:
                cp.type === "finish" ? "#ef4444" : cp.type === "start" ? "#22c55e" : "#a3e635",
              fillOpacity: 0.92,
              weight: 2,
              interactive: tool === "checkpoint",
            }}
          >
            <Popup>
              <strong>{cp.name}</strong>
              <br />
              {cp.km} km · trên route
            </Popup>
          </CircleMarker>
        ))}
    </MapContainer>
  );
}
