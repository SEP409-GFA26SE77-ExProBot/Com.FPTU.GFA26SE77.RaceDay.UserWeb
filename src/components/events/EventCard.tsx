"use client";

import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  TrendingUp,
} from "lucide-react";
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

export default function EventCard({ event }: EventCardProps) {
  const lowestPrice = Math.min(...event.distances.map((d) => d.price));
  const progressPercent = Math.round(
    (event.registeredCount / event.maxParticipants) * 100
  );

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/8 hover:-translate-y-1 hover:border-orange-500/30"
    >
      {/* Banner */}
      <div className="relative h-48 overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
          style={{ background: event.bannerGradient }}
        />
        <div className="absolute inset-0 bg-black/20" />

        {/* Emoji overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl opacity-40 transition-all duration-500 group-hover:scale-125 group-hover:opacity-60 select-none">
            {event.bannerEmoji}
          </span>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-md ${getStatusColor(
              event.status
            )}`}
          >
            {getStatusLabel(event.status)}
          </span>
        </div>

        {/* Distance badges */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          {event.distances.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center rounded-md bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-gray-800 shadow-sm"
            >
              {d.km}K
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors duration-200">
          {event.title}
        </h3>

        {/* Date & Location */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Registration progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {event.registeredCount.toLocaleString()} /{" "}
                {event.maxParticipants.toLocaleString()}
              </span>
            </div>
            <span className="font-semibold text-foreground/80">
              {progressPercent}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercent}%`,
                background:
                  progressPercent >= 90
                    ? "linear-gradient(90deg, #ef4444, #dc2626)"
                    : progressPercent >= 60
                    ? "linear-gradient(90deg, #f97316, #ea580c)"
                    : "linear-gradient(90deg, #22c55e, #16a34a)",
              }}
            />
          </div>
        </div>

        {/* Price & Tags */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">
              {formatPrice(lowestPrice)}
            </span>
            <span className="text-xs text-muted-foreground">~</span>
          </div>
          <div className="flex gap-1">
            {event.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
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
