"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Headset,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { getEventById } from "@/api/events";
import type { RaceEventDto } from "@/dto/event.dto";
import {
  formatDate,
  formatDateTime,
  formatPrice,
  getOrganizerStatusLabel,
  getStatusColor,
} from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

type ModalKind = "pending" | "rejected";

function statusKind(status: string): ModalKind | null {
  const key = (status || "").toLowerCase().replace(/_/g, "-");
  if (key === "pending" || key === "pending-approval") return "pending";
  if (key === "rejected") return "rejected";
  return null;
}

export interface OrganizerEventStatusModalProps {
  eventId: string;
  /** Status từ list card — dùng để chọn copy trước khi detail load xong */
  listStatus: string;
  open: boolean;
  onClose: () => void;
}

export default function OrganizerEventStatusModal({
  eventId,
  listStatus,
  open,
  onClose,
}: OrganizerEventStatusModalProps) {
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEvent(null);
    (async () => {
      try {
        const detail = await getEventById(eventId);
        if (!cancelled) setEvent(detail);
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được hồ sơ giải."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, eventId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const kind = statusKind(event?.status || listStatus) || "pending";
  const isRejected = kind === "rejected";
  const reviewedAt =
    event?.updatedAtUtc || event?.updatedAt || event?.createdAtUtc || event?.createdAt;
  const docs = event?.documents || [];
  const distances = event?.distances || [];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-status-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`h-1.5 w-full ${
            isRejected
              ? "bg-gradient-to-r from-red-500 to-orange-500"
              : "bg-gradient-to-r from-amber-400 to-orange-500"
          }`}
        />

        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${getStatusColor(
                event?.status || listStatus
              )}`}
            >
              {getOrganizerStatusLabel(event?.status || listStatus)}
            </span>
            <h2
              id="event-status-modal-title"
              className="mt-1.5 truncate text-lg font-extrabold tracking-tight text-foreground sm:text-xl"
            >
              {event?.name || "Chi tiết hồ sơ giải"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isRejected
                ? "Hồ sơ đã nộp và bị từ chối. Xem lại thông tin đã điền và lý do."
                : "Hồ sơ đang chờ Ban quản trị RaceDay thẩm định."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="mt-3 text-sm text-muted-foreground">Đang tải hồ sơ…</p>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          ) : event ? (
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {/* Trái — info đã điền (cuộn theo modal) */}
              <section className="min-w-0 space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                  Thông tin giải đã nộp
                </p>

                <div className="relative h-28 overflow-hidden rounded-xl border border-border/60">
                  {event.bannerImage ? (
                    <Image
                      src={mediaDisplayUrl(event.bannerImage)}
                      alt={event.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ background: DEFAULT_GRADIENT }}
                    />
                  )}
                </div>

                {event.tagline ? (
                  <p className="text-sm text-muted-foreground">{event.tagline}</p>
                ) : null}
                {event.description ? (
                  <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Fact
                    icon={<MapPin className="h-3.5 w-3.5 text-orange-500" />}
                    label="Địa điểm"
                    value={event.location || "—"}
                  />
                  <Fact
                    icon={<Calendar className="h-3.5 w-3.5 text-orange-500" />}
                    label="Ngày đua"
                    value={event.date ? formatDate(event.date) : "—"}
                  />
                  <Fact
                    icon={<Clock className="h-3.5 w-3.5 text-orange-500" />}
                    label="Giờ xuất phát"
                    value={event.startTime || "—"}
                  />
                  <Fact
                    icon={<Users className="h-3.5 w-3.5 text-orange-500" />}
                    label="Quy mô"
                    value={`${(event.totalRunners ?? 0).toLocaleString("vi-VN")} VĐV`}
                  />
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 text-orange-500" />
                    Đơn vị tổ chức
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {event.organizer?.name || "—"}
                  </p>
                  <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      {event.organizer?.email || "—"}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" />
                      {event.organizer?.phone || "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Cự ly ({distances.length})
                  </p>
                  {distances.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Chưa có cự ly.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {distances.map((d) => (
                        <li
                          key={d.id || `${d.name}-${d.distanceKm}`}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs"
                        >
                          <span className="font-semibold text-foreground">
                            {d.name || d.type}{" "}
                            <span className="font-normal text-muted-foreground">
                              · {d.distanceKm} km
                            </span>
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {formatPrice(d.price ?? 0)} ·{" "}
                            {(d.capacity ?? 0).toLocaleString("vi-VN")} slot
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                    Hồ sơ đính kèm ({docs.length})
                  </div>
                  {docs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Chưa có file.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {docs.map((d) => (
                        <li
                          key={d.documentKey}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {d.title}
                            </p>
                            <p className="truncate text-muted-foreground">
                              {d.fileName || d.documentKey}
                            </p>
                          </div>
                          {d.fileUrl ? (
                            <a
                              href={mediaDisplayUrl(d.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex shrink-0 items-center gap-1 font-bold text-orange-600 hover:underline"
                            >
                              Mở <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* Phải — thẩm định + contact (sticky, cao theo nội dung) */}
              <aside className="min-w-0 space-y-3 self-start lg:sticky lg:top-0">
                <section
                  className={`h-fit space-y-3 rounded-2xl border p-4 ${
                    isRejected
                      ? "border-red-500/25 bg-red-500/5"
                      : "border-amber-500/25 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert
                      className={`h-4 w-4 ${
                        isRejected ? "text-red-600" : "text-amber-600"
                      }`}
                    />
                    <p
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isRejected ? "text-red-700" : "text-amber-700"
                      }`}
                    >
                      Kết quả thẩm định
                    </p>
                  </div>

                  <ReviewRow
                    label="Trạng thái duyệt"
                    value={getOrganizerStatusLabel(event.status)}
                  />
                  <ReviewRow
                    label="Người duyệt"
                    value="Ban quản trị RaceDay"
                  />
                  <ReviewRow
                    label="Thời gian"
                    value={
                      isRejected
                        ? formatDateTime(reviewedAt)
                        : event.createdAtUtc || event.createdAt
                          ? `Nộp: ${formatDateTime(event.createdAtUtc || event.createdAt)}`
                          : "Đang chờ xử lý"
                    }
                  />

                  {isRejected ? (
                    <div className="rounded-xl border border-red-500/20 bg-card p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                        Lý do từ chối
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {event.rejectionReason?.trim() ||
                          "Không có mô tả lý do từ phía Ban quản trị."}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-500/20 bg-card p-3 text-sm text-muted-foreground">
                      Hồ sơ của bạn đang trong hàng đợi duyệt. Bạn sẽ nhận kết quả
                      qua email / trên trang{" "}
                      <span className="font-semibold text-foreground">Giải của tôi</span>{" "}
                      khi có cập nhật.
                    </div>
                  )}
                </section>

                <section className="h-fit rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white">
                      <Headset className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-foreground">
                        Liên hệ hỗ trợ RaceDay
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Cần giải thích thêm về lý do duyệt hoặc hỗ trợ chỉnh hồ
                        sơ? Đội hỗ trợ sẵn sàng giúp bạn.
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-orange-500" />
                          support@raceday.vn
                        </li>
                        <li className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                          ĐH FPT, Lô E2a-7, Đường D1, TP. Thủ Đức, TP.HCM
                        </li>
                      </ul>
                      <a
                        href="mailto:support@raceday.vn?subject=Hỗ trợ hồ sơ giải RaceDay"
                        className="mt-3 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white"
                      >
                        Gửi email hỗ trợ
                      </a>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Đóng
          </button>
          {isRejected ? (
            <Link
              href={`/events/create?draftId=${eventId}`}
              onClick={onClose}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-bold text-white"
            >
              Chỉnh sửa & nộp lại
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-lg border border-border/50 bg-card px-2.5 py-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-xs font-semibold text-foreground" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}
