"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Building2,
  ArrowLeft,
  ChevronRight,
  Clock,
  Trophy,
} from "lucide-react";
import {
  getEventById,
  formatPrice,
  formatDate,
  getStatusLabel,
  getStatusColor,
} from "@/data/mock-events";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = Number(params.id);
  const event = getEventById(eventId);

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">🏃</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The event you&apos;re looking for doesn&apos;t exist or has been removed.
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

  const progressPercent = Math.round(
    (event.registeredCount / event.maxParticipants) * 100
  );
  const canRegister = event.status === "registration-open";

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: event.bannerGradient }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[120px] sm:text-[160px] opacity-20 select-none">
            {event.bannerEmoji}
          </span>
        </div>

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
              {event.title}
            </h1>
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
              <div className="mt-4 flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-orange-500/10 text-orange-700 px-3 py-1 text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Distances table */}
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
                      {event.distances.map((d) => {
                        const slotsLeft = d.maxSlots - d.registeredSlots;
                        const soldOut = slotsLeft <= 0;
                        return (
                          <tr
                            key={d.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-foreground">
                              {d.label}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground">
                              {d.km} km
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-orange-600">
                              {formatPrice(d.price)}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground">
                              {d.registeredSlots}/{d.maxSlots}
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
                    value: event.organizer,
                  },
                  {
                    icon: Clock,
                    label: "Start Time",
                    value: "5:00 AM (varies by category)",
                  },
                  {
                    icon: Trophy,
                    label: "Awards",
                    value: "Medals for all finishers",
                  },
                  {
                    icon: Users,
                    label: "Capacity",
                    value: `${event.maxParticipants.toLocaleString()} runners`,
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
                    {formatPrice(Math.min(...event.distances.map((d) => d.price)))}
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.registeredCount.toLocaleString()} registered
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
                    {event.status === "sold-out"
                      ? "Sold Out"
                      : event.status === "upcoming"
                      ? "Registration Opens Soon"
                      : "Registration Closed"}
                  </button>
                )}

                <p className="text-[11px] text-muted-foreground text-center">
                  Secure registration • Instant confirmation
                </p>
              </div>

              {/* Organizer card */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold text-sm">
                    {event.organizer.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Organized by</p>
                    <p className="text-sm font-semibold text-foreground">
                      {event.organizer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
