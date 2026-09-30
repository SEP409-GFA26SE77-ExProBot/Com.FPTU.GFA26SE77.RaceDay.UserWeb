"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Pause, Play } from "lucide-react";
import {
  type RaceEvent,
  formatPrice,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from "@/data/mock-events";
import { PAGE_SHELL } from "@/lib/page-shell";

interface FeaturedEventsCarouselProps {
  events: RaceEvent[];
}

function DistanceChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-zinc-950 text-white px-2 py-0.5 text-[11px] font-extrabold tracking-wide shadow-md ring-2 ring-white/90">
      {label}
    </span>
  );
}

export default function FeaturedEventsCarousel({ events }: FeaturedEventsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || events.length < 2) return;
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    let last = performance.now();
    const speed = 0.45;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      el.scrollLeft += speed * dt;
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) el.scrollLeft -= half;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, reducedMotion, events.length]);

  const loop = [...events, ...events];

  return (
    <div className={`${PAGE_SHELL} relative`}>
      <div className="absolute right-4 sm:right-6 lg:right-8 top-0 z-10 -translate-y-[calc(100%+0.5rem)]">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-orange-500/40 transition-colors shadow-sm"
          aria-label={paused ? "Phát carousel" : "Tạm dừng carousel"}
        >
          {paused || reducedMotion ? (
            <Play className="h-3 w-3 text-orange-500" />
          ) : (
            <Pause className="h-3 w-3 text-orange-500" />
          )}
          {paused || reducedMotion ? "Phát" : "Tạm dừng"}
        </button>
      </div>

      <div
        ref={trackRef}
        className="featured-carousel flex gap-4 overflow-x-auto pb-1 scroll-smooth"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
        }}
      >
        {loop.map((event, idx) => {
          const lowestPrice = Math.min(...event.distances.map((d) => d.price));
          const progressPercent = Math.round(
            (event.registeredCount / event.maxParticipants) * 100
          );
          const slotsLeft = event.maxParticipants - event.registeredCount;

          return (
            <Link
              key={`${event.id}-${idx}`}
              href={`/events/${event.id}`}
              className="group relative w-[280px] sm:w-[320px] lg:w-[340px] shrink-0 rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5 hover:border-orange-500/35"
            >
              <div className="relative h-44 overflow-hidden">
                {event.bannerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: event.bannerGradient }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/30" />

                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${getStatusColor(event.status)}`}
                  >
                    {getStatusLabel(event.status)}
                  </span>
                  {event.status === "registration-open" && slotsLeft > 0 && (
                    <span className="inline-flex items-center rounded-md bg-zinc-950 text-white border border-white/30 px-2 py-0.5 text-[10px] font-bold">
                      Còn {slotsLeft.toLocaleString("vi-VN")} chỗ
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap gap-1.5">
                  {event.distances.slice(0, 4).map((d) => (
                    <DistanceChip key={d.id} label={`${d.km}K`} />
                  ))}
                  {event.distances.length > 4 && (
                    <DistanceChip label={`+${event.distances.length - 4}`} />
                  )}
                </div>
              </div>

              <div className="p-3.5 space-y-2">
                <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 text-orange-500 shrink-0" />
                  <span className="truncate">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 text-orange-500 shrink-0" />
                  <span className="truncate">{event.city}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-0.5">
                  <span className="text-muted-foreground">{progressPercent}% đầy</span>
                  <span className="font-bold text-orange-600">
                    từ {formatPrice(lowestPrice)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
