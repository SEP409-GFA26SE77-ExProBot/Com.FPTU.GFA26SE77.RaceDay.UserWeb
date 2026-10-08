"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Users,
  Building2,
  ArrowLeft,
  ChevronRight,
  Clock,
  Trophy,
  Loader2,
} from "lucide-react";
import { RaceEventDto } from "@/dto/event.dto";
import { getEventById } from "@/api/events";
import {
  formatPrice,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from "@/lib/format";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getEventById(eventId)
      .then((data) => {
        if (!cancelled) setEvent(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.error || "Không thể tải thông tin giải."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="mt-3 text-sm text-muted-foreground">Loading event…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">🏃</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">
          {error || "The event you're looking for doesn't exist or has been removed."}
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
      </div>
    );
  }

  const distances = event.distances || [];
  const totalCapacity = distances.reduce((s, d) => s + d.capacity, 0);
  const totalRegistered = distances.reduce(
    (s, d) => s + (d.registeredCount ?? 0),
    0
  );
  const progressPercent = totalCapacity
    ? Math.round((totalRegistered / totalCapacity) * 100)
    : 0;

  const canRegister = event.status === "registration-open";

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        {event.bannerImage ? (
          <Image
            src={event.bannerImage}
            alt={event.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0" style={{ background: DEFAULT_GRADIENT }} />
        )}
        <div className="absolute inset-0 bg-black/30" />

        {/* Breadcrumb */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/25 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Events
          </Link>
        </div>

        {/* Status badge */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur-md ${getStatusColor(
              event.status
            )}`}
          >
            {getStatusLabel(event.status)}
          </span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 sm:px-8 pb-6 pt-16">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {event.name}
            </h1>
            {event.tagline && (
              <p className="mt-1 text-sm text-white/70">{event.tagline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-white/80">
              <span className="inline-flex items-center gap-1 text-sm">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(event.date)}
              </span>
              <span className="text-white/40">•</span>
              <span className="inline-flex items-center gap-1 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">About This Event</h2>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </section>

            {/* Distances table */}
            {distances.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Race Categories & Pricing
                </h2>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-4 py-3 font-semibold text-foreground">
                            Category
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-foreground">
                            Distance
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-foreground">
                            Price
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-foreground">
                            Slots
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {distances.map((d) => {
                          const registered = d.registeredCount ?? 0;
                          const slotsLeft = d.capacity - registered;
                          const soldOut = slotsLeft <= 0;
                          return (
                            <tr
                              key={d.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-4 py-3 font-medium text-foreground">
                                <div className="flex items-center gap-2">
                                  {d.color && (
                                    <span
                                      className="inline-block h-3 w-3 rounded-full"
                                      style={{ background: d.color }}
                                    />
                                  )}
                                  {d.name || d.type}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground">
                                {d.distanceKm} km
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-orange-600">
                                {formatPrice(d.price)}
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground">
                                {registered}/{d.capacity}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {soldOut ? (
                                  <span className="rounded-full bg-red-500/10 text-red-600 px-2.5 py-0.5 text-xs font-semibold">
                                    Sold Out
                                  </span>
                                ) : slotsLeft < 20 ? (
                                  <span className="rounded-full bg-amber-500/10 text-amber-600 px-2.5 py-0.5 text-xs font-semibold">
                                    {slotsLeft} left
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-xs font-semibold">
                                    Available
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Event Info */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Event Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Calendar,
                    label: "Date",
                    value: formatDate(event.date),
                  },
                  {
                    icon: MapPin,
                    label: "Location",
                    value: event.location,
                  },
                  {
                    icon: Building2,
                    label: "Organizer",
                    value: event.organizer?.name || "—",
                  },
                  {
                    icon: Clock,
                    label: "Start Time",
                    value: event.startTime || "TBA",
                  },
                  {
                    icon: Trophy,
                    label: "Awards",
                    value: (event.rewards as Record<string, unknown>)?.finisherMedal
                      ? "Medals for all finishers"
                      : "See event details",
                  },
                  {
                    icon: Users,
                    label: "Capacity",
                    value: `${(event.totalRunners ?? totalCapacity).toLocaleString()} runners`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 shrink-0">
                      <item.icon className="h-4.5 w-4.5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Registration Card */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-lg space-y-5">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Starting from
                  </p>
                  <p className="text-3xl font-extrabold text-orange-600 mt-1">
                    {distances.length > 0
                      ? formatPrice(Math.min(...distances.map((d) => d.price)))
                      : "—"}
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {totalRegistered.toLocaleString()} registered
                    </span>
                    <span>{progressPercent}% full</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
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

                {canRegister ? (
                  <Link
                    href={`/events/${event.id}/register`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Register Now
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold text-muted-foreground cursor-not-allowed"
                  >
                    {event.status === "approved"
                      ? "Registration Opens Soon"
                      : event.status === "closed" || event.status === "completed"
                      ? "Registration Closed"
                      : "Registration Unavailable"}
                  </button>
                )}

                <p className="text-[11px] text-muted-foreground text-center">
                  Secure registration • Instant confirmation
                </p>
              </div>

              {/* Organizer card */}
              {event.organizer && (
                <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold text-sm">
                      {event.organizer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Organized by</p>
                      <p className="text-sm font-semibold text-foreground">
                        {event.organizer.name}
                      </p>
                    </div>
                  </div>
                  {event.organizer.email && (
                    <p className="text-xs text-muted-foreground">
                      📧 {event.organizer.email}
                    </p>
                  )}
                  {event.organizer.phone && (
                    <p className="text-xs text-muted-foreground">
                      📞 {event.organizer.phone}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
