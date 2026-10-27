"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CourseConfigDto, LatLngDto } from "@/dto/race-map.dto";
import { MAP_COLORS, checkpointMapColor } from "@/lib/race-map/map-colors";

function FitBounds({ points, token }: { points: LatLngDto[]; token: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    try {
      const b = L.latLngBounds(
        points.map((p) => [p.lat, p.lng] as [number, number])
      );
      map.fitBounds(b, { padding: [40, 40], maxZoom: 15 });
    } catch {
      /* remount */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, token]);
  return null;
}

/** Leaflet read-only — polyline + CP, không live runners. */
export default function PublicCourseMapCanvas({
  course,
}: {
  course: CourseConfigDto;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const polyline = course.polyline || [];
  const center =
    polyline[Math.floor(polyline.length / 2)] ?? { lat: 16.05, lng: 108.24 };
  const fitToken =
    polyline.length >= 2
      ? `${polyline.length}-${polyline[0].lat.toFixed(5)}-${polyline[polyline.length - 1].lng.toFixed(5)}-${course.distanceKm}`
      : `empty-${course.distanceKm}`;

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Đang tải bản đồ…
      </div>
    );
  }

  if (polyline.length < 2) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Chưa có đường chạy cho cự ly này.
      </div>
    );
  }

  return (
    <MapContainer
      key={fitToken}
      center={[center.lat, center.lng]}
      zoom={14}
      className="h-full w-full z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={polyline} token={fitToken} />
      <Polyline
        positions={polyline.map((p) => [p.lat, p.lng] as [number, number])}
        pathOptions={{ color: MAP_COLORS.route, weight: 5, opacity: 0.88 }}
      />
      {(course.checkpoints || []).map((cp) => {
        const color = checkpointMapColor(cp.type);
        return (
          <CircleMarker
            key={cp.id}
            center={[cp.lat, cp.lng]}
            radius={cp.type === "finish" || cp.type === "start" ? 10 : 8}
            pathOptions={{
              color: "#fff7ed",
              fillColor: color,
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{cp.name}</strong>
              <br />
              {cp.km} km
              {cp.type === "aid"
                ? " · điểm tiếp tế"
                : cp.type === "cp"
                  ? " · checkpoint"
                  : cp.type === "start"
                    ? " · xuất phát"
                    : cp.type === "finish"
                      ? " · đích"
                      : ""}
              {cp.cutoff ? ` · cutoff ${cp.cutoff}` : ""}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
