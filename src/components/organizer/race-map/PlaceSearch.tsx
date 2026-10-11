"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPinned, Search, X } from "lucide-react";
import type { LatLng } from "@/api/race-map.mock-data";

export interface PlaceHit {
  lat: number;
  lng: number;
  label: string;
  type: string;
  bbox: { south: number; north: number; west: number; east: number } | null;
}

export default function PlaceSearch({
  onSelect,
}: {
  onSelect: (place: PlaceHit) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<PlaceHit[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setHits([]);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(term.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setHits(data.results ?? []);
      setOpen(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không tìm được");
      setHits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(() => void search(q), 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, search]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (h: PlaceHit) => {
    onSelect(h);
    setQ(h.label.split(",").slice(0, 3).join(","));
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative max-w-md min-w-[200px] flex-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search(q);
            }
          }}
          placeholder="Tìm địa điểm…"
          className="w-full rounded-xl border border-border bg-white py-2 pl-9 pr-9 text-xs outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-orange-500" />
        ) : null}
        {q && !loading ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setHits([]);
              setErr(null);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open && (hits.length > 0 || err) ? (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg">
          {err ? (
            <li className="px-3 py-2 text-[11px] text-red-600">{err}</li>
          ) : null}
          {hits.map((h, i) => (
            <li key={`${h.lat}-${h.lng}-${i}`}>
              <button
                type="button"
                onClick={() => pick(h)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-[11px] text-foreground hover:bg-muted"
              >
                <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                <span className="block font-semibold leading-snug">{h.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Helper: convert PlaceHit → center LatLng for map */
export function placeCenter(p: PlaceHit): LatLng {
  return { lat: p.lat, lng: p.lng };
}
