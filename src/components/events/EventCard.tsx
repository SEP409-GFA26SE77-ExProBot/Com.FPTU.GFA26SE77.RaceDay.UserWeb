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
  getRegistrationStatusLabel,
} from "@/lib/format";
import {
  getPublicEventStatusLabel,
  isPublicRegistrationLive,
} from "@/lib/event-lifecycle";
import { mediaDisplayUrl } from "@/lib/media-url";

interface EventCardProps {
  event: RaceEventListItemDto;
  /**
   * `event` — badge theo trạng thái giải (trang khám phá).
   * `registration` — badge theo trạng thái ĐK của user (giải đã đăng ký).
   */
  statusMode?: "event" | "registration";
  /** Status đăng ký của user trên giải này (dùng khi statusMode = registration) */
  myRegistrationStatus?: string | null;
}

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

/** Badge trên ảnh: nền đặc + chữ sáng — tránh bị lẫn vào banner */
const BADGE_BASE =
  "inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-extrabold shadow-md ring-1 ring-white/40";

function DistanceChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-zinc-950 text-white px-2 py-0.5 text-[11px] font-extrabold tracking-wide shadow-md ring-2 ring-white/90">
      {label}
    </span>
  );
}

function myRegPrimaryLabel(status: string): string {
  return getRegistrationStatusLabel(status);
}

function overlayPublicLabelClass(label: string): string {
  switch (label) {
    case "Đang mở":
      return "bg-emerald-600 text-white";
    case "Sắp mở":
    case "Chờ mở":
      return "bg-amber-500 text-zinc-950";
    case "Đang diễn ra":
      return "bg-rose-600 text-white";
    case "Hết slot":
    case "Đã hủy":
    case "Từ chối":
      return "bg-red-600 text-white";
    case "Đã đóng":
    case "Đã kết thúc":
      return "bg-zinc-800 text-white";
    default:
      return "bg-zinc-950 text-white";
  }
}

function overlayRegStatusClass(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "pending_payment":
      return "bg-amber-500 text-zinc-950";
    case "pending_approval":
      return "bg-sky-600 text-white";
    case "confirmed":
    case "finished":
      return "bg-orange-600 text-white";
    case "rejected":
      return "bg-red-600 text-white";
    case "cancelled":
      return "bg-zinc-700 text-white";
    default:
      return "bg-zinc-950 text-white";
  }
}

export default function EventCard({
  event,
  statusMode = "event",
  myRegistrationStatus = null,
}: EventCardProps) {
  const distances = event.distances || [];
  const lowestPrice = distances.length
    ? Math.min(...distances.map((d) => d.price))
    : 0;

  const totalCapacity =
    distances.reduce((s, d) => s + d.capacity, 0) || event.totalRunners || 0;
  const totalRegistered = distances.reduce(
    (s, d) => s + (d.registeredCount ?? 0),
    0
  );
  const progressPercent = totalCapacity
    ? Math.round((totalRegistered / totalCapacity) * 100)
    : 0;
  const slotsLeft = Math.max(0, totalCapacity - totalRegistered);
  const eventStatusKey = (event.status || "").toLowerCase().replace(/_/g, "-");
  const publicLabel = getPublicEventStatusLabel(event);
  const regLive = isPublicRegistrationLive(event);
  const showRegBadge =
    statusMode === "registration" && Boolean(myRegistrationStatus);
  const href =
    publicLabel === "Đang diễn ra" || eventStatusKey === "in-progress"
      ? `/race-day?eventId=${event.id}`
      : `/events/${event.id}`;

  return (
    <Link
      href={href}
      className={`group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
        publicLabel === "Đang diễn ra" || eventStatusKey === "in-progress"
          ? "border-[3px] border-rose-500 bg-gradient-to-br from-rose-50 via-orange-50/80 to-white shadow-lg shadow-rose-500/20 ring-2 ring-rose-400/30 hover:shadow-xl hover:shadow-rose-500/30"
          : showRegBadge
            ? "border-2 border-orange-500/50 bg-card shadow-sm hover:shadow-lg hover:shadow-orange-500/15 hover:border-orange-500"
            : "border border-border/60 bg-card shadow-sm hover:shadow-xl hover:shadow-orange-500/8 hover:border-orange-500/30"
      }`}
    >
      <div className="relative h-48 overflow-hidden">
        {event.bannerImage ? (
          <Image
            src={mediaDisplayUrl(event.bannerImage)}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/45" />

        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
          {showRegBadge ? (
            <span
              className={`${BADGE_BASE} ${overlayRegStatusClass(
                myRegistrationStatus!
              )}`}
            >
              {myRegPrimaryLabel(myRegistrationStatus!)}
            </span>
          ) : (
            <span
              className={`${BADGE_BASE} ${overlayPublicLabelClass(publicLabel)}`}
            >
              {publicLabel}
            </span>
          )}

          {statusMode === "event" &&
            regLive &&
            slotsLeft > 0 && (
              <span className={`${BADGE_BASE} bg-zinc-950 text-white`}>
                Còn {slotsLeft.toLocaleString("vi-VN")} chỗ
              </span>
            )}

          {eventStatusKey === "in-progress" && (
            <span className={`${BADGE_BASE} bg-zinc-950 text-white ring-rose-400/60`}>
              LIVE · Vào SOS
            </span>
          )}

          {statusMode === "event" && eventStatusKey === "sold-out" && (
            <span className={`${BADGE_BASE} bg-amber-400 text-zinc-950`}>
              0 chỗ trống
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
          {distances.map((d) => (
            <DistanceChip key={d.id} label={`${d.distanceKm}K`} />
          ))}
          {!distances.length &&
            (event.distanceTypes || []).map((t) => (
              <DistanceChip key={t} label={t} />
            ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors duration-200">
          {event.name}
        </h3>

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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {totalRegistered.toLocaleString("vi-VN")} /{" "}
                {(event.totalRunners ?? totalCapacity).toLocaleString("vi-VN")}
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

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-sm font-bold text-orange-600">
              {lowestPrice > 0 ? `từ ${formatPrice(lowestPrice)}` : "Xem chi tiết"}
            </span>
          </div>
          {(event.organizer?.name || event.organizerName) && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground truncate max-w-[120px]">
              {event.organizer?.name || event.organizerName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
