"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { mediaDisplayUrl } from "@/lib/media-url";

const REASON_PRESETS = [
  { id: "wrong_bib", label: "BIB trên ảnh không phải của tôi" },
  { id: "not_me", label: "Không phải tôi trong ảnh" },
  { id: "privacy", label: "Muốn gỡ ảnh vì lý do riêng tư" },
  { id: "other", label: "Lý do khác" },
] as const;

export type PhotoDisputeModalProps = {
  open: boolean;
  photoUrl: string;
  photoId: string;
  bibHint?: string;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
};

export default function PhotoDisputeModal({
  open,
  photoUrl,
  photoId,
  bibHint,
  busy = false,
  onClose,
  onSubmit,
}: PhotoDisputeModalProps) {
  const [preset, setPreset] = useState<(typeof REASON_PRESETS)[number]["id"]>(
    "wrong_bib"
  );
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPreset("wrong_bib");
    setNote("");
    setLocalError(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose, photoId]);

  if (!open) return null;

  const src = mediaDisplayUrl(photoUrl);
  const presetLabel =
    REASON_PRESETS.find((p) => p.id === preset)?.label || "";

  const buildReason = () => {
    const extra = note.trim();
    if (preset === "other") {
      if (extra.length < 8) return null;
      return extra;
    }
    return extra ? `${presetLabel}. ${extra}` : presetLabel;
  };

  const handleSubmit = async () => {
    const reason = buildReason();
    if (!reason) {
      setLocalError(
        preset === "other"
          ? "Nhập lý do chi tiết (ít nhất 8 ký tự)."
          : "Chọn lý do khiếu nại."
      );
      return;
    }
    setLocalError(null);
    await onSubmit(reason);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-dispute-title"
      onClick={() => !busy && onClose()}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-orange-500 to-red-600" />

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500">
              Khiếu nại ảnh
            </p>
            <h2 id="photo-dispute-title" className="text-lg font-extrabold">
              Báo cáo vấn đề với ảnh
            </h2>
            {bibHint ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Đang xem theo BIB {bibHint}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* Cover full cột trái, căn giữa — crop đều 2 cạnh thay vì letterbox */}
          <div className="relative aspect-[4/3] bg-zinc-900 md:aspect-auto md:min-h-full">
            {src ? (
              <Image
                src={src}
                alt="Ảnh khiếu nại"
                fill
                className="object-cover object-center"
                sizes="(max-width:768px) 100vw, 55vw"
                unoptimized
              />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center text-zinc-500 md:min-h-[360px]">
                <AlertTriangle className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Lý do + actions — phải */}
          <div className="flex min-h-0 flex-col">
            <div className="space-y-3 overflow-y-auto px-4 py-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold">Lý do</legend>
                <div className="space-y-2">
                  {REASON_PRESETS.map((p) => (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                        preset === p.id
                          ? "border-orange-400 bg-orange-500/10"
                          : "border-border hover:border-orange-300/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="dispute-preset"
                        className="mt-1"
                        checked={preset === p.id}
                        onChange={() => setPreset(p.id)}
                        disabled={busy}
                      />
                      <span className="font-medium">{p.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block space-y-1.5 text-sm">
                <span className="font-bold">
                  {preset === "other"
                    ? "Mô tả chi tiết"
                    : "Ghi chú thêm (tuỳ chọn)"}
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={busy}
                  rows={2}
                  maxLength={1000}
                  placeholder={
                    preset === "other"
                      ? "Mô tả rõ vấn đề…"
                      : "Thêm chi tiết nếu cần…"
                  }
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                />
              </label>

              {localError ? (
                <p role="alert" className="text-sm font-medium text-red-600">
                  {localError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Photographer sẽ nhận khiếu nại và xử lý (duyệt → sửa BIB hoặc
                  từ chối).
                </p>
              )}
            </div>

            <div className="mt-auto flex shrink-0 flex-wrap gap-2 border-t border-border/60 px-4 py-3">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSubmit()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang gửi…
                  </>
                ) : (
                  "Gửi khiếu nại"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
