"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronRight, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { getEventById } from "@/api/events";
import { getOrganizerDistances, replaceEventDistances } from "@/api/event-packages";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { getOrganizerStatusLabel, getStatusColor } from "@/lib/format";
import { useOrganizerToastState } from "@/lib/use-organizer-toast-state";
import { canEditProfile } from "../_shared";
import {
  buildDistancesPayload,
  addSharedPriceType,
  createDistanceRows,
  getPriceTypeError,
  getPriceTypeDateError,
  requiresRegularDates,
  removeSharedPriceType,
  updateSharedPriceType,
  validateDistanceRows,
  type DistanceRow,
  type PriceType,
} from "./distances-form";

export default function ProfileDistancesClient() {
  const params = useParams();
  const eventId = String(params?.id || "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [rows, setRows] = useState<DistanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, notify] = useOrganizerToastState<string | null>(null);

  const fetchSetup = useCallback(async () => {
    const [metadata, detail] = await Promise.all([
      getEventById(eventId),
      getOrganizerDistances(eventId),
    ]);
    return {
      event: { ...metadata, status: detail.status },
      rows: createDistanceRows(detail),
    };
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;
    if (!eventId) return;
    void fetchSetup().then((setup) => {
      if (!cancelled) {
        setEvent(setup.event);
        setRows(setup.rows);
        setError(null);
      }
    }).catch((e: unknown) => {
      if (!cancelled) setError(getApiErrorMessage(e, "Không tải được cự ly và giá vé."));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [eventId, fetchSetup]);

  const editable = !!event && canEditProfile(event.status);
  const disabled = !editable || saving;
  const selected = rows.filter((r) => r.selected);
  const totalCapacity = selected.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
  const packageCap = event?.packagePurchaseId ? event.totalRunners : undefined;
  const updateRow = (distanceKm: number, patch: Partial<DistanceRow>) => {
    setRows((previous) => previous.map((r) => r.distanceKm === distanceKm ? { ...r, ...patch } : r));
  };
  const sharedTypes = rows[0]?.types ?? [];
  const regularDatesRequired = requiresRegularDates(sharedTypes);
  const updateType = (index: number, patch: Partial<Omit<PriceType, "price">>) => {
    setRows((previous) => updateSharedPriceType(previous, index, patch));
  };
  const updatePrice = (row: DistanceRow, index: number, price: string) => {
    updateRow(row.distanceKm, { types: row.types.map((t, i) => i === index ? { ...t, price } : t) });
  };

  const handleSave = async () => {
    if (!editable || saving) return;
    const validation = validateDistanceRows(rows, packageCap);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await replaceEventDistances(eventId, buildDistancesPayload(rows));
      notify("Đã lưu cự ly và giá vé.");
      try {
        const setup = await fetchSetup();
        setEvent(setup.event);
        setRows(setup.rows);
      } catch (e) {
        // Reload before allowing another save, so new rows cannot be recreated without IDs.
        setEvent(null);
        setError(getApiErrorMessage(e, "Đã lưu nhưng không tải lại được dữ liệu. Vui lòng tải lại trang."));
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "Không lưu được cự ly và giá vé."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      <p className="mt-3 text-sm text-muted-foreground">Đang tải cự ly và giá vé…</p>
    </div>
  );

  if (!event) return (
    <div className="space-y-4 py-16 text-center" role="alert">
      <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
      <p className="text-sm text-red-600">{error || "Không tải được dữ liệu."}</p>
      <button type="button" onClick={() => window.location.reload()} className="mr-4 text-sm font-bold text-orange-600">Tải lại</button>
      <Link href="/my-events" className="text-sm font-bold text-orange-600">Về danh sách</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Chi tiết giải</p>
          <h1 className="mt-1 text-2xl font-extrabold">Cự ly &amp; giá vé</h1>
          <span className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${getStatusColor(event.status)}`}>
            {getOrganizerStatusLabel(event.status)}
          </span>
        </div>
        {editable && (
          <button type="button" disabled={saving} onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Đang lưu…" : "Lưu cự ly & giá vé"}
          </button>
        )}
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
      </div>}
      {!editable && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Chỉ có thể chỉnh sửa khi giải ở trạng thái nháp hoặc bị từ chối.</p>}

      <section aria-labelledby="distances-heading" className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h2 id="distances-heading" className="text-lg font-bold">Cự ly</h2>
          <p className="mt-1 text-sm text-muted-foreground">Chọn cự ly để mở thông tin thiết lập. Bỏ chọn để loại cự ly khi lưu.</p>
          <p className="mt-2 text-xs text-muted-foreground">Tổng sức chứa: <strong>{totalCapacity.toLocaleString("vi-VN")}</strong>{packageCap ? ` / ${packageCap.toLocaleString("vi-VN")} VĐV (gói)` : " VĐV"}</p>
        </div>
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.distanceKm} className={`overflow-hidden rounded-xl border ${row.selected ? "border-orange-200 bg-orange-50/20" : "border-border bg-muted/30"}`}>
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                <input type="checkbox" checked={row.selected} disabled={disabled || row.registeredCount > 0}
                  aria-controls={`distance-${row.distanceKm}`} aria-expanded={row.selected}
                  onChange={(e) => updateRow(row.distanceKm, { selected: e.target.checked })}
                  className="h-4 w-4 accent-orange-600" />
                <span className="font-bold">{row.distanceKm} km</span>
                <span className="ml-auto text-xs text-muted-foreground">{row.registeredCount > 0 ? `${row.registeredCount} VĐV đã đăng ký · Không thể bỏ chọn` : row.selected ? "Đã chọn" : "Chưa chọn"}</span>
                {row.selected ? <ChevronDown className="h-4 w-4 text-orange-600" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </label>
              {row.selected && (
                <div id={`distance-${row.distanceKm}`} className="grid grid-cols-1 gap-3 border-t border-orange-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Tên cự ly"><input value={row.name} maxLength={100} disabled={disabled} onChange={(e) => updateRow(row.distanceKm, { name: e.target.value })} className={inputClass} /></Field>
                  <Field label="Sức chứa (VĐV)"><input type="number" min={Math.max(1, row.registeredCount)} max={500000} step={1} value={row.capacity} disabled={disabled} onChange={(e) => updateRow(row.distanceKm, { capacity: e.target.value })} className={inputClass} /></Field>
                  <Field label="Giờ xuất phát"><input type="time" step={1} value={row.startAt} disabled={disabled} onChange={(e) => updateRow(row.distanceKm, { startAt: e.target.value })} className={inputClass} /></Field>
                  <Field label="Giờ kết thúc / cutoff"><input type="time" step={1} min={row.startAt || undefined} value={row.endAt} disabled={disabled} onChange={(e) => updateRow(row.distanceKm, { endAt: e.target.value })} className={inputClass} /></Field>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="prices-heading" className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="prices-heading" className="text-lg font-bold">Giá vé</h2>
          {editable && <button type="button" disabled={saving || !selected.length}
            onClick={() => setRows((previous) => addSharedPriceType(previous))}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 disabled:opacity-50">
            <Plus className="h-3.5 w-3.5" />Thêm loại giá
          </button>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Tạo loại giá một lần để áp dụng cho tất cả cự ly đã chọn. Tên, key và khoảng ngày dùng chung; nhập giá tiền cho từng cự ly.</p>
        <p className="mt-1 text-xs text-muted-foreground">Key chứa “early”: giá thấp hơn và kết thúc trước Regular. Key chứa “late”: giá cao hơn và bắt đầu sau Regular (không phân biệt hoa/thường). Các đợt này không được trùng ngày với Regular.</p>
        {!selected.length ? (
          <p className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Chọn cự ly ở trên để thiết lập giá vé.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {sharedTypes.map((type, index) => {
              const regular = index === 0;
              const dateError = getPriceTypeDateError(type, sharedTypes[0], regularDatesRequired);
              const dateDescription = dateError ? `price-date-error-${index}` : undefined;
              return (
                <div key={index} className={`rounded-xl border p-4 ${regular ? "border-orange-200 bg-orange-50/40" : "border-border bg-muted/20"}`}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">{regular ? "Regular · Giá gốc bắt buộc" : type.name || `Loại giá ${index + 1}`}</h3>
                    {!regular && editable && <button type="button" disabled={saving}
                      aria-label={`Xóa loại giá ${type.name || index + 1} khỏi tất cả cự ly`}
                      onClick={() => setRows((previous) => removeSharedPriceType(previous, index))}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                    </button>}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Field label="Tên loại giá"><input value={type.name} disabled={disabled || regular} placeholder="VD: Early Bird" onChange={(e) => updateType(index, { name: e.target.value })} className={inputClass} /></Field>
                    <Field label="Key"><input value={type.key} disabled={disabled || regular} placeholder="VD: early_bird" onChange={(e) => updateType(index, { key: e.target.value })} className={inputClass} /></Field>
                    <Field label={regular && !regularDatesRequired ? "Từ ngày (tùy chọn)" : "Từ ngày"}><input type="date" value={type.dateFrom} disabled={disabled} required={!regular || regularDatesRequired} aria-invalid={!!dateError} aria-describedby={dateDescription} onChange={(e) => updateType(index, { dateFrom: e.target.value })} className={inputClass} /></Field>
                    <Field label={regular && !regularDatesRequired ? "Đến ngày (tùy chọn)" : "Đến ngày"}><input type="date" min={type.dateFrom || undefined} value={type.dateTo} disabled={disabled} required={!regular || regularDatesRequired} aria-invalid={!!dateError} aria-describedby={dateDescription} onChange={(e) => updateType(index, { dateTo: e.target.value })} className={inputClass} /></Field>
                  </div>
                  {dateError && <p id={`price-date-error-${index}`} className="mt-2 text-xs text-red-600" role="status">{dateError}</p>}
                  <div className="mt-4 border-t border-border/60 pt-3">
                    <p className="mb-3 text-xs font-semibold text-muted-foreground">Giá áp dụng cho {selected.length} cự ly đã chọn (VND)</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {selected.map((row) => {
                        const priceType = row.types[index];
                        const typeError = getPriceTypeError(priceType, row.types[0].price);
                        return (
                          <div key={row.distanceKm} className="min-w-0">
                            <Field label={`${row.distanceKm} km · ${row.name || "Chưa đặt tên"}`}>
                              <input type="number" min={0} max={100000000} step="any"
                                value={priceType.price} disabled={disabled} placeholder="Nhập giá vé"
                                aria-invalid={!!typeError}
                                aria-describedby={typeError ? `price-error-${index}-${row.distanceKm}` : undefined}
                                onChange={(e) => updatePrice(row, index, e.target.value)} className={inputClass} />
                            </Field>
                            {typeError && <p id={`price-error-${index}-${row.distanceKm}`} className="mt-2 text-xs text-red-600" role="status">{typeError}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {regular && <p className="mt-3 text-xs text-muted-foreground">Giá Regular được dùng làm giá gốc ngoài các đợt giá. {regularDatesRequired ? "Phải nhập khoảng ngày khi có loại giá early hoặc late." : "Có thể để trống cả hai ngày nếu không có loại giá early hoặc late."}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full min-w-0 rounded-lg border border-border bg-background px-2.5 py-2 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20";