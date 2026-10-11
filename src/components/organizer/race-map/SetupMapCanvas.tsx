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
import { nearestPointOnPolyline } from "@/lib/race-map/geo";
import {
  MAP_COLORS,
  checkpointMapColor,
} from "@/lib/race-map/map-colors";

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

function ClickCapture({
  onClick,
  enabled,
}: {
  onClick: (p: LatLng) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
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

function pinIcon(label: string, color: string, cursor: string) {
  return L.divIcon({
    className: "setup-pin",
    html: `<div style="
      background:${color};color:#fff;font:700 10px/1.1 system-ui,sans-serif;
      padding:4px 8px;border-radius:6px;white-space:nowrap;
      border:1px solid rgba(255,255,255,.85);box-shadow:0 1px 3px rgba(0,0,0,.25);cursor:${cursor}">${label}</div>`,
    iconSize: [72, 22],
    iconAnchor: [36, 11],
  });
}

function formatKmFromStart(km: number): string {
  const v = Math.round(km * 1000) / 1000;
  if (v < 0.01) return "0 km từ xuất phát";
  return `${v} km từ xuất phát`;
}

function checkpointKindLabel(type: Checkpoint["type"]): string {
  switch (type) {
    case "aid":
      return "Điểm tiếp tế";
    case "cp":
      return "Checkpoint (timing)";
    case "start":
      return "Xuất phát";
    case "finish":
      return "Vạch đích";
    default:
      return "Điểm trên route";
  }
}

function waypointKmFromStart(
  polyline: LatLng[],
  point: LatLng,
  index: number,
  total: number
): number {
  if (index === 0) return 0;
  if (index === total - 1 && total > 1) {
    const len = nearestPointOnPolyline(polyline, point);
    return len?.kmAlong ?? 0;
  }
  const snap = nearestPointOnPolyline(polyline, point);
  return snap?.kmAlong ?? 0;
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

  const isView = tool === "view";
  const placingStartFinish = tool === "start-end";
  const placingMid = tool === "checkpoint" || tool === "aid";
  const canDragPins =
    !isView &&
    (tool === "reshape" || (tool === "start-end" && polyline.length >= 2));
  const showCheckpoints = tool !== "start-end";
  const markersInteractive = isView || placingMid || canDragPins;

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
      style={{ cursor: isView ? "default" : "crosshair" }}
      scrollWheelZoom
      zoomControl={false}
    >
      {/* Zoom xuống dưới — tránh bị che bởi toolbar phía trên */}
      <ZoomControl position="bottomleft" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onClick={onMapClick} enabled={!isView} />
      <FlyToPlace target={focusTarget} />
      {/* Search đang active → không kéo map về route cũ (vd. Đà Nẵng) */}
      {fitPts.length >= 2 && !focusTarget && (
        <FitBounds points={fitPts} token={fitToken} />
      )}

      {polyline.length >= 2 && (
        <Polyline
          positions={polyline.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: MAP_COLORS.route,
            weight: placingMid ? 8 : 5,
            opacity: 0.88,
            interactive: placingMid,
          }}
        />
      )}

      {waypoints.map((p, i) => {
        const isStart = i === 0;
        const isEnd = i === waypoints.length - 1 && waypoints.length > 1;
        const label = isStart ? "START" : isEnd ? "FINISH" : `VIA ${i}`;
        const color = isStart
          ? MAP_COLORS.start
          : isEnd
            ? MAP_COLORS.finish
            : MAP_COLORS.via;
        const kmFromStart = waypointKmFromStart(
          polyline,
          p,
          i,
          waypoints.length
        );
        const roleLabel = isStart
          ? "Điểm xuất phát (Start)"
          : isEnd
            ? "Vạch đích (Finish)"
            : `Điểm qua route (Via ${i})`;
        const cursor = isView ? "pointer" : canDragPins ? "grab" : "default";

        return (
          <Marker
            key={`wp-${i}-${label}`}
            position={[p.lat, p.lng]}
            icon={pinIcon(label, color, cursor)}
            draggable={canDragPins}
            opacity={placingStartFinish && !canDragPins ? 0.85 : 1}
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onMoveWaypoint(i, { lat: ll.lat, lng: ll.lng });
              },
            }}
          >
            {isView ? (
              <Popup>
                <div style={{ minWidth: 160, font: "600 12px/1.4 system-ui,sans-serif" }}>
                  <strong>{roleLabel}</strong>
                  <br />
                  <span style={{ color: "#78716c", fontWeight: 500 }}>
                    {formatKmFromStart(kmFromStart)}
                  </span>
                </div>
              </Popup>
            ) : null}
            {canDragPins ? (
              <Popup>
                {label}
                <br />
                Kéo thả để đổi vị trí → route snap lại
                {!isStart && !isEnd ? (
                  <>
                    <br />
                    <button type="button" onClick={() => onRemoveVia(i)}>
                      Xóa via
                    </button>
                  </>
                ) : null}
              </Popup>
            ) : null}
          </Marker>
        );
      })}

      {showCheckpoints &&
        checkpoints.map((cp) => {
          const color = checkpointMapColor(cp.type);
          const kindLabel = checkpointKindLabel(cp.type);
          return (
            <CircleMarker
              key={cp.id}
              center={[cp.lat, cp.lng]}
              radius={cp.type === "finish" || cp.type === "start" ? 11 : 9}
              pathOptions={{
                color: "#fff7ed",
                fillColor: color,
                fillOpacity: 0.95,
                weight: 2,
                interactive: markersInteractive,
              }}
            >
              <Popup>
                <div style={{ minWidth: 160, font: "600 12px/1.4 system-ui,sans-serif" }}>
                  <strong>{cp.name}</strong>
                  <br />
                  <span style={{ color: "#78716c", fontWeight: 500 }}>
                    {kindLabel}
                    <br />
                    {formatKmFromStart(cp.km)}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
}
