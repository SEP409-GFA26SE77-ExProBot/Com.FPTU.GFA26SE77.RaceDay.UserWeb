"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, Hash, Loader2, Save } from "lucide-react";
import { getEventById } from "@/api/events";
import { updateEventProfile } from "@/api/event-packages";
import EventProfileSectionHeader from "@/components/organizer/EventProfileSectionHeader";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { toastError, toastSuccess } from "@/lib/toast";
import { statusKey } from "../_shared";

function canEditBib(status: string) {
  const k = statusKey(status);
  return (
    k === "draft" ||
    k === "rejected" ||
    k === "approved" ||
    k === "registration-open" ||
    k === "closed"
  );
}

export default function ProfileBibClient() {
  const params = useParams();
  const eventId = String(params?.id || "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [rangeStart, setRangeStart] = useState("1001");
  const [rangeEnd, setRangeEnd] = useState("");

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getEventById(eventId);
        if (cancelled) return;
        setEvent(data);
        setPrefix(data.bibPrefix || "");
        setRangeStart(
          data.bibRangeStart != null ? String(data.bibRangeStart) : "1001"
        );
        setRangeEnd(
          data.bibRangeEnd != null ? String(data.bibRangeEnd) : ""
        );
        setError(null);
      } catch (e) {
        if (!cancelled)
          setError(getApiErrorMessage(e, "Không tải được cấu hình BIB."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const preview = useMemo(() => {
    const p = prefix.trim().toUpperCase();
    const start = Number(rangeStart) || 1001;
    const end = rangeEnd.trim() ? Number(rangeEnd) : null;
    const samples = [start, start + 1, start + 2].map((n) =>
      p ? `${p}${n}` : String(n)
    );
    return { p, start, end, samples };
  }, [prefix, rangeStart, rangeEnd]);

  const handleSave = async () => {
    if (!event || saving) return;
    const start = Number(rangeStart);
    if (!Number.isFinite(start) || start < 1) {
      toastError("Số bắt đầu phải ≥ 1.");
      return;
    }
    let end: number | null = null;
    if (rangeEnd.trim()) {
      end = Number(rangeEnd);
      if (!Number.isFinite(end) || end < 1) {
        toastError("Số kết thúc phải ≥ 1.");
        return;
      }
      if (end < start) {
        toastError("Số kết thúc phải ≥ số bắt đầu.");
        return;
      }
    }
    const p = prefix.trim().toUpperCase();
    if (p && !/^[A-Z0-9]+-?$/.test(p)) {
      toastError("Prefix chỉ gồm A–Z, 0–9, có thể kết thúc bằng '-'.");
      return;
    }
    if (p.length > 12) {
      toastError("Prefix tối đa 12 ký tự.");
      return;
    }

    setSaving(true);
    try {
      await updateEventProfile(eventId, {
        setBibConfig: true,
        bibPrefix: p || null,
        bibRangeStart: start,
        bibRangeEnd: end,
      });
      const refreshed = await getEventById(eventId);
      setEvent(refreshed);
      toastSuccess("Đã lưu cấu hình BIB.");
    } catch (e) {
      toastError(e, "Lưu cấu hình BIB thất bại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-4 text-sm text-muted-foreground">{error}</p>
        <Link
          href="/my-events"
          className="mt-4 inline-block text-sm font-bold text-orange-600"
        >
          Về danh sách
        </Link>
      </div>
    );
  }

  const editable = canEditBib(event.status);
  const cap = event.totalRunners || 0;

  return (
    <div className="space-y-6">
      <EventProfileSectionHeader
        eventId={eventId}
        eventName={event.name}
        status={event.status}
        title="Cấu hình BIB"
        description={
          <span>
            BIB độc lập theo giải. Khi duyệt đăng ký, hệ thống cấp tiếp theo trong
            dải (vd. {preview.samples[0]}). Check-in / vé vẫn dùng chuỗi BIB đầy
            đủ.
          </span>
        }
        actions={
          editable ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu BIB
            </button>
          ) : undefined
        }
      />

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Hash className="h-4 w-4 text-orange-500" />
          Prefix &amp; dải số
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1 text-xs sm:col-span-1">
            <span className="font-semibold text-muted-foreground">Prefix</span>
            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              disabled={!editable}
              placeholder="VD: HCM26-"
              maxLength={12}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold tracking-wide disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>
          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground">Từ số</span>
            <input
              type="number"
              min={1}
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              disabled={!editable}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>
          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-muted-foreground">
              Đến số (tuỳ chọn)
            </span>
            <input
              type="number"
              min={1}
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              disabled={!editable}
              placeholder={cap > 0 ? String(preview.start + cap - 1) : "Không giới hạn"}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Để trống prefix → BIB chỉ là số (1001, 1002…). Có prefix →{" "}
          <strong className="text-foreground">{preview.samples.join(", ")}</strong>
          {preview.end
            ? ` · Dải tối đa tới ${preview.p}${preview.end}`
            : ""}
          {cap > 0
            ? ` · Quy mô gói/giải ~${cap.toLocaleString("vi-VN")} VĐV`
            : ""}
          .
        </p>
      </section>
    </div>
  );
}
