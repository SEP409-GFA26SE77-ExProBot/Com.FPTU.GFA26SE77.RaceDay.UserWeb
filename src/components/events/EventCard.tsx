"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Users,
  TrendingUp,
} from "lucide-react";
import { RaceEventListItemDto } from "@/dto/event.dto";
import {
  formatPrice,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from "@/lib/format";

interface EventCardProps {
  event: RaceEventListItemDto;
}

/** Default gradient when bannerImage is missing */
const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

export default function EventCard({ event }: EventCardProps) {
  const distances = event.distances || [];
  const lowestPrice = distances.length
    ? Math.min(...distances.map((d) => d.price))
    : 0;

  // Compute registered / capacity from distances
  const totalCapacity = distances.reduce((s, d) => s + d.capacity, 0);
  const totalRegistered = distances.reduce(
    (s, d) => s + (d.registeredCount ?? 0),
    0
  );
  const progressPercent = totalCapacity
    ? Math.round((totalRegistered / totalCapacity) * 100)
    : 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/8 hover:-translate-y-1 hover:border-orange-500/30"
    >
      {/* Banner */}
      <div className="relative h-48 overflow-hidden">
        {event.bannerImage ? (
          <Image
            src={event.bannerImage}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
            style={{ background: DEFAULT_GRADIENT }}
          />
        )}
        <div className="absolute inset-0 bg-black/20" />

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
          {distances.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center rounded-md bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-gray-800 shadow-sm"
            >
              {d.distanceKm}K
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors duration-200">
          {event.name}
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
                {totalRegistered.toLocaleString()} /{" "}
                {(event.totalRunners ?? totalCapacity).toLocaleString()}
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

        {/* Price & Organizer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">
              {formatPrice(lowestPrice)}
            </span>
            <span className="text-xs text-muted-foreground">~</span>
          </div>
          {event.organizer?.name && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground truncate max-w-[120px]">
              {event.organizer.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
