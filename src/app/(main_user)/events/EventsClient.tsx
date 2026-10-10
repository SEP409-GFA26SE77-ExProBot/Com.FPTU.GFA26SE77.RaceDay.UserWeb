"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RaceEventListItemDto } from "@/dto/event.dto";
import { getEvents } from "@/api/events";
import EventCard from "@/components/events/EventCard";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import {
  Search,
  X,
  Flag,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";
import { getApiErrorMessage } from "@/lib/error";

const PAGE_SIZE = 6;

/** Chỉ trạng thái giải (góc nhìn VĐV khám phá) */
const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "registration-open", label: "Đang mở" },
  { key: "upcoming", label: "Sắp mở" },
  { key: "ended", label: "Đã đóng / kết thúc" },
] as const;

const TYPE_FILTERS = [
  { key: "trail", label: "Trail" },
  { key: "ultra", label: "Ultra" },
  { key: "núi", label: "Núi" },
  { key: "đường-phố", label: "Đường phố" },
  { key: "chạy-đêm", label: "Chạy đêm" },
  { key: "biển", label: "Biển / Đảo" },
] as const;

const PRICE_FILTERS = [
  { key: "all", label: "Mọi giá", min: 0, max: Infinity },
  { key: "under500", label: "Dưới 500k", min: 0, max: 499_999 },
  { key: "500to1m", label: "500k – 1 triệu", min: 500_000, max: 1_000_000 },
  { key: "over1m", label: "Trên 1 triệu", min: 1_000_001, max: Infinity },
] as const;

type StatusKey = (typeof STATUS_FILTERS)[number]["key"];
type TypeKey = (typeof TYPE_FILTERS)[number]["key"] | "all";
type PriceKey = (typeof PRICE_FILTERS)[number]["key"];

function normalizeEventStatus(status: string): string {
  return (status || "").toLowerCase().replace(/_/g, "-");
}

function matchesEventStatus(statusRaw: string, filter: StatusKey): boolean {
  if (filter === "all") return true;
  const status = normalizeEventStatus(statusRaw);
  if (filter === "registration-open") return status === "registration-open";
  if (filter === "upcoming") {
    return (
      status === "upcoming" ||
      status === "approved" ||
      status === "published" ||
      status === "pending" ||
      status === "pending-approval"
    );
  }
  // ended: đóng ĐK / kết thúc / hết slot / hủy
  return (
    status === "closed" ||
    status === "completed" ||
    status === "sold-out" ||
    status === "cancelled" ||
    status === "rejected"
  );
}

function eventCity(event: RaceEventListItemDto): string {
  const parts = (event.location || "").split(",").map((s) => s.trim());
  return parts[parts.length - 1] || event.location || "Khác";
}

function minEventPrice(event: RaceEventListItemDto): number | null {
  const distances = event.distances || [];
  if (!distances.length) return null;
  return Math.min(...distances.map((d) => d.price));
}

function matchesType(event: RaceEventListItemDto, typeFilter: TypeKey): boolean {
  if (typeFilter === "all") return true;
  const hay = `${event.name} ${event.tagline || ""} ${event.location || ""}`.toLowerCase();
  switch (typeFilter) {
    case "trail":
      return /trail|địa hình/.test(hay);
    case "ultra":
      return /ultra|70k|100k/.test(hay);
    case "núi":
      return /núi|mountain|sapa|sa pa|hoàng liên/.test(hay);
    case "đường-phố":
      return /city|đường phố|night run|lakeside|hanoi|hcmc|hồ chí minh|nguyễn huệ/.test(
        hay
      );
    case "chạy-đêm":
      return /đêm|night|night run/.test(hay);
    case "biển":
      return /biển|đảo|ocean|nha trang|ven biển|island/.test(hay);
    default:
      return true;
  }
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all border ${
        active
          ? "bg-orange-500 text-white border-orange-600 shadow-sm shadow-orange-500/25"
          : "bg-white text-foreground/70 border-border hover:border-orange-400/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EventsClientInner() {
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get("tag") || "";

  const [boot, setBoot] = useState(true);
  const [catalog, setCatalog] = useState<RaceEventListItemDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
  const [typeFilter, setTypeFilter] = useState<TypeKey>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<PriceKey>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getEvents();
        if (!cancelled) {
          setCatalog(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không thể tải danh sách sự kiện."));
          setCatalog([]);
        }
      } finally {
        if (!cancelled) setBoot(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tagFromUrl) return;
    const isStatus = STATUS_FILTERS.some((f) => f.key === tagFromUrl);
    if (isStatus) setStatusFilter(tagFromUrl as StatusKey);
    else if (tagFromUrl === "registered") {
      /* legacy query — bỏ filter ĐK trên trang khám phá */
    } else setTypeFilter(tagFromUrl as TypeKey);
    setFiltersOpen(true);
  }, [tagFromUrl]);

  const cityOptions = useMemo(
    () =>
      Array.from(new Set(catalog.map(eventCity))).sort((a, b) =>
        a.localeCompare(b, "vi")
      ),
    [catalog]
  );

  const filtered = useMemo(() => {
    const priceBand =
      PRICE_FILTERS.find((p) => p.key === priceFilter) ?? PRICE_FILTERS[0];
    const list = catalog.filter((event) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        event.name.toLowerCase().includes(q) ||
        (event.location || "").toLowerCase().includes(q) ||
        eventCity(event).toLowerCase().includes(q);

      const matchesStatus = matchesEventStatus(event.status, statusFilter);
      const matchesTypeOk = matchesType(event, typeFilter);
      const matchesCity =
        cityFilter === "all" || eventCity(event) === cityFilter;

      const price = minEventPrice(event);
      const matchesPrice =
        priceFilter === "all" ||
        price == null ||
        (price >= priceBand.min && price <= priceBand.max);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTypeOk &&
        matchesCity &&
        matchesPrice
      );
    });

    return [...list].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [catalog, searchQuery, statusFilter, typeFilter, cityFilter, priceFilter]);

  const resetKey = `${searchQuery}|${statusFilter}|${typeFilter}|${cityFilter}|${priceFilter}`;
  const pager = usePagedList(filtered, PAGE_SIZE, resetKey);

  const activeFilterCount = [
    statusFilter !== "all",
    typeFilter !== "all",
    cityFilter !== "all",
    priceFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCityFilter("all");
    setPriceFilter("all");
  };

  if (boot) {
    return (
      <PageLoading
        title="Đang tải danh sách giải…"
        description="RaceDay đang lấy các giải đang mở và sắp diễn ra."
        icon={Flag}
      />
    );
  }

  return (
    <div className={`${PAGE_SHELL} py-7 sm:py-8`}>
      <div className="mb-6 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-5 sm:p-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Khám phá giải chạy
        </h1>
        <p className="mt-1.5 text-muted-foreground max-w-3xl text-sm sm:text-base">
          Tìm theo tên / địa điểm, lọc theo trạng thái giải (đang mở, sắp mở,
          đã đóng), loại hình, thành phố và mức giá.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm giải, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            className={`shrink-0 inline-flex h-[42px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? "border-orange-500 bg-orange-500 text-white shadow-sm shadow-orange-500/25"
                : "border-border bg-white text-foreground hover:border-orange-400/60"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filtersOpen ? "bg-white/20" : "bg-orange-500 text-white"
                }`}
              >
                {activeFilterCount}
              </span>
            )}
            {filtersOpen ? (
              <ChevronUp className="h-4 w-4 opacity-90" />
            ) : (
              <ChevronDown className="h-4 w-4 opacity-90" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Thử lại
          </button>
        </div>
      )}

      {filtersOpen && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">Bộ lọc giải chạy</p>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-orange-600 hover:underline"
                >
                  Xóa hết
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                Đóng
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:w-24 sm:pt-2 shrink-0">
                Trạng thái
              </span>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                  <FilterChip
                    key={f.key}
                    active={statusFilter === f.key}
                    onClick={() => setStatusFilter(f.key)}
                  >
                    {f.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:w-24 sm:pt-2 shrink-0">
                Loại hình
              </span>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={typeFilter === "all"}
                  onClick={() => setTypeFilter("all")}
                >
                  Mọi loại
                </FilterChip>
                {TYPE_FILTERS.map((f) => (
                  <FilterChip
                    key={f.key}
                    active={typeFilter === f.key}
                    onClick={() => setTypeFilter(f.key)}
                  >
                    {f.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:w-24 sm:pt-2 shrink-0">
                Địa điểm
              </span>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                <FilterChip
                  active={cityFilter === "all"}
                  onClick={() => setCityFilter("all")}
                >
                  Mọi nơi
                </FilterChip>
                {cityOptions.map((city) => (
                  <FilterChip
                    key={city}
                    active={cityFilter === city}
                    onClick={() => setCityFilter(city)}
                  >
                    {city}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:w-24 sm:pt-2 shrink-0">
                Giá từ
              </span>
              <div className="flex flex-wrap gap-2">
                {PRICE_FILTERS.map((f) => (
                  <FilterChip
                    key={f.key}
                    active={priceFilter === f.key}
                    onClick={() => setPriceFilter(f.key)}
                  >
                    {f.label}
                  </FilterChip>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="mb-4 text-xs text-muted-foreground">
        Hiển thị {filtered.length} / {catalog.length} giải
      </p>

      <div
        className={`list-fade ${pager.visible ? "list-fade-in" : "list-fade-out"} relative min-h-[280px]`}
      >
        {pager.turning ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: Math.min(PAGE_SIZE, 6) }).map((_, i) => (
              <EventCardSkeleton key={`sk-${i}`} />
            ))}
          </div>
        ) : pager.pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">Không tìm thấy giải</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Thử đổi từ khóa hoặc bộ lọc.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 list-stagger">
            {pager.pageItems.map((event) => (
              <EventCard key={event.id} event={event} statusMode="event" />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-border/60 pt-5">
        <Pagination
          page={pager.page}
          totalPages={pager.totalPages}
          totalItems={pager.totalItems}
          pageSize={PAGE_SIZE}
          onChange={pager.goTo}
          disabled={pager.turning}
        />
      </div>
    </div>
  );
}

export default function EventsClient() {
  return (
    <Suspense
      fallback={
        <PageLoading
          title="Đang tải danh sách giải…"
          description="RaceDay đang chuẩn bị bộ lọc và danh sách."
          icon={Flag}
        />
      }
    >
      <EventsClientInner />
    </Suspense>
  );
}
