"use client";
import { useOrganizerToastState } from "@/lib/use-organizer-toast-state";
import { useOrganizerErrorState } from "@/lib/use-organizer-error-state";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { getEventById } from "@/api/events";
import {
  getOrganizerDistances,
  replaceEventDistances,
} from "@/api/event-packages";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { getOrganizerStatusLabel, getStatusColor } from "@/lib/format";
import {
  canEditProfile,
  inputToTimeOnly,
  timeOnlyToInput,
} from "../_shared";

type PriceType = {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  price: number;
};

type DistRow = {
  key: string;
  type: string;
  name: string;
  distanceKm: string;
  capacity: number;
  basePrice: number;
  startAt: string;
  endAt: string;
  types: PriceType[];
  pricingOpen: boolean;
};

function parseDistanceKm(raw: string): number {
  const n = Number(String(raw).trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Guid thật từ BE — phân biệt hàng mới (`new-1`, `d-…`). */
function isPersistedDistanceId(key: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    key.trim()
  );
}

type PricingByDistance = {
  byDistanceName?: Record<
    string,
    {
      basePrice?: number;
      types?: Array<Record<string, unknown>>;
      phases?: Array<Record<string, unknown>>;
    }
  >;
  types?: Array<Record<string, unknown>>;
  phases?: Array<Record<string, unknown>>;
};

function loadTypesForDistance(
  pricing: unknown,
  distanceName: string,
  fallbackBase: number
): { basePrice: number; types: PriceType[] } {
  const raw = (pricing || {}) as PricingByDistance;
  const byName = raw.byDistanceName?.[distanceName];
  if (byName) {
    const rows = byName.types?.length ? byName.types : byName.phases || [];
    return {
      basePrice: Number(byName.basePrice ?? fallbackBase) || 0,
      types: rows.map((p, i) => ({
        id: String(p.key || p.id || `type-${i}`),
        name: String(p.name || "Type"),
        dateFrom: String(p.dateFrom || ""),
        dateTo: String(p.dateTo || ""),
        price: Number(p.price ?? 0) || 0,
      })),
    };
  }

  // Legacy matrix: types|phases[].pricesByDistanceName[name]
  const legacy = (raw.types?.length ? raw.types : raw.phases) || [];
  if (legacy.length) {
    const types: PriceType[] = [];
    let basePrice = fallbackBase;
    for (const p of legacy) {
      const key = String(p.key || "");
      const prices =
        (p.pricesByDistanceName as Record<string, number> | undefined) || {};
      const price = Number(prices[distanceName] ?? 0) || 0;
      if (key === "base" || key === "regular") {
        if (price > 0) basePrice = price;
        continue;
      }
      if (price > 0 || p.name) {
        types.push({
          id: key || `legacy-${types.length}`,
          name: String(p.name || key || "Type"),
          dateFrom: String(p.dateFrom || ""),
          dateTo: String(p.dateTo || ""),
          price,
        });
      }
    }
    return { basePrice, types };
  }

  return { basePrice: fallbackBase, types: [] };
}

export default function ProfileDistancesClient() {
  const params = useParams();
  const eventId = String(params?.id || "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useOrganizerErrorState();
  const [toast, setToast] = useOrganizerToastState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<DistRow[]>([]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    const [eventData, distData] = await Promise.all([
      getEventById(eventId),
      getOrganizerDistances(eventId),
    ]);
    setEvent(eventData);
    const mapped: DistRow[] = (distData.distances || []).map((d, i) => {
      const name = d.name || "";
      const parsed = loadTypesForDistance(
        distData.ticketPricing,
        name,
        d.basePrice ?? d.price ?? 0
      );
      return {
        key: d.id || `d-${i}`,
        type: "road",
        name,
        distanceKm:
          d.distanceKm != null && d.distanceKm > 0 ? String(d.distanceKm) : "",
        capacity: d.capacity || 0,
        basePrice: parsed.basePrice,
        startAt: timeOnlyToInput(d.startAt),
        endAt: timeOnlyToInput(d.endAt),
        types: parsed.types,
        pricingOpen: false,
      };
    });
    setRows(
      mapped.length
        ? mapped
        : [
            {
              key: "new-1",
              type: "road",
              name: "5K",
              distanceKm: "5",
              capacity: 100,
              basePrice: 0,
              startAt: "",
              endAt: "",
              types: [],
              pricingOpen: false,
            },
          ]
    );
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled)
          setError(getApiErrorMessage(e, "Không tải được cự ly."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, load]);

  const totalCap = rows.reduce((s, r) => s + (Number(r.capacity) || 0), 0);
  const packageCap = event?.totalRunners || 0;

  const updateRow = (key: string, patch: Partial<DistRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev.map((r) => ({ ...r, pricingOpen: false })),
      {
        key: `new-${Date.now()}`,
        type: "road",
        name: "",
        distanceKm: "10",
        capacity: 100,
        basePrice: 0,
        startAt: "",
        endAt: "",
        types: [],
        pricingOpen: false,
      },
    ]);
  };

  const removeRow = (key: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  /** Accordion: chỉ mở setup giá 1 cự ly — tránh trang dài khi nhiều phase. */
  const togglePricing = (key: string) => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        pricingOpen: r.key === key ? !r.pricingOpen : false,
      }))
    );
  };

  const handleSave = async () => {
    if (!event || saving) return;
    if (
      rows.some(
        (r) => !r.name.trim() || parseDistanceKm(r.distanceKm) <= 0 || r.capacity < 1
      )
    ) {
      setError("Mỗi cự ly cần tên, km > 0 và sức chứa ≥ 1.");
      return;
    }
    if (event.packagePurchaseId && packageCap > 0 && totalCap > packageCap) {
      setError(`Tổng slot cự ly (${totalCap}) vượt quy mô gói (${packageCap}).`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const byDistanceName: Record<
        string,
        { basePrice: number; types: Array<Record<string, unknown>> }
      > = {};
      for (const r of rows) {
        const n = r.name.trim();
        byDistanceName[n] = {
          basePrice: Number(r.basePrice) || 0,
          types: r.types.map((p) => ({
            key: p.id,
            name: p.name,
            dateFrom: p.dateFrom,
            dateTo: p.dateTo,
            price: Number(p.price) || 0,
          })),
        };
      }

      await replaceEventDistances(eventId, {
        distances: rows.map((r) => ({
          ...(isPersistedDistanceId(r.key) ? { id: r.key } : {}),
          name: r.name.trim(),
          distanceKm: parseDistanceKm(r.distanceKm),
          capacity: Number(r.capacity),
          basePrice: Number(r.basePrice) || 0,
          startAt: inputToTimeOnly(r.startAt),
          endAt: inputToTimeOnly(r.endAt),
        })),
        ticketPricing: { byDistanceName },
      });
      await load();
      notify("Đã lưu cự ly và giá vé.");
    } catch (e) {
      setError(getApiErrorMessage(e, "Lưu thất bại."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-4 text-sm text-muted-foreground">{error}</p>
        <Link href="/my-events" className="mt-4 inline-block text-sm font-bold text-orange-600">
          Về danh sách
        </Link>
      </div>
    );
  }

  const editable = canEditProfile(event.status);

  const fmtReg = (iso: string | null | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const opensLabel = fmtReg(event.registrationOpensAtUtc);
  const closesLabel = fmtReg(event.registrationClosesAtUtc);
  const regContextParts: string[] = [];
  if (opensLabel) regContextParts.push(`ĐK mở ${opensLabel}`);
  if (closesLabel) regContextParts.push(`đóng ${closesLabel}`);
  const regContext = regContextParts.length
    ? regContextParts.join(" · ")
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Chi tiết giải
          </p>
          <h1 className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-2xl font-extrabold leading-tight">
            <span>Cự ly &amp; giá vé</span>
            {regContext ? (
              <span
                className="min-w-0 text-[11px] font-medium text-slate-500"
                title={regContext}
              >
                · {regContext}
              </span>
            ) : (
              <Link
                href={`/organizer/events/${eventId}/profile/basic`}
                className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-orange-600 hover:underline"
              >
                · Chưa đặt lịch ĐK — sửa ở Thông tin cơ bản
              </Link>
            )}
          </h1>
          <span
            className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${getStatusColor(event.status)}`}
          >
            {getOrganizerStatusLabel(event.status)}
          </span>
        </div>
        {editable && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu cự ly
          </button>
        )}
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Danh sách cự ly</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tổng slot: <strong>{totalCap}</strong>
              {event.packagePurchaseId ? ` / ${packageCap} (gói)` : null}
              <span className="text-muted-foreground/80">
                {" "}
                · Chỉ mở 1 bảng giá cùng lúc
              </span>
            </p>
          </div>
          {editable && (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm cự ly
            </button>
          )}
        </div>

        <div className="max-h-[min(70vh,720px)] space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]">
          {rows.map((r) => (
            <div
              key={r.key}
              className={`rounded-xl border p-3.5 sm:p-4 ${
                r.pricingOpen
                  ? "border-orange-300/80 bg-orange-50/30"
                  : "border-border/60 bg-background/50"
              }`}
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <LabeledField label="Tên cự ly">
                  <input
                    placeholder="VD: 5K, 10K"
                    value={r.name}
                    disabled={!editable}
                    onChange={(e) => updateRow(r.key, { name: e.target.value })}
                    className={inputClass}
                  />
                </LabeledField>
                <LabeledField label="Quãng đường (km)">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="VD: 3.419 hoặc 42.195"
                    value={r.distanceKm}
                    disabled={!editable}
                    onChange={(e) => {
                      const v = e.target.value.replace(",", ".");
                      if (v !== "" && !/^\d*\.?\d*$/.test(v)) return;
                      updateRow(r.key, { distanceKm: v });
                    }}
                    className={inputClass}
                  />
                </LabeledField>
                <LabeledField label="Sức chứa (slot)">
                  <input
                    type="number"
                    min={1}
                    value={r.capacity || ""}
                    disabled={!editable}
                    onChange={(e) =>
                      updateRow(r.key, { capacity: Number(e.target.value) || 0 })
                    }
                    className={inputClass}
                  />
                </LabeledField>
                <LabeledField label="Giờ xuất phát">
                  <input
                    type="time"
                    value={r.startAt}
                    disabled={!editable}
                    onChange={(e) => updateRow(r.key, { startAt: e.target.value })}
                    className={inputClass}
                  />
                </LabeledField>
                <LabeledField label="Giờ kết thúc / cutoff">
                  <input
                    type="time"
                    value={r.endAt}
                    disabled={!editable}
                    onChange={(e) => updateRow(r.key, { endAt: e.target.value })}
                    className={inputClass}
                  />
                </LabeledField>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePricing(r.key)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {r.pricingOpen
                    ? "Đóng giá"
                    : editable
                      ? "Setup giá"
                      : "Xem giá"}
                  {r.basePrice > 0
                    ? ` · ${r.basePrice.toLocaleString("vi-VN")}đ`
                    : ""}
                  {r.types.length > 0 ? ` · ${r.types.length} type` : ""}
                </button>
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeRow(r.key)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xóa
                  </button>
                )}
              </div>

              {r.pricingOpen && (
                <div className="mt-3 rounded-xl border border-orange-200/80 bg-white/80 p-3 sm:p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {editable ? "Setup giá" : "Chi tiết giá"} —{" "}
                        {r.name || "cự ly"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Fallback ngoài type · Early bird ưu tiên khi trùng ngày.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePricing(r.key)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-muted"
                      aria-label="Đóng"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <LabeledField label="Giá fallback (VND)">
                    <input
                      type="number"
                      min={0}
                      value={r.basePrice || ""}
                      disabled={!editable}
                      onChange={(e) =>
                        updateRow(r.key, {
                          basePrice: Number(e.target.value) || 0,
                        })
                      }
                      className={`${inputClass} max-w-xs`}
                    />
                  </LabeledField>

                  <div className="mt-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Type theo ngày ({r.types.length})
                      </p>
                      {editable && (
                        <button
                          type="button"
                          onClick={() =>
                            updateRow(r.key, {
                              types: [
                                ...r.types,
                                {
                                  id: `type-${Date.now()}`,
                                  name: "Early Bird",
                                  dateFrom: "",
                                  dateTo: "",
                                  price: Math.max(0, r.basePrice - 50000),
                                },
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-orange-300 px-2.5 py-1 text-[11px] font-bold text-orange-600 hover:bg-orange-50"
                        >
                          <Plus className="h-3 w-3" /> Thêm type
                        </button>
                      )}
                    </div>

                    {r.types.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Chưa có type — dùng giá fallback.
                      </p>
                    ) : (
                      <div className="max-h-56 space-y-2 overflow-y-auto overscroll-contain pr-0.5 sm:max-h-64">
                        {r.types.map((p, pi) => (
                          <div
                            key={p.id}
                            className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 sm:grid-cols-5"
                          >
                            <LabeledField label="Tên">
                              <input
                                value={p.name}
                                disabled={!editable}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateRow(r.key, {
                                    types: r.types.map((x, i) =>
                                      i === pi ? { ...x, name: v } : x
                                    ),
                                  });
                                }}
                                className={inputClass}
                                placeholder="Early Bird"
                              />
                            </LabeledField>
                            <LabeledField label="Từ">
                              <input
                                type="date"
                                value={p.dateFrom}
                                disabled={!editable}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateRow(r.key, {
                                    types: r.types.map((x, i) =>
                                      i === pi ? { ...x, dateFrom: v } : x
                                    ),
                                  });
                                }}
                                className={inputClass}
                              />
                            </LabeledField>
                            <LabeledField label="Đến">
                              <input
                                type="date"
                                value={p.dateTo}
                                disabled={!editable}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateRow(r.key, {
                                    types: r.types.map((x, i) =>
                                      i === pi ? { ...x, dateTo: v } : x
                                    ),
                                  });
                                }}
                                className={inputClass}
                              />
                            </LabeledField>
                            <LabeledField label="Giá">
                              <input
                                type="number"
                                min={0}
                                value={p.price || ""}
                                disabled={!editable}
                                onChange={(e) => {
                                  const v = Number(e.target.value) || 0;
                                  updateRow(r.key, {
                                    types: r.types.map((x, i) =>
                                      i === pi ? { ...x, price: v } : x
                                    ),
                                  });
                                }}
                                className={inputClass}
                              />
                            </LabeledField>
                            {editable && (
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateRow(r.key, {
                                      types: r.types.filter((_, i) => i !== pi),
                                    })
                                  }
                                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20";
