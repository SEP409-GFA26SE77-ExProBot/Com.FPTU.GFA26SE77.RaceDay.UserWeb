"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { RaceEventListItemDto } from "@/dto/event.dto";
import {
  formatPrice,
  formatDate,
  getRegistrationStatusLabel,
} from "@/lib/format";
import {
  getPublicEventStatusLabel,
  getPublicEventStatusBadgeClass,
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
  /** Id đơn ĐK — dùng để deep-link tiếp tục thanh toán / chờ duyệt */
  registrationId?: string | null;
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

const SURFACE_TYPE_LABELS = new Set([
  "road",
  "trail",
  "ultra",
  "track",
  "other",
  "mixed",
]);

/** Chip cự ly trên card list — ưu tiên distances → labels → distanceKms. */
function listDistanceChipLabels(event: RaceEventListItemDto): string[] {
  const distances = event.distances || [];
  if (distances.length) {
    return distances
      .map((d) => {
        const name = (d.name || "").trim();
        if (name) return name;
        return d.distanceKm > 0 ? `${d.distanceKm}K` : "";
      })
      .filter(Boolean);
  }

  const fromTypes = (event.distanceTypes || [])
    .map((t) => (t || "").trim())
    .filter((t) => t && !SURFACE_TYPE_LABELS.has(t.toLowerCase()));
  if (fromTypes.length) return [...new Set(fromTypes)];

  return (event.distanceKms || [])
    .filter((km) => Number.isFinite(km) && km > 0)
    .map((km) => `${km}K`);
}

function myRegPrimaryLabel(status: string): string {
  return getRegistrationStatusLabel(status);
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
  registrationId = null,
}: EventCardProps) {
  const [failedBanner, setFailedBanner] = useState<string | null>(null);
  const distances = event.distances || [];
  const fromList =
    typeof event.minPrice === "number" && Number.isFinite(event.minPrice)
      ? event.minPrice
      : null;
  const fromDistances = distances.length
    ? Math.min(...distances.map((d) => Number(d.basePrice ?? d.price) || 0))
    : 0;
  const lowestPrice = fromList != null ? fromList : fromDistances;

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
  const regStatus = (myRegistrationStatus || "").toLowerCase();
  const href =
    statusMode === "registration" &&
    registrationId &&
    regStatus === "pending_payment"
      ? `/events/${event.id}/payment?regId=${registrationId}`
      : statusMode === "registration" &&
          registrationId &&
          regStatus === "pending_approval"
        ? `/events/${event.id}/pending?regId=${registrationId}`
        : statusMode === "registration" &&
            registrationId &&
            (regStatus === "confirmed" || regStatus === "finished")
          ? `/my-registrations/${registrationId}`
          : publicLabel === "Đang diễn ra" || eventStatusKey === "in-progress"
            ? `/race-day?eventId=${event.id}`
            : `/events/${event.id}`;

  return (
    <Link
      href={href}
      className={`group flex min-w-0 h-full flex-col rounded-2xl overflow-hidden transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 ${
        publicLabel === "Đang diễn ra" || eventStatusKey === "in-progress"
          ? "border border-rose-300 bg-card shadow-sm ring-1 ring-rose-200 hover:shadow-lg"
          : showRegBadge
            ? "border border-orange-300 bg-card shadow-sm hover:shadow-lg hover:border-orange-500"
            : "border border-border/60 bg-card shadow-sm hover:shadow-xl hover:shadow-orange-500/8 hover:border-orange-500/30"
      }`}
    >
      <div className="relative h-48 overflow-hidden">
        {event.bannerImage && failedBanner !== event.bannerImage ? (
          <Image
            src={mediaDisplayUrl(event.bannerImage)}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
            onError={() => setFailedBanner(event.bannerImage!)}
          />
        ) : (
          <div
            className="absolute inset-0"
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
              className={`${BADGE_BASE} ${getPublicEventStatusBadgeClass(publicLabel)}`}
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
          {listDistanceChipLabels(event).map((label) => (
            <DistanceChip key={label} label={label} />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <h3 className="min-h-12 text-lg font-bold text-foreground leading-snug break-words group-hover:text-orange-700 transition-colors duration-200">
          {event.name}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="min-w-0">{event.date ? formatDate(event.date) : "Ngày thi đấu đang cập nhật"}</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="min-w-0 break-words">{event.location || "Địa điểm đang cập nhật"}</span>
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
                width: `${Math.min(100, Math.max(0, progressPercent))}%`,
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

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-base font-bold text-orange-700 tabular-nums">
              {lowestPrice > 0 ? `từ ${formatPrice(lowestPrice)}` : "Xem chi tiết"}
            </span>
          </div>
          {(event.organizer?.name || event.organizerName) && (
            <span className="max-w-full break-words rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {event.organizer?.name || event.organizerName}
            </span>
          )}
        </div>
        <div className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-orange-50 px-3 text-sm font-semibold text-orange-800 transition-colors group-hover:bg-orange-100">
          <span>{showRegBadge && regStatus === "pending_payment" ? "Tiếp tục thanh toán" : showRegBadge && regStatus === "pending_approval" ? "Theo dõi hồ sơ" : showRegBadge && (regStatus === "confirmed" || regStatus === "finished") ? "Xem vé của bạn" : publicLabel === "Đang diễn ra" || eventStatusKey === "in-progress" ? "Vào ngày thi đấu" : "Khám phá giải chạy"}</span>
          <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
