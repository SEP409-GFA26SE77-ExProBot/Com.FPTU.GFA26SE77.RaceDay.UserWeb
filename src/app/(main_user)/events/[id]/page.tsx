"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie";
import {
  Calendar,
  MapPin,
  Users,
  Building2,
  ArrowLeft,
  ChevronRight,
  Clock,
  Loader2,
  Ticket,
  ScrollText,
  BookOpen,
  AlertTriangle,
  Gift,
  Package,
  Timer,
} from "lucide-react";
import { RaceEventDto, RegistrationDto } from "@/dto/event.dto";
import { getEventById, getMyRegistrations } from "@/api/events";
import {
  formatPrice,
  formatDate,
  getStatusColor,
} from "@/lib/format";
import {
  getPublicEventStatusLabel,
  isPublicRegistrationLive,
} from "@/lib/event-lifecycle";
import { getRaceDetails } from "@/lib/race-details";
import { resolveDistanceTicketPrice } from "@/lib/ticket-pricing";
import TicketPriceDisplay from "@/components/events/TicketPriceDisplay";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL } from "@/lib/page-shell";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myReg, setMyReg] = useState<RegistrationDto | null>(null);
  const registerCardRef = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

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

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token || !eventId) {
      setMyReg(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await getMyRegistrations();
        if (cancelled) return;
        // Bỏ qua rejected/cancelled — vé đã hủy không còn coi là “đã đăng ký”
        const match = (Array.isArray(list) ? list : []).find(
          (r) =>
            String(r.eventId) === String(eventId) &&
            r.status !== "rejected" &&
            r.status !== "cancelled"
        );
        setMyReg(match ?? null);
      } catch {
        if (!cancelled) setMyReg(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!event) return;
    const el = registerCardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [event]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải giải…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">🏃</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy giải</h1>
        <p className="text-muted-foreground mb-6">
          {error || "Giải bạn tìm không tồn tại hoặc đã bị gỡ."}
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về danh sách giải
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

  const publicStatusLabel = getPublicEventStatusLabel(event);
  const canRegister = isPublicRegistrationLive(event) && !myReg;
  const slotsLeft = totalCapacity - totalRegistered;
  const fromTicket =
    distances.length > 0
      ? distances
          .map((d) => resolveDistanceTicketPrice(event.ticketPricing, d))
          .reduce((best, t) => (t.price < best.price ? t : best))
      : null;

  const myRegCtaHref =
    myReg == null
      ? null
      : myReg.status === "pending_payment"
        ? `/events/${event.id}/payment?regId=${myReg.id}`
        : myReg.status === "pending_approval"
          ? `/events/${event.id}/pending?regId=${myReg.id}`
          : `/my-registrations/${myReg.id}`;

  const myRegCtaLabel =
    myReg == null
      ? null
      : myReg.status === "pending_payment"
        ? "Tiếp tục thanh toán"
        : myReg.status === "pending_approval"
          ? "Đã đăng ký · Chờ duyệt"
          : myReg.status === "confirmed"
            ? "Đã đăng ký · Xem vé"
            : "Đã đăng ký";

  const details = getRaceDetails(event);

  return (
    <div className="pb-24 lg:pb-0">
      {/* Hero Banner */}
      <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden">
        {event.bannerImage ? (
          <Image
            src={mediaDisplayUrl(event.bannerImage)}
            alt={event.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0" style={{ background: DEFAULT_GRADIENT }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25" />

        {/* Breadcrumb */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-full bg-black/55 border border-white/20 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tất cả giải
          </Link>
        </div>

        {/* Status + slots badge */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-8 flex flex-wrap gap-1.5 justify-end">
          <span
            className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-bold backdrop-blur-md ${getStatusColor(
              event.status
            )}`}
          >
            {publicStatusLabel}
          </span>
          {canRegister && slotsLeft > 0 && (
            <span className="inline-flex items-center rounded-md bg-black/80 text-white border border-white/25 px-3 py-1.5 text-xs font-bold">
              Còn {slotsLeft.toLocaleString("vi-VN")} chỗ
            </span>
          )}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-5 pt-14">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight drop-shadow">
              {event.name}
            </h1>
            {event.tagline && (
              <p className="mt-1 text-sm text-white/70">{event.tagline}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-white/90">
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
      <div className={`${PAGE_SHELL} py-7 sm:py-8`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-7 order-2 lg:order-1">
            {/* Description */}
            {(event.description?.trim() || details.tags.length > 0) && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-2">Giới thiệu giải</h2>
                {event.description?.trim() ? (
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-[15px]">
                    {event.description}
                  </p>
                ) : null}
                {details.tags.length > 0 && (
                  <>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Loại hình
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {details.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/events?tag=${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, "-"))}`}
                          className="rounded-full bg-orange-500/10 text-orange-700 border border-orange-500/20 px-3 py-1 text-xs font-semibold hover:bg-orange-500/20 transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* Distances table */}
            {distances.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">
                  Hạng mục &amp; lệ phí
                </h2>
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-4 py-3 font-semibold text-foreground">
                            Hạng mục
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-foreground">
                            Cự ly
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-foreground">
                            Giá hiện tại
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-foreground">
                            Slot
                          </th>
                          <th className="text-center px-4 py-3 font-semibold text-foreground">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {distances.map((d) => {
                          const registered = d.registeredCount ?? 0;
                          const left = d.capacity - registered;
                          const soldOut = left <= 0;
                          const ticket = resolveDistanceTicketPrice(
                            event.ticketPricing,
                            d
                          );
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
                                {d.startAt ? (
                                  <span className="block text-[11px] text-muted-foreground/80">
                                    XP {String(d.startAt).slice(0, 5)}
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <TicketPriceDisplay
                                  ticket={ticket}
                                  size="sm"
                                  align="center"
                                />
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground">
                                {registered}/{d.capacity}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {soldOut ? (
                                  <span className="rounded-md bg-red-600 text-white px-2.5 py-0.5 text-xs font-bold">
                                    Hết slot
                                  </span>
                                ) : left < 20 ? (
                                  <span className="rounded-md bg-amber-500 text-white px-2.5 py-0.5 text-xs font-bold">
                                    Còn {left}
                                  </span>
                                ) : (
                                  <span className="rounded-md bg-emerald-600 text-white px-2.5 py-0.5 text-xs font-bold">
                                    Còn chỗ
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
              <h2 className="text-xl font-bold text-foreground mb-3">Thông tin giải</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    {
                      icon: Calendar,
                      label: event.endDate ? "Thời gian giải" : "Ngày",
                      value: event.endDate
                        ? `${formatDate(event.date)} → ${formatDate(event.endDate)}`
                        : formatDate(event.date),
                    },
                    { icon: MapPin, label: "Địa điểm", value: event.location },
                    {
                      icon: Building2,
                      label: "Ban tổ chức",
                      value: event.organizer?.name || "",
                    },
                    {
                      icon: Clock,
                      label: "Giờ xuất phát",
                      value: details.startTime,
                    },
                    {
                      icon: Package,
                      label: "Nhận BIB / kit",
                      value: details.kitPickup,
                    },
                    { icon: Timer, label: "Cut-off", value: details.cutOff },
                    {
                      icon: Calendar,
                      label: "Mở đăng ký",
                      value: event.registrationOpensAtUtc
                        ? new Date(event.registrationOpensAtUtc).toLocaleString("vi-VN")
                        : "",
                    },
                    {
                      icon: Calendar,
                      label: "Đóng đăng ký",
                      value: event.registrationClosesAtUtc
                        ? new Date(event.registrationClosesAtUtc).toLocaleString("vi-VN")
                        : "",
                    },
                    {
                      icon: Users,
                      label: "Sức chứa",
                      value: `${(event.totalRunners ?? totalCapacity).toLocaleString("vi-VN")} VĐV`,
                    },
                  ] as const
                )
                  .filter((item) => Boolean(item.value && String(item.value).trim()))
                  .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 shrink-0">
                        <item.icon className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {details.schedule.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-foreground">Lịch trình race day</h2>
                </div>
                <ol className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {details.schedule.map((row) => (
                    <li
                      key={`${row.time}-${row.activity}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3 bg-card"
                    >
                      <span className="text-xs font-bold text-orange-600 sm:w-48 shrink-0">
                        {row.time}
                      </span>
                      <span className="text-sm text-foreground">{row.activity}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {details.rules.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ScrollText className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-foreground">Thể lệ &amp; quy định</h2>
                </div>
                <ul className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-5">
                  {details.rules.map((rule) => (
                    <li
                      key={rule}
                      className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {details.guidelines.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-foreground">Hướng dẫn VĐV</h2>
                </div>
                <ul className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-5">
                  {details.guidelines.map((g) => (
                    <li
                      key={g}
                      className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {details.prizes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-5 w-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-foreground">Giải thưởng chi tiết</h2>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-4 py-3 font-semibold">Hạng mục</th>
                        <th className="text-left px-4 py-3 font-semibold">Phần thưởng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {details.prizes.map((p) => (
                        <tr key={p.category}>
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap align-top">
                            {p.category}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{p.reward}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {details.penalties.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h2 className="text-xl font-bold text-foreground">Hình phạt / DSQ</h2>
                </div>
                <ul className="space-y-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 sm:p-5">
                  {details.penalties.map((p) => (
                    <li
                      key={p}
                      className="flex gap-2.5 text-sm text-foreground/80 leading-relaxed"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Registration Card */}
              <div
                ref={registerCardRef}
                className="rounded-2xl border border-border bg-card p-5 shadow-lg space-y-4"
              >
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Giá từ
                  </p>
                  {fromTicket ? (
                    <div className="mt-1">
                      <TicketPriceDisplay
                        ticket={fromTicket}
                        size="lg"
                        align="center"
                      />
                    </div>
                  ) : (
                    <p className="mt-1 text-3xl font-extrabold text-orange-600">—</p>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {totalRegistered.toLocaleString("vi-VN")} đã đăng ký
                    </span>
                    <span>{progressPercent}% đầy</span>
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

                {myReg && myRegCtaHref ? (
                  <Link
                    href={myRegCtaHref}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-50 py-3 text-sm font-bold text-orange-700 transition-all hover:bg-orange-100"
                  >
                    <Ticket className="h-4 w-4" />
                    {myRegCtaLabel}
                  </Link>
                ) : canRegister ? (
                  <Link
                    href={`/events/${event.id}/register`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Đăng ký ngay
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm font-bold text-muted-foreground cursor-not-allowed"
                  >
                    {event.status === "sold-out"
                      ? "Hết slot"
                      : publicStatusLabel === "Sắp mở"
                        ? "Sắp mở đăng ký"
                        : publicStatusLabel === "Đang diễn ra"
                          ? "Giải đang diễn ra"
                          : publicStatusLabel === "Đã kết thúc"
                            ? "Giải đã kết thúc"
                            : "Đã đóng đăng ký"}
                  </button>
                )}

                <p className="text-[11px] text-muted-foreground text-center">
                  {myReg
                    ? "Bạn đã có đăng ký cho giải này. Trạng thái giải vẫn mở cho VĐV khác."
                    : "Đăng ký an toàn • Xác nhận ngay"}
                </p>
              </div>

              {/* Organizer card — ẩn email/SĐT placeholder sau tạo gói */}
              {event.organizer && (
                <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold text-sm">
                      {event.organizer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tổ chức bởi</p>
                      <p className="text-sm font-semibold text-foreground">
                        {event.organizer.name}
                      </p>
                    </div>
                  </div>
                  {event.organizer.email &&
                    !/@update\.raceday\.vn$/i.test(event.organizer.email) &&
                    !/^organizer-/i.test(event.organizer.email) && (
                      <p className="text-xs text-muted-foreground">
                        📧 {event.organizer.email}
                      </p>
                    )}
                  {event.organizer.phone &&
                    !/^0{8,}$/.test(event.organizer.phone.replace(/\D/g, "")) && (
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

      {/* Mobile sticky CTA */}
      {showStickyCta && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/80 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-4 py-3 safe-area-pb">
          <div className="mx-auto max-w-lg flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Giá từ
              </p>
              {fromTicket ? (
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                  {fromTicket.phase &&
                  !fromTicket.phase.isStandard &&
                  fromTicket.basePrice > fromTicket.price ? (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(fromTicket.basePrice)}
                    </span>
                  ) : null}
                  <span className="text-lg font-extrabold text-orange-600 truncate">
                    {formatPrice(fromTicket.price)}
                  </span>
                  {fromTicket.phase ? (
                    <span className="text-[10px] font-semibold text-muted-foreground truncate">
                      {fromTicket.phase.name}
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="text-lg font-extrabold text-orange-600">—</p>
              )}
            </div>
            {myReg && myRegCtaHref ? (
              <Link
                href={myRegCtaHref}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-orange-500 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-700"
              >
                <Ticket className="h-3.5 w-3.5" />
                {myReg.status === "confirmed"
                  ? "Xem vé"
                  : myReg.status === "pending_payment"
                    ? "Thanh toán"
                    : "Chờ duyệt"}
              </Link>
            ) : canRegister ? (
              <Link
                href={`/events/${event.id}/register`}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25"
              >
                Đăng ký
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="shrink-0 rounded-full bg-muted px-4 py-2.5 text-xs font-bold text-muted-foreground">
                {event.status === "sold-out" ? "Hết slot" : "Chưa mở"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
