"use client";

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
import { replaceEventDistances } from "@/api/event-packages";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { getOrganizerStatusLabel, getStatusColor } from "@/lib/format";
import {
  canEditProfile,
  inputToTimeOnly,
  timeOnlyToInput,
} from "../_shared";

type PricePhase = {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  price: number;
};

type DistRow = {
  key: string;
  checked: boolean;
  label: string;
  type: string;
  name: string;
  distanceKm: number;
  capacity: number;
  basePrice: number;
  startAt: string;
  endAt: string;
  phases: PricePhase[];
  pricingOpen: boolean;
};

const FIXED_DISTANCES = [
  { distanceKm: 5, defaultName: "5km", label: "Cự ly 5km" },
  { distanceKm: 10, defaultName: "10km", label: "Cự ly 10km" },
  { distanceKm: 21, defaultName: "21km", label: "Cự ly 21km" },
  { distanceKm: 42, defaultName: "42km", label: "Cự ly 42km" },
] as const;

type PricingByDistance = {
  byDistanceName?: Record<
    string,
    { basePrice?: number; phases?: Array<Record<string, unknown>> }
  >;
  phases?: Array<Record<string, unknown>>;
};

function loadPhasesForDistance(
  pricing: unknown,
  distanceName: string,
  fallbackBase: number
): { basePrice: number; phases: PricePhase[] } {
  const raw = (pricing || {}) as PricingByDistance;
  const byName = raw.byDistanceName?.[distanceName];
  if (byName) {
    return {
      basePrice: Number(byName.basePrice ?? fallbackBase) || 0,
      phases: (byName.phases || []).map((p, i) => ({
        id: String(p.key || p.id || `phase-${i}`),
        name: String(p.name || "Phase"),
        dateFrom: String(p.dateFrom || ""),
        dateTo: String(p.dateTo || ""),
        price: Number(p.price ?? 0) || 0,
      })),
    };
  }

  // Legacy matrix: phases[].pricesByDistanceName[name]
  if (Array.isArray(raw.phases) && raw.phases.length) {
    const phases: PricePhase[] = [];
    let basePrice = fallbackBase;
    for (const p of raw.phases) {
      const key = String(p.key || "");
      const prices =
        (p.pricesByDistanceName as Record<string, number> | undefined) || {};
      const price = Number(prices[distanceName] ?? 0) || 0;
      if (key === "base" || key === "regular") {
        if (price > 0) basePrice = price;
        continue;
      }
      if (price > 0 || p.name) {
        phases.push({
          id: key || `legacy-${phases.length}`,
          name: String(p.name || key || "Phase"),
          dateFrom: String(p.dateFrom || ""),
          dateTo: String(p.dateTo || ""),
          price,
        });
      }
    }
    return { basePrice, phases };
  }

  return { basePrice: fallbackBase, phases: [] };
}

export default function ProfileDistancesClient() {
  const params = useParams();
  const eventId = String(params?.id || "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<DistRow[]>([]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    const data = await getEventById(eventId);
    setEvent(data);
    const existing = data.distances || [];
    const hasExisting = existing.length > 0;

    const mapped: DistRow[] = FIXED_DISTANCES.map((cfg) => {
      // Find matching distance in existing distances
      const found = existing.find((d) => {
        const km = Number(d.distanceKm);
        if (km === cfg.distanceKm) return true;
        if (Math.abs(km - cfg.distanceKm) < 0.6) return true;
        const n = String(d.name || "").toLowerCase().trim();
        return (
          n === `${cfg.distanceKm}km` ||
          n === `${cfg.distanceKm}k` ||
          n === `${cfg.distanceKm} km`
        );
      });

      if (found) {
        const name = found.name || cfg.defaultName;
        const parsed = loadPhasesForDistance(
          data.ticketPricing,
          name,
          found.price || 0
        );
        return {
          key: found.id || `fixed-${cfg.distanceKm}`,
          checked: true,
          label: cfg.label,
          type: found.type || "road",
          name,
          distanceKm: cfg.distanceKm,
          capacity: found.capacity || 100,
          basePrice: parsed.basePrice,
          startAt: timeOnlyToInput(found.startAt),
          endAt: timeOnlyToInput(found.endAt),
          phases: parsed.phases,
          pricingOpen: false,
        };
      }

      const isDefaultChecked = !hasExisting && cfg.distanceKm === 5;

      return {
        key: `fixed-${cfg.distanceKm}`,
        checked: isDefaultChecked,
        label: cfg.label,
        type: "road",
        name: cfg.defaultName,
        distanceKm: cfg.distanceKm,
        capacity: 100,
        basePrice: 0,
        startAt: "",
        endAt: "",
        phases: [],
        pricingOpen: false,
      };
    });

    setRows(mapped);
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

  const checkedRows = rows.filter((r) => r.checked);
  const totalCap = checkedRows.reduce((s, r) => s + (Number(r.capacity) || 0), 0);
  const packageCap = event?.totalRunners || 0;

  const updateRow = (key: string, patch: Partial<DistRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    if (!event || saving) return;

    const checkedRows = rows.filter((r) => r.checked);
    if (checkedRows.length === 0) {
      setError("Vui lòng chọn ít nhất một cự ly để lưu.");
      return;
    }
    if (checkedRows.some((r) => !r.name.trim() || r.distanceKm <= 0 || r.capacity < 1)) {
      setError("Mỗi cự ly được chọn cần tên, km > 0 và sức chứa ≥ 1.");
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
        { basePrice: number; phases: Array<Record<string, unknown>> }
      > = {};
      for (const r of checkedRows) {
        const n = r.name.trim();
        byDistanceName[n] = {
          basePrice: Number(r.basePrice) || 0,
          phases: r.phases.map((p) => ({
            key: p.id,
            name: p.name,
            dateFrom: p.dateFrom,
            dateTo: p.dateTo,
            price: Number(p.price) || 0,
          })),
        };
      }

      await replaceEventDistances(eventId, {
        distances: checkedRows.map((r) => ({
          type: r.type || "road",
          name: r.name.trim(),
          distanceKm: Number(r.distanceKm),
          capacity: Number(r.capacity),
          price: Number(r.basePrice) || 0,
          currency: "VND",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Chi tiết giải
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">Cự ly &amp; giá vé</h1>
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">Danh sách cự ly</h2>
            <p className="text-xs text-muted-foreground">
              Chọn các cự ly áp dụng cho giải (5km, 10km, 21km, 42km). Chỉ cự ly được tích chọn mới được cập nhật lên hệ thống.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Đã chọn: <strong className="text-foreground">{checkedRows.length}/4</strong> cự ly · Tổng slot:{" "}
            <strong className="text-foreground">{totalCap}</strong>
            {event.packagePurchaseId ? ` / ${packageCap} (gói)` : null}
          </p>
        </div>

        <div className="space-y-4">
          {rows.map((r) => {
            const isChecked = r.checked;
            const isFieldDisabled = !editable || !isChecked;

            return (
              <div
                key={r.key}
                className={`rounded-xl border transition-all ${
                  isChecked
                    ? "border-border/80 bg-background/80 p-4 shadow-sm"
                    : "border-border/40 bg-muted/20 p-4 opacity-60"
                }`}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!editable}
                      onChange={(e) =>
                        updateRow(r.key, { checked: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isChecked ? "text-foreground" : "text-muted-foreground"}`}>
                        {r.label}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          isChecked
                            ? "bg-orange-50 text-orange-700 border border-orange-200"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {isChecked ? "Đã chọn" : "Chưa chọn"}
                      </span>
                    </div>
                  </label>

                  {isChecked && (
                    <button
                      type="button"
                      onClick={() =>
                        updateRow(r.key, { pricingOpen: !r.pricingOpen })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      {r.pricingOpen
                        ? "Đóng setup giá"
                        : editable
                          ? "Setup giá"
                          : "Xem giá / phase"}
                      {r.basePrice > 0
                        ? ` · ${r.basePrice.toLocaleString("vi-VN")}đ`
                        : ""}
                      {r.phases.length > 0 ? ` · ${r.phases.length} phase` : ""}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <LabeledField label="Tên cự ly">
                    <input
                      placeholder="VD: 5km, 10km"
                      value={r.name}
                      disabled={isFieldDisabled}
                      onChange={(e) => updateRow(r.key, { name: e.target.value })}
                      className={inputClass}
                    />
                  </LabeledField>
                  <LabeledField label="Quãng đường (km)">
                    <input
                      type="number"
                      value={r.distanceKm}
                      disabled={true}
                      readOnly
                      className={`${inputClass} bg-muted/50 cursor-not-allowed font-medium`}
                    />
                  </LabeledField>
                  <LabeledField label="Sức chứa (slot)">
                    <input
                      type="number"
                      min={1}
                      value={r.capacity || ""}
                      disabled={isFieldDisabled}
                      onChange={(e) =>
                        updateRow(r.key, {
                          capacity: Number(e.target.value) || 0,
                        })
                      }
                      className={inputClass}
                    />
                  </LabeledField>
                  <LabeledField label="Giờ xuất phát">
                    <input
                      type="time"
                      value={r.startAt}
                      disabled={isFieldDisabled}
                      onChange={(e) =>
                        updateRow(r.key, { startAt: e.target.value })
                      }
                      className={inputClass}
                    />
                  </LabeledField>
                  <LabeledField label="Giờ kết thúc / cutoff">
                    <input
                      type="time"
                      value={r.endAt}
                      disabled={isFieldDisabled}
                      onChange={(e) => updateRow(r.key, { endAt: e.target.value })}
                      className={inputClass}
                    />
                  </LabeledField>
                </div>

                {isChecked && r.pricingOpen && (
                  <div className="mt-4 rounded-xl border border-orange-200/80 bg-orange-50/40 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {editable ? "Setup giá" : "Chi tiết giá"} —{" "}
                          {r.name || "cự ly"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {editable
                            ? "Giá fallback khi ngoài mọi đợt phase. Có Regular rồi thì Regular lo cửa sổ thường; Early bird ưu tiên khi còn trong ngày."
                            : "Chỉ xem — hồ sơ đã duyệt / mở ĐK không sửa giá."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateRow(r.key, { pricingOpen: false })}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-white"
                        aria-label="Đóng"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <LabeledField label="Giá fallback / ngoài đợt (VND)">
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
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Không thay Early bird. Nếu đã có phase Regular cùng mức này thì OK — fallback chỉ khi hết mọi cửa sổ phase.
                    </p>

                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Đợt giá theo ngày (phase)
                      </p>
                      {r.phases.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Chưa có phase — dùng giá fallback.
                        </p>
                      )}
                      {r.phases.map((p, pi) => (
                        <div
                          key={p.id}
                          className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 bg-white p-3 sm:grid-cols-5"
                        >
                          <LabeledField label="Tên phase">
                            <input
                              value={p.name}
                              disabled={!editable}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateRow(r.key, {
                                  phases: r.phases.map((x, i) =>
                                    i === pi ? { ...x, name: v } : x
                                  ),
                                });
                              }}
                              className={inputClass}
                              placeholder="Early Bird"
                            />
                          </LabeledField>
                          <LabeledField label="Từ ngày">
                            <input
                              type="date"
                              value={p.dateFrom}
                              disabled={!editable}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateRow(r.key, {
                                  phases: r.phases.map((x, i) =>
                                    i === pi ? { ...x, dateFrom: v } : x
                                  ),
                                });
                              }}
                              className={inputClass}
                            />
                          </LabeledField>
                          <LabeledField label="Đến ngày">
                            <input
                              type="date"
                              value={p.dateTo}
                              disabled={!editable}
                              onChange={(e) => {
                                const v = e.target.value;
                                updateRow(r.key, {
                                  phases: r.phases.map((x, i) =>
                                    i === pi ? { ...x, dateTo: v } : x
                                  ),
                                });
                              }}
                              className={inputClass}
                            />
                          </LabeledField>
                          <LabeledField label="Giá (VND)">
                            <input
                              type="number"
                              min={0}
                              value={p.price || ""}
                              disabled={!editable}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                updateRow(r.key, {
                                  phases: r.phases.map((x, i) =>
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
                                    phases: r.phases.filter((_, i) => i !== pi),
                                  })
                                }
                                className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Xóa
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {editable && (
                        <button
                          type="button"
                          onClick={() =>
                            updateRow(r.key, {
                              phases: [
                                ...r.phases,
                                {
                                  id: `phase-${Date.now()}`,
                                  name: "Early Bird",
                                  dateFrom: "",
                                  dateTo: "",
                                  price: Math.max(0, r.basePrice - 50000),
                                },
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-orange-300 px-3 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50"
                        >
                          <Plus className="h-3.5 w-3.5" /> Thêm phase giá
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
