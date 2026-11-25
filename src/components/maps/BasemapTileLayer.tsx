"use client";

import { TileLayer } from "react-leaflet";

/**
 * Basemap không cần API key.
 * - tile.openstreetmap.org: hay DNS fail ở VN
 * - cartocdn voyager/light: 200 nhưng trả watermark "API KEY REQUIRED"
 * OSM France + Esri vẫn tải tile thật từ mạng hiện tại.
 */
export const BASEMAP_URL =
  "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png";

export const BASEMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://www.openstreetmap.fr/">OSM France</a>';

export function BasemapTileLayer() {
  return (
    <TileLayer
      attribution={BASEMAP_ATTRIBUTION}
      url={BASEMAP_URL}
      subdomains="abc"
      maxZoom={20}
    />
  );
}
