"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, TrendingUp } from "lucide-react";
import {
  type RaceEvent,
  formatPrice,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from "@/data/mock-events";

interface EventCardProps {
  event: RaceEvent;
}

/** High-contrast distance chips on busy photos */
function DistanceChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-zinc-950 text-white px-2 py-0.5 text-[11px] font-extrabold tracking-wide shadow-md ring-2 ring-white/90">
      {label}
    </span>
  );
}

export default function EventCard({ event }: EventCardProps) {
  const lowestPrice = Math.min(...event.distances.map((d) => d.price));
  const progressPercent = Math.round(
    (event.registeredCount / event.maxParticipants) * 100
  );
  const slotsLeft = event.maxParticipants - event.registeredCount;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5 hover:border-orange-500/35"
    >
      <div className="relative h-48 overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/30" />

        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold ${getStatusColor(
              event.status
            )}`}
          >
            {getStatusLabel(event.status)}
          </span>
          {event.status === "registration-open" && slotsLeft > 0 && (
            <span className="inline-flex items-center rounded-md bg-zinc-950 text-white border border-white/30 px-2.5 py-1 text-[11px] font-bold shadow-md">
              Còn {slotsLeft.toLocaleString("vi-VN")} chỗ
            </span>
          )}
          {event.status === "sold-out" && (
            <span className="inline-flex items-center rounded-md bg-amber-400 text-zinc-950 border border-amber-500 px-2.5 py-1 text-[11px] font-extrabold shadow-md">
              0 chỗ trống
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          {event.distances.map((d) => (
            <DistanceChip key={d.id} label={`${d.km}K`} />
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {event.registeredCount.toLocaleString("vi-VN")} /{" "}
                {event.maxParticipants.toLocaleString("vi-VN")}
              </span>
            </div>
            <span className="font-semibold text-foreground/80">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                background:
                  progressPercent >= 90
                    ? "linear-gradient(90deg, #ef4444, #dc2626)"
                    : "linear-gradient(90deg, #f97316, #ea580c)",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1 shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">
              từ {formatPrice(lowestPrice)}
            </span>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {event.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-orange-500/25 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
