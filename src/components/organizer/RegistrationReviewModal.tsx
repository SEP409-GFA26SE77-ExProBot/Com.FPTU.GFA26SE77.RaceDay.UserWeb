"use client";

import { useEffect } from "react";
import {
  Check,
  ExternalLink,
  FileText,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import type { ApiRegistration } from "@/dto/organizer.dto";
import {
  formatDateTime,
  formatPrice,
  getRegistrationStatusColor,
  getRegistrationStatusLabel,
} from "@/lib/format";
import { mediaDisplayUrl } from "@/lib/media-url";
import {
  formatMedicalLabels,
  registrationReviewedAt,
  registrationReviewerLabel,
} from "@/lib/registration-medical";

export type RegistrationReviewModalProps = {
  registration: ApiRegistration;
  eventName: string;
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  /** Người duyệt mặc định khi BE chưa trả reviewedBy* */
  fallbackReviewer?: string;
  onApprove?: () => void;
  onReject?: () => void;
};

function resolveFileUrl(url?: string | null): string | null {
  if (!url) return null;
  const resolved = mediaDisplayUrl(url);
  return resolved || null;
}

export default function RegistrationReviewModal({
  registration: r,
  eventName,
  open,
  onClose,
  busy = false,
  fallbackReviewer = "Ban tổ chức",
  onApprove,
  onReject,
}: RegistrationReviewModalProps) {
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

  const isRejected = r.status === "rejected";
  const isConfirmed = r.status === "confirmed" || r.status === "finished";
  const canModerate = r.status === "pending_approval";
  const reviewedAt = registrationReviewedAt(r);
  const reviewer =
    registrationReviewerLabel(r) ||
    (isRejected || isConfirmed ? fallbackReviewer : null);
  const certUrl = resolveFileUrl(r.healthCertUrl);
  const distanceLabel =
    r.distanceLabel ||
    (r.distanceKm != null ? `${r.distanceKm}K` : r.distanceId) ||
    "—";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-review-modal-title"
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
              : isConfirmed
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-amber-400 to-orange-500"
          }`}
        />

        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${getRegistrationStatusColor(
                r.status
              )}`}
            >
              {getRegistrationStatusLabel(r.status)}
            </span>
            <h2
              id="reg-review-modal-title"
              className="mt-1.5 truncate text-lg font-extrabold tracking-tight text-foreground sm:text-xl"
            >
              {r.fullName || "Chi tiết đăng ký"}
            </h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {eventName}
              {distanceLabel !== "—" ? ` · ${distanceLabel}` : ""}
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
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section className="min-w-0 space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                Form đăng ký VĐV
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                <Fact label="Họ và tên" value={r.fullName || "—"} />
                <Fact label="Email" value={r.email || "—"} />
                <Fact label="SĐT" value={r.phone || "—"} />
                <Fact label="Ngày sinh" value={r.dateOfBirth || "—"} />
                <Fact label="Giới tính" value={r.gender || "—"} />
                <Fact label="CCCD/CMND" value={r.idNumber || "—"} />
                <Fact
                  label="Chiều cao / cân nặng"
                  value={
                    r.heightCm || r.weightKg
                      ? `${r.heightCm ? `${r.heightCm} cm` : "—"} / ${
                          r.weightKg ? `${r.weightKg} kg` : "—"
                        }`
                      : "—"
                  }
                />
                <Fact label="Nhóm máu" value={r.bloodType || "—"} />
              </div>

              <div className="space-y-2 rounded-xl border border-border/50 bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Liên hệ khẩn cấp
                </p>
                <DetailRow label="Người liên hệ" value={r.emergencyName} />
                <DetailRow label="SĐT" value={r.emergencyPhone} />
              </div>

              <div className="space-y-2 rounded-xl border border-border/50 bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Áo / Y tế
                </p>
                <DetailRow
                  label="Áo"
                  value={
                    r.shirtType || r.shirtSize || r.shirtColor
                      ? [r.shirtType, r.shirtSize, r.shirtColor]
                          .filter(Boolean)
                          .join(" · ")
                      : "Không lấy áo"
                  }
                />
                <DetailRow
                  label="Bệnh lý"
                  value={formatMedicalLabels(r.medicalCodes)}
                />
                <div className="flex items-start justify-between gap-3 text-xs sm:text-sm">
                  <span className="shrink-0 text-muted-foreground">
                    Giấy khám
                  </span>
                  {certUrl ? (
                    <a
                      href={certUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-right font-semibold text-orange-600 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {r.healthCertFileName || "Xem file"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="font-medium">
                      {r.healthCertFileName || "Chưa có"}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <aside className="min-w-0 space-y-3 self-start lg:sticky lg:top-0">
              <section
                className={`h-fit space-y-3 rounded-2xl border p-4 ${
                  isRejected
                    ? "border-red-500/25 bg-red-500/5"
                    : isConfirmed
                      ? "border-emerald-500/25 bg-emerald-500/5"
                      : "border-amber-500/25 bg-amber-500/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert
                    className={`h-4 w-4 ${
                      isRejected
                        ? "text-red-600"
                        : isConfirmed
                          ? "text-emerald-600"
                          : "text-amber-600"
                    }`}
                  />
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isRejected
                        ? "text-red-700"
                        : isConfirmed
                          ? "text-emerald-700"
                          : "text-amber-700"
                    }`}
                  >
                    Kết quả duyệt đăng ký
                  </p>
                </div>

                <ReviewRow label="Tên giải" value={eventName} />
                <ReviewRow
                  label="Đăng ký lúc"
                  value={formatDateTime(r.createdAtUtc)}
                />
                <ReviewRow
                  label="Trạng thái"
                  value={getRegistrationStatusLabel(r.status)}
                />
                <ReviewRow
                  label="Cự ly"
                  value={distanceLabel}
                />
                <ReviewRow
                  label="Phí đã thanh toán"
                  value={
                    r.price != null && r.price !== undefined
                      ? formatPrice(Number(r.price))
                      : "—"
                  }
                />
                {r.bibNumber ? (
                  <ReviewRow label="BIB" value={r.bibNumber} />
                ) : null}
                <ReviewRow
                  label="Người duyệt"
                  value={
                    canModerate
                      ? "Chưa duyệt"
                      : reviewer || "—"
                  }
                />
                <ReviewRow
                  label="Thời gian duyệt"
                  value={
                    canModerate
                      ? "—"
                      : reviewedAt
                        ? formatDateTime(reviewedAt)
                        : "—"
                  }
                />

                {isRejected ? (
                  <div className="rounded-xl border border-red-500/20 bg-card p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">
                      Lý do từ chối
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {r.rejectionReason?.trim() ||
                        "Không có mô tả lý do từ phía Ban tổ chức."}
                    </p>
                  </div>
                ) : canModerate ? (
                  <div className="rounded-xl border border-amber-500/20 bg-card p-3 text-sm text-muted-foreground">
                    Kiểm tra form VĐV trước khi duyệt. Từ chối cần ghi rõ lý do
                    (tối thiểu 10 ký tự).
                  </div>
                ) : isConfirmed ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-card p-3 text-sm text-emerald-800">
                    Đơn đã được duyệt
                    {r.bibNumber ? ` — BIB ${r.bibNumber}` : ""}.
                  </div>
                ) : null}
              </section>
            </aside>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Đóng
          </button>
          {canModerate ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onReject}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Từ chối
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onApprove}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Duyệt
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/50 bg-card px-2.5 py-2">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-3 text-xs sm:text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-2 text-sm last:border-0 last:pb-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}
