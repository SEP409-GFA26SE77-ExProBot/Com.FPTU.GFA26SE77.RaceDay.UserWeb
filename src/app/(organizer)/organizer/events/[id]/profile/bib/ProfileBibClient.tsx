"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Hash,
  Loader2,
  Route,
  Save,
} from "lucide-react";
import { getEventById } from "@/api/events";
import { replaceEventBibConfigs } from "@/api/event-packages";
import EventProfileSectionHeader from "@/components/organizer/EventProfileSectionHeader";
import type { EventDistanceDto, RaceEventDto } from "@/dto/event.dto";
import {
  formatBibPreview,
  parseBibSequenceInput,
  suggestBibPrefix,
} from "@/lib/distance-types";
import { getApiErrorMessage } from "@/lib/error";
import { toastError, toastSuccess } from "@/lib/toast";
import { statusKey } from "../_shared";

type BibRow = {
  distanceId: string;
  name: string;
  type: string;
  distanceKm: number;
  capacity: number;
  prefix: string;
  rangeStart: string;
  rangeEnd: string;
};

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

function toRow(d: EventDistanceDto): BibRow {
  const type = d.type || "OTHER";
  const hasSaved =
    d.bibRangeStart != null &&
    d.bibRangeStart > 0 &&
    d.bibRangeEnd != null &&
    d.bibRangeEnd > 0;
  return {
    distanceId: d.id,
    name: d.name || type,
    type,
    distanceKm: d.distanceKm || 0,
    capacity: d.capacity || 0,
    prefix: hasSaved
      ? (d.bibPrefix || "").toUpperCase()
      : suggestBibPrefix(type, d.distanceKm),
    rangeStart: hasSaved ? String(d.bibRangeStart) : "",
    rangeEnd: hasSaved ? String(d.bibRangeEnd) : "",
  };
}

function NoDistanceEmpty({ eventId }: { eventId: string }) {
  const distancesHref = `/organizer/events/${eventId}/profile/distances`;

  return (
    <div className="relative flex min-h-[420px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% 40%, rgba(249,115,22,0.12), transparent 70%),
            linear-gradient(135deg, rgba(249,115,22,0.04) 0%, transparent 45%, rgba(220,38,38,0.05) 100%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 27px,
              rgba(148,163,184,0.08) 27px,
              rgba(148,163,184,0.08) 28px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 27px,
              rgba(148,163,184,0.08) 27px,
              rgba(148,163,184,0.08) 28px
            )
          `,
        }}
      />

      <div className="relative z-[1] flex w-full flex-col items-center justify-center gap-5 px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/25">
          <Hash className="h-8 w-8" strokeWidth={1.75} />
        </div>

        <div className="max-w-md space-y-2">
          <h2 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
            Chưa thể cấu hình BIB
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cần ít nhất một cự ly (km + sức chứa) trước khi gắn prefix và dải số
            BIB theo từng cự ly.
          </p>
        </div>

        <ol className="flex w-full max-w-sm flex-col gap-2 text-left text-xs sm:text-sm">
          <li className="flex items-start gap-3 rounded-xl border border-orange-200/80 bg-orange-50/80 px-3.5 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
              1
            </span>
            <span className="pt-0.5 text-foreground/90">
              Thêm cự ly tại <strong>Cự ly &amp; giá vé</strong>
            </span>
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
              2
            </span>
            <span className="pt-0.5 text-muted-foreground">
              Quay lại đây gán prefix + dải số cho từng cự ly
            </span>
          </li>
        </ol>

        <Link
          href={distancesHref}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-105"
        >
          <Route className="h-4 w-4" />
          Đi tới Cự ly &amp; giá vé
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function ProfileBibClient() {
  const params = useParams();
  const eventId = String(params?.id || "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<BibRow[]>([]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getEventById(eventId);
        if (cancelled) return;
        setEvent(data);
        setRows((data.distances || []).map(toRow));
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

  const packageCap = event?.totalRunners || 0;

  const summary = useMemo(() => {
    let totalSlots = 0;
    let totalCapacity = 0;
    const parsed: Array<{
      id: string;
      name: string;
      start: number;
      end: number;
      size: number;
      capacity: number;
    }> = [];

    for (const r of rows) {
      totalCapacity += r.capacity;
      const start = parseBibSequenceInput(r.rangeStart);
      const end = parseBibSequenceInput(r.rangeEnd);
      if (start == null || end == null) continue;
      const size = end >= start ? end - start + 1 : 0;
      totalSlots += size;
      parsed.push({
        id: r.distanceId,
        name: r.name,
        start,
        end,
        size,
        capacity: r.capacity,
      });
    }

    return { totalSlots, totalCapacity, parsed };
  }, [rows]);

  const updateRow = (distanceId: string, patch: Partial<BibRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.distanceId === distanceId ? { ...r, ...patch } : r))
    );
  };

  const validateClient = (): string | null => {
    if (rows.length === 0) return "Chưa có cự ly.";

    const ranges: Array<{ name: string; start: number; end: number }> = [];

    for (const r of rows) {
      const p = r.prefix.trim().toUpperCase();
      if (p && !/^[A-Z0-9]+-?$/.test(p)) {
        return `Prefix «${r.name}» chỉ gồm A–Z, 0–9, có thể kết thúc bằng '-'.`;
      }
      if (p.length > 12) return `Prefix «${r.name}» tối đa 12 ký tự.`;

      const start = parseBibSequenceInput(r.rangeStart);
      const end = parseBibSequenceInput(r.rangeEnd);
      if (start == null) {
        return `Từ số «${r.name}» phải là 0001–9999 (không được 0).`;
      }
      if (end == null) {
        return `Đến số «${r.name}» phải là 0001–9999 (không được 0).`;
      }
      if (end < start) {
        return `Đến số «${r.name}» phải ≥ từ số.`;
      }
      const size = end - start + 1;
      if (r.capacity > 0 && size !== r.capacity) {
        return size > r.capacity
          ? `Dải BIB «${r.name}» có ${size} số — vượt sức chứa ${r.capacity}.`
          : `Dải BIB «${r.name}» chỉ ${size} số nhưng sức chứa ${r.capacity}.`;
      }
      ranges.push({ name: r.name, start, end });
    }

    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i];
        const b = ranges[j];
        if (a.start <= b.end && b.start <= a.end) {
          return `Dải BIB trùng giữa «${a.name}» và «${b.name}».`;
        }
      }
    }

    const totalSlots = ranges.reduce((s, x) => s + (x.end - x.start + 1), 0);
    if (packageCap > 0 && totalSlots > packageCap) {
      return `Tổng dải BIB (${totalSlots}) vượt quy mô gói/giải (${packageCap}).`;
    }

    return null;
  };

  const handleSave = async () => {
    if (!event || saving) return;
    const problem = validateClient();
    if (problem) {
      toastError(problem);
      return;
    }

    setSaving(true);
    try {
      await replaceEventBibConfigs(
        eventId,
        rows.map((r) => ({
          distanceId: r.distanceId,
          bibPrefix: r.prefix.trim().toUpperCase() || null,
          bibRangeStart: parseBibSequenceInput(r.rangeStart)!,
          bibRangeEnd: parseBibSequenceInput(r.rangeEnd)!,
        }))
      );
      const refreshed = await getEventById(eventId);
      setEvent(refreshed);
      setRows((refreshed.distances || []).map(toRow));
      toastSuccess("Đã lưu cấu hình BIB theo cự ly.");
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
  const noDistances = rows.length === 0;
  const overPackage =
    packageCap > 0 && summary.totalSlots > packageCap && summary.parsed.length > 0;

  return (
    <div className="space-y-6">
      <EventProfileSectionHeader
        eventId={eventId}
        eventName={event.name}
        status={event.status}
        title="Cấu hình BIB"
        description={
          <span>
            Mỗi cự ly một dải số 4 chữ số (1 → 0001). Prefix gợi ý theo type
            (15 / 21 / 42…) — có thể sửa hoặc để trống. Khi duyệt ĐK, hệ thống cấp
            tiếp theo trong dải của cự ly đó.
          </span>
        }
        actions={
          editable && !noDistances ? (
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

      {noDistances ? (
        <NoDistanceEmpty eventId={eventId} />
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
            <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 font-semibold text-foreground">
              Tổng sức chứa cự ly: {summary.totalCapacity.toLocaleString("vi-VN")}
            </span>
            <span
              className={`rounded-full border px-3 py-1.5 font-semibold ${
                overPackage
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-border/70 bg-muted/40 text-foreground"
              }`}
            >
              Tổng dải BIB: {summary.totalSlots.toLocaleString("vi-VN")}
              {packageCap > 0
                ? ` / quy mô gói ${packageCap.toLocaleString("vi-VN")}`
                : ""}
            </span>
          </div>

          <section className="space-y-3">
            {rows.map((r) => {
              const start = parseBibSequenceInput(r.rangeStart);
              const end = parseBibSequenceInput(r.rangeEnd);
              const size =
                start != null && end != null && end >= start
                  ? end - start + 1
                  : null;
              const mismatch =
                size != null && r.capacity > 0 && size !== r.capacity;
              const preview =
                start != null
                  ? [
                      formatBibPreview(r.prefix, start),
                      formatBibPreview(r.prefix, start + 1),
                      formatBibPreview(r.prefix, start + 2),
                    ].join(", ")
                  : null;

              return (
                <div
                  key={r.distanceId}
                  className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-5"
                >
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {r.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.type}
                        {r.distanceKm > 0 ? ` · ${r.distanceKm} km` : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        mismatch
                          ? "bg-red-50 text-red-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      Sức chứa {r.capacity.toLocaleString("vi-VN")}
                      {size != null
                        ? ` · dải ${size.toLocaleString("vi-VN")} số`
                        : ""}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block space-y-1 text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Prefix
                      </span>
                      <input
                        value={r.prefix}
                        onChange={(e) =>
                          updateRow(r.distanceId, {
                            prefix: e.target.value.toUpperCase(),
                          })
                        }
                        disabled={!editable}
                        placeholder={suggestBibPrefix(r.type, r.distanceKm) || "VD: 15"}
                        maxLength={12}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold tracking-wide disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </label>
                    <label className="block space-y-1 text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Từ số
                      </span>
                      <input
                        inputMode="numeric"
                        value={r.rangeStart}
                        onChange={(e) =>
                          updateRow(r.distanceId, {
                            rangeStart: e.target.value.replace(/\D/g, "").slice(0, 4),
                          })
                        }
                        disabled={!editable}
                        placeholder="0001"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm tabular-nums disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </label>
                    <label className="block space-y-1 text-xs">
                      <span className="font-semibold text-muted-foreground">
                        Đến số
                      </span>
                      <input
                        inputMode="numeric"
                        value={r.rangeEnd}
                        onChange={(e) =>
                          updateRow(r.distanceId, {
                            rangeEnd: e.target.value.replace(/\D/g, "").slice(0, 4),
                          })
                        }
                        disabled={!editable}
                        placeholder={
                          r.capacity > 0 && start != null
                            ? String(Math.min(9999, start + r.capacity - 1)).padStart(
                                4,
                                "0"
                              )
                            : "0020"
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm tabular-nums disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                      />
                    </label>
                  </div>

                  {preview ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Ví dụ cấp phát:{" "}
                      <strong className="text-foreground">{preview}</strong>
                      {end != null
                        ? ` · tối đa ${formatBibPreview(r.prefix, end)}`
                        : ""}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Nhập từ số / đến số (1–9999). Để trống prefix → chỉ số
                      thuần.
                    </p>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}
