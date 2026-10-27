"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Flag,
  Link2,
  X,
} from "lucide-react";
import { downloadPhotoById } from "@/lib/download-photo";
import { mediaDisplayUrl } from "@/lib/media-url";
import type { PhotoListItemDto } from "@/dto/photo.dto";
import { getApiErrorMessage } from "@/lib/error";
import { toastError, toastSuccess } from "@/lib/toast";

export type PhotoViewerModalProps = {
  open: boolean;
  photo: PhotoListItemDto | null;
  bibHint?: string;
  eventName?: string;
  onClose: () => void;
  onReport?: () => void;
};

function sharePageUrl(photoId: string): string {
  if (typeof window === "undefined") return "";
  const u = new URL(window.location.href);
  u.searchParams.set("photoId", photoId);
  return u.toString();
}

export default function PhotoViewerModal({
  open,
  photo,
  bibHint,
  eventName,
  onClose,
  onReport,
}: PhotoViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setDownloading(false);
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
  }, [open, onClose, photo?.id]);

  const src = mediaDisplayUrl(photo?.url || "");
  const tags = photo?.tags ?? [];
  const bibs =
    tags.map((t) => t.bib).filter(Boolean).join(", ") || bibHint || "—";

  const pageUrl = useMemo(
    () => (photo?.id ? sharePageUrl(photo.id) : ""),
    [photo?.id]
  );

  const shareText = useMemo(() => {
    const event = eventName?.trim() || "RaceDay";
    return `Ảnh của tôi tại ${event} — BIB ${bibs}`;
  }, [eventName, bibs]);

  if (!open || !photo) return null;

  const openShare = (kind: "facebook" | "x") => {
    const url = encodeURIComponent(pageUrl || photo.url);
    const text = encodeURIComponent(shareText);
    const href =
      kind === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
        : `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    window.open(href, "_blank", "noopener,noreferrer,width=640,height=560");
  };

  const copyLink = async () => {
    const value = pageUrl || mediaDisplayUrl(photo.url) || photo.url;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPhotoById(photo.id, `raceday-bib-${bibs || "photo"}.jpg`);
      toastSuccess("Đã tải ảnh.");
    } catch (e) {
      toastError(getApiErrorMessage(e, "Tải ảnh thất bại."));
    } finally {
      setDownloading(false);
    }
  };

  const created =
    photo.createdAtUtc &&
    new Date(photo.createdAtUtc).toLocaleString("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết ảnh"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-6xl flex-col overflow-hidden border border-border/60 bg-card text-foreground shadow-2xl sm:h-[min(92vh,880px)] sm:rounded-2xl lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ảnh — full rõ, không crop */}
        <div className="relative flex min-h-[42vh] flex-1 items-center justify-center bg-muted/40 lg:min-h-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white/90 text-foreground shadow-sm hover:bg-white lg:hidden"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`Ảnh BIB ${bibs}`}
              className="max-h-[min(52vh,520px)] max-w-full object-contain lg:max-h-full lg:h-full lg:w-full"
              draggable={false}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Không tải được ảnh</p>
          )}
        </div>

        {/* Info + share */}
        <aside className="flex w-full shrink-0 flex-col border-t border-border bg-background lg:w-[340px] lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-500">
                Chi tiết ảnh
              </p>
              <h2 className="truncate text-lg font-extrabold tracking-tight text-foreground">
                BIB {bibs}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-foreground hover:bg-muted lg:inline-flex"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
            <dl className="space-y-3">
              {eventName ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Giải</dt>
                  <dd className="font-semibold text-foreground">{eventName}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-muted-foreground">BIB gắn OCR</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {bibs}
                </dd>
              </div>
              {photo.zone ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Khu vực / zone</dt>
                  <dd className="text-foreground">{photo.zone}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs text-muted-foreground">Trạng thái</dt>
                <dd className="capitalize text-foreground">
                  {photo.status || "—"}
                </dd>
              </div>
              {created ? (
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Thời gian upload
                  </dt>
                  <dd className="text-foreground">{created}</dd>
                </div>
              ) : null}
            </dl>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Chia sẻ
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openShare("facebook")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-3 py-2.5 text-xs font-bold text-white hover:brightness-110"
                >
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => openShare("x")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-zinc-800"
                >
                  X
                </button>
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-bold text-foreground hover:border-orange-400 hover:text-orange-700"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Đã copy link" : "Copy link ảnh"}
                  <Link2 className="h-3.5 w-3.5 opacity-50" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-border p-4">
            <button
              type="button"
              disabled={downloading}
              onClick={() => void handleDownload()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-bold text-foreground hover:border-orange-400 hover:text-orange-700 disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? "Đang tải…" : "Tải ảnh"}
            </button>
            {onReport ? (
              <button
                type="button"
                onClick={onReport}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2.5 text-xs font-bold text-orange-800 hover:bg-orange-100"
              >
                <Flag className="h-3.5 w-3.5" />
                Báo ảnh sai / không phải tôi
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
