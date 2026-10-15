"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Save,
  Check,
  RotateCcw,
} from "lucide-react";
import { getEventById } from "@/api/events";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { getOrganizerStatusLabel, getStatusColor } from "@/lib/format";
import { canEditProfile } from "../_shared";
import {
  ADDITION_PRODUCTS,
  type AdditionProductItem,
} from "@/components/product-list";
import { ProductCard } from "@/components/product-card";

const STORAGE_KEY_PREFIX = "raceday_event_additions_";

export default function ProfileAdditionClient() {
  const params = useParams();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Selected item IDs (organizer group is bundled: either both or neither)
  const [selectedIds, setSelectedIds] = useState<string[]>([
    "bib",
    "chip",
    "time-kit",
  ]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    const data = await getEventById(eventId);
    setEvent(data);

    // Try loading saved selections from localStorage
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${eventId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const hasOrganizer =
              parsed.includes("chip") || parsed.includes("time-kit");
            const normalized = hasOrganizer
              ? Array.from(new Set([...parsed, "chip", "time-kit"]))
              : parsed;
            setSelectedIds(normalized);
          }
        }
      } catch {
        /* ignore storage error */
      }
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled)
          setError(getApiErrorMessage(e, "Không tải được thông tin giải."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, load]);

  const handleToggle = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );
  };

  const handleSelectGroup = (
    groupItems: AdditionProductItem[],
    selectAll: boolean
  ) => {
    const groupIds = groupItems.map((item) => item.id);
    setSelectedIds((prev) => {
      if (selectAll) {
        return Array.from(new Set([...prev, ...groupIds]));
      }
      return prev.filter((id) => !groupIds.includes(id));
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${eventId}`,
          JSON.stringify(selectedIds)
        );
      }
      // Brief delay for UX feedback
      await new Promise((res) => setTimeout(res, 400));
      notify(`Đã lưu thành công ${selectedIds.length} hạng mục bổ sung.`);
    } catch (e) {
      setError(getApiErrorMessage(e, "Lưu thông tin bổ sung thất bại."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải cấu hình…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-4 text-sm text-muted-foreground">
          {error || "Không tìm thấy thông tin giải."}
        </p>
        <Link
          href="/my-events"
          className="mt-4 inline-block text-sm font-bold text-orange-600 hover:underline"
        >
          Về danh sách giải
        </Link>
      </div>
    );
  }

  const editable = canEditProfile(event.status);

  const athleteProducts = ADDITION_PRODUCTS.filter(
    (p) => p.group === "athlete"
  );
  const organizerProducts = ADDITION_PRODUCTS.filter(
    (p) => p.group === "organizer"
  );

  const allAthleteSelected = athleteProducts.every((p) =>
    selectedIds.includes(p.id)
  );
  const allOrganizerSelected = organizerProducts.every((p) =>
    selectedIds.includes(p.id)
  );

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Chi tiết giải
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Dịch vụ &amp; Vật phẩm bổ sung
            </h1>
            <span
              className={`inline-flex rounded-md border px-2.5 py-0.5 text-[11px] font-extrabold ${getStatusColor(
                event.status
              )}`}
            >
              {getOrganizerStatusLabel(event.status)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
            Chọn các vật phẩm vận động viên (BIB, áo Finisher, huy chương) và thiết bị ban tổ chức (chip, hệ thống tính giờ) cho giải chạy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu lựa chọn ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* TOAST / ERROR */}
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SUMMARY BANNER */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200 shrink-0">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Trạng thái cấu hình
              </p>
              <h3 className="text-base font-bold text-foreground">
                Đã chọn:{" "}
                <span className="text-orange-600 font-extrabold">
                  {selectedIds.length} / {ADDITION_PRODUCTS.length}
                </span>{" "}
                hạng mục bổ sung
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedIds(ADDITION_PRODUCTS.map((p) => p.id))
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:border-orange-500/50 hover:bg-orange-50/40 transition-colors cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 text-orange-600" /> Chọn tất cả (5)
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Bỏ chọn hết
            </button>
          </div>
        </div>
      </div>

      {/* GROUP 1: DÀNH CHO VẬN ĐỘNG VIÊN */}
      <section className="mt-8 md:mt-10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <div className="mb-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                Gói Race-Kit &amp; Quà tặng
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              Dành cho vận động viên
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Có thể chọn riêng lẻ từng vật phẩm theo nhu cầu thực tế của sự kiện.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-semibold hover:border-orange-500/40 hover:bg-orange-50/30 select-none transition-colors">
              <input
                type="checkbox"
                checked={allAthleteSelected}
                onChange={(e) =>
                  handleSelectGroup(athleteProducts, e.target.checked)
                }
                className="h-4 w-4 rounded text-orange-600 accent-orange-600 cursor-pointer"
              />
              <span className="text-foreground">
                {allAthleteSelected ? "Bỏ chọn nhóm" : "Chọn cả 3 vật phẩm"}
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-[1450px] mx-auto">
          {athleteProducts.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              image={item.image}
              title={item.title}
              features={item.features}
              pricing={item.pricing}
              checked={selectedIds.includes(item.id)}
              onCheckedChange={(c) => handleToggle(item.id, c)}
            />
          ))}
        </div>
      </section>

      {/* GROUP 2: DÀNH CHO BAN TỔ CHỨC */}
      <section className="mt-12 md:mt-16 pt-8 border-t border-border/70 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <div className="mb-2">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                Thiết bị &amp; Hệ thống kỹ thuật
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              Dành cho ban tổ chức
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              *Áp dụng trọn bộ toàn bộ thiết bị (không áp dụng chọn riêng lẻ) để bảo đảm đồng bộ phần mềm và thảm ăng-ten chip tính giờ.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2.5 cursor-pointer rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100 transition-all select-none shadow-2xs">
              <input
                type="checkbox"
                checked={allOrganizerSelected}
                onChange={(e) =>
                  handleSelectGroup(organizerProducts, e.target.checked)
                }
                className="h-4 w-4 rounded text-orange-600 accent-orange-600 cursor-pointer"
              />
              <span>
                {allOrganizerSelected ? "Đã chọn trọn bộ (2/2)" : "Chọn trọn bộ thiết bị BTC (2/2)"}
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-[1450px] mx-auto">
          {organizerProducts.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              image={item.image}
              title={item.title}
              features={item.features}
              pricing={item.pricing}
              checked={allOrganizerSelected}
              showCheckbox={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
