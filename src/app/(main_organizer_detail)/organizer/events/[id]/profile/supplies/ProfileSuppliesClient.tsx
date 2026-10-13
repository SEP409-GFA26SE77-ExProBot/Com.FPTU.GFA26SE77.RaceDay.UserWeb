"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getEventById } from "@/api/events";
import {
  getEventSupplies,
  updateEventSupplies,
  type EventSupplyItemDto,
} from "@/api/supplies";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { getOrganizerStatusLabel, getStatusColor } from "@/lib/format";
import { canEditProfile } from "../_shared";

export interface SupplyItem {
  id: string;
  name: string;
  quantity: number;
  unit: "thùng";
  notes?: string;
}

const STORAGE_KEY_PREFIX = "raceday_event_supplies_";

const QUICK_PRESETS = [
  {
    name: "Nước tinh khiết 500ml",
    defaultQty: 60,
    notes: "Quy cách 24 chai/thùng. Yêu cầu giao trước 04:00 sáng.",
  },
  {
    name: "Nước điện giải Isotonic (Pocari/Revive)",
    defaultQty: 40,
    notes: "Quy cách 24 chai/thùng. Ưu tiên ướp mát trước giờ xuất phát.",
  },
  {
    name: "Chuối tiêu tươi tiếp sức",
    defaultQty: 25,
    notes: "Thùng 15kg quả chín vừa, cắt khúc 5-7cm sẵn phục vụ.",
  },
  {
    name: "Gel năng lượng thể thao",
    defaultQty: 15,
    notes: "Thùng 24 gói. Bảo quản nơi khô ráo, tránh ánh nắng trực tiếp.",
  },
  {
    name: "Băng xịt lạnh giảm đau & Sơ cứu",
    defaultQty: 8,
    notes: "Thùng 12 chai xịt lạnh + túi bông băng sơ cứu nhanh khẩn cấp.",
  },
  {
    name: "Ly giấy sinh học dùng 1 lần",
    defaultQty: 20,
    notes: "Thùng 1.000 ly giấy tự phân hủy bảo vệ môi trường.",
  },
];

const DEFAULT_SUPPLIES: SupplyItem[] = [
  {
    id: "sup-1",
    name: "Nước khoáng thiên nhiên 500ml",
    quantity: 80,
    unit: "thùng",
    notes: "Thùng 24 chai. Phân bổ đồng đều cho các trạm tiếp nước.",
  },
  {
    id: "sup-2",
    name: "Nước điện giải thể thao Pocari Sweat 500ml",
    quantity: 50,
    unit: "thùng",
    notes: "Thùng 24 chai. Cần chuẩn bị thùng xốp ướp đá lạnh.",
  },
  {
    id: "sup-3",
    name: "Chuối tiêu chín tiếp sức VĐV",
    quantity: 30,
    unit: "thùng",
    notes: "Thùng 15kg quả chín vừa, chia đều cho trạm giữa và vạch đích.",
  },
  {
    id: "sup-4",
    name: "Gel năng lượng chạy bộ thể thao",
    quantity: 12,
    unit: "thùng",
    notes: "Thùng 24 gói. Kiểm tra hạn sử dụng trước khi giao nhận.",
  },
  {
    id: "sup-5",
    name: "Bình xịt lạnh giảm đau & Dụng cụ y tế",
    quantity: 6,
    unit: "thùng",
    notes: "Thùng 12 bình xịt lạnh + bông băng thun co giãn sơ cứu.",
  },
];

export default function ProfileSuppliesClient() {
  const params = useParams();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Supplies list
  const [supplies, setSupplies] = useState<SupplyItem[]>(DEFAULT_SUPPLIES);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    const [eventData, suppliesData] = await Promise.all([
      getEventById(eventId),
      getEventSupplies(eventId).catch((e) => {
        console.warn("Could not fetch remote supplies, fallback to storage:", e);
        return null;
      }),
    ]);

    setEvent(eventData);

    if (suppliesData && Array.isArray(suppliesData) && suppliesData.length > 0) {
      setSupplies(
        suppliesData.map((s) => ({
          id: s.id,
          name: s.name,
          quantity: Number(s.quantity) || 1,
          unit: "thùng" as const,
          notes: s.notes || "",
        }))
      );
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

  // Total boxes count
  const totalBoxes = useMemo(
    () => supplies.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [supplies]
  );

  // Filtered items by search keyword
  const filteredSupplies = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return supplies;
    return supplies.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.notes && item.notes.toLowerCase().includes(term))
    );
  }, [supplies, searchTerm]);

  // Adjust quantity
  const handleUpdateQuantity = (id: string, delta: number) => {
    setSupplies((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(1, (Number(item.quantity) || 0) + delta);
        return { ...item, quantity: newQty };
      })
    );
  };

  // Set direct quantity
  const handleSetQuantity = (id: string, value: number) => {
    const validQty = Math.max(1, Math.floor(value) || 1);
    setSupplies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: validQty } : item))
    );
  };

  // Update item field
  const handleUpdateField = (
    id: string,
    field: keyof SupplyItem,
    value: unknown
  ) => {
    setSupplies((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Remove card
  const handleRemoveItem = (id: string) => {
    setSupplies((prev) => prev.filter((item) => item.id !== id));
  };

  // Add new empty card
  const handleAddNewItem = () => {
    const newItem: SupplyItem = {
      id: `sup-${Date.now()}`,
      name: "Vật phẩm tiếp tế mới",
      quantity: 10,
      unit: "thùng",
      notes: "",
    };
    setSupplies((prev) => [newItem, ...prev]);
  };

  // Add from preset
  const handleAddPreset = (preset: (typeof QUICK_PRESETS)[0]) => {
    const newItem: SupplyItem = {
      id: `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      quantity: preset.defaultQty,
      unit: "thùng",
      notes: preset.notes,
    };
    setSupplies((prev) => [newItem, ...prev]);
    notify(`Đã thêm "${preset.name}" (${preset.defaultQty} thùng).`);
  };

  // Save to API & storage
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload: EventSupplyItemDto[] = supplies.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: "thùng",
        notes: item.notes,
      }));

      await updateEventSupplies(eventId, payload);
      notify(
        `Đã lưu danh sách tiếp tế thành công (${supplies.length} loại, tổng ${totalBoxes} thùng).`
      );
    } catch (e) {
      setError(getApiErrorMessage(e, "Lưu danh sách tiếp tế thất bại."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải danh sách tiếp tế…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-4 text-sm text-muted-foreground">{error || "Không tìm thấy giải."}</p>
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

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Hậu cần đường chạy
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Vật phẩm tiếp tế
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
            Quản lý số lượng nước uống, đồ ăn nhẹ và vật tư tiếp sức phân bổ tại giải chạy (đơn vị: <strong>thùng</strong>).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu tiếp tế ({totalBoxes} thùng)
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

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tổng số lượng
            </span>
            <div className="h-9 w-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {totalBoxes.toLocaleString("vi-VN")}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
              thùng
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tổng toàn bộ số thùng tiếp tế cho giải
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Số loại vật phẩm
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {supplies.length}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">mặt hàng</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Bao gồm nước khoáng, điện giải và thực phẩm
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Quy chuẩn đóng gói
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              100%
            </span>
            <span className="text-sm font-bold text-emerald-600">Đơn vị: Thùng</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Đồng bộ quản lý kho và điều phối xe chở
          </p>
        </div>
      </div>

      {/* QUICK PRESETS STRIP */}
      <div className="rounded-2xl border border-border/70 bg-muted/20 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-bold text-foreground">
              Thêm nhanh vật phẩm tiếp tế phổ biến
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            Nhấp để thêm ngay vào danh sách
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {QUICK_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:border-orange-500/50 hover:bg-orange-50/50 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 text-orange-500" />
              <span>{preset.name}</span>
              <span className="rounded bg-orange-50 border border-orange-200 px-1.5 py-0.5 text-[11px] font-bold text-orange-700">
                +{preset.defaultQty} thùng
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* FILTER & ACTIONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên vật phẩm hoặc ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-card pl-10 pr-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {/* Action Button: Add New Custom Card */}
        <button
          type="button"
          onClick={handleAddNewItem}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Thêm thẻ tiếp tế mới
        </button>
      </div>

      {/* SUPPLY CARDS GRID */}
      {filteredSupplies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/50">
          <Boxes className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
          <h3 className="text-base font-bold text-foreground">
            Không tìm thấy vật phẩm tiếp tế phù hợp
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hãy thử tìm kiếm từ khóa khác hoặc bấm nút thêm vật phẩm mới bên trên.
          </p>
          <button
            type="button"
            onClick={handleAddNewItem}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm vật phẩm tiếp tế
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSupplies.map((item, index) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:shadow-md hover:border-orange-500/50 transition-all"
            >
              <div>
                {/* Card Top: Order indicator & Delete button */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 text-xs font-bold">
                    <Boxes className="h-3.5 w-3.5 text-orange-600" />
                    Mục #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                    title="Xóa vật phẩm này"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Item Name Input */}
                <div className="mb-3.5">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Tên vật phẩm
                  </label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateField(item.id, "name", e.target.value)}
                    placeholder="VD: Nước khoáng thiên nhiên 500ml"
                    className="w-full font-bold text-base text-foreground rounded-xl border border-border/80 bg-background px-3.5 py-2 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Notes Input (Optional) */}
                <div className="mb-4">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Ghi chú đóng gói / quy cách (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={item.notes || ""}
                    onChange={(e) => handleUpdateField(item.id, "notes", e.target.value)}
                    placeholder="VD: 24 chai/thùng, ướp lạnh sẵn..."
                    className="w-full text-xs text-muted-foreground rounded-xl border border-border/60 bg-muted/20 px-3 py-2 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Card Bottom: Quantity Stepper & Unit "THÙNG" */}
              <div className="pt-4 border-t border-border/70 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Số lượng:
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-border/80 bg-background shadow-2xs overflow-hidden">
                    {/* Minus button */}
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="p-2 hover:bg-muted text-foreground transition-colors active:scale-95 cursor-pointer"
                      title="Giảm 1 thùng"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    {/* Numeric Input */}
                    <input
                      type="number"
                      min={1}
                      value={item.quantity || 1}
                      onChange={(e) =>
                        handleSetQuantity(item.id, Number(e.target.value) || 1)
                      }
                      className="w-16 text-center font-extrabold text-base text-foreground bg-transparent focus:outline-none border-x border-border/60 py-1.5"
                    />

                    {/* Plus button */}
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="p-2 hover:bg-muted text-foreground transition-colors active:scale-95 cursor-pointer"
                      title="Tăng 1 thùng"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* UNIT BADGE */}
                  <span className="rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-bold px-3 py-1.5 text-xs uppercase tracking-wider shadow-2xs">
                    THÙNG
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
