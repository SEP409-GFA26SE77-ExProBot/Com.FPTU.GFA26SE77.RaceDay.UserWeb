import { NextRequest, NextResponse } from "next/server";

/** Proxy Nominatim — search địa điểm VN (setup map organizer) */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const params = new URLSearchParams({
    format: "json",
    q,
    countrycodes: "vn",
    addressdetails: "1",
    limit: "8",
  });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "RaceDay-UserFE/1.0 (organizer setup-map)",
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `Nominatim HTTP ${res.status}`, results: [] },
        { status: 502 }
      );
    }
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      type?: string;
      class?: string;
      boundingbox?: string[];
    }>;

    const results = data.map((r) => ({
      lat: Number(r.lat),
      lng: Number(r.lon),
      label: r.display_name,
      type: r.type ?? r.class ?? "place",
      bbox: r.boundingbox
        ? {
            south: Number(r.boundingbox[0]),
            north: Number(r.boundingbox[1]),
            west: Number(r.boundingbox[2]),
            east: Number(r.boundingbox[3]),
          }
        : null,
    }));

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Geocode failed",
        results: [],
      },
      { status: 500 }
    );
  }
}
