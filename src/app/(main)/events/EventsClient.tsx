"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RaceEventListItemDto } from "@/dto/event.dto";
import { getEvents } from "@/api/events";
import EventCard from "@/components/events/EventCard";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import FilterChip from "@/components/events/FilterChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DISTANCE_BUCKETS,
  eventDistanceKms,
  matchesDistanceBucket,
  type DistanceBucketKey,
} from "@/lib/distance-buckets";
import {
  isEventEnded,
  isEventStarted,
  isPublicRegistrationLive,
} from "@/lib/event-lifecycle";
import {
  eventMatchesProvince,
  matchVnProvince,
  VN_PROVINCES,
} from "@/lib/vn-provinces";

const PAGE_SIZE = 6;

/**
 * Trang public khám phá: không có “đã kết thúc”.
 * “Đang diễn ra” giữ lại vì RaceDay có race-day / live (giống finder có live race).
 */
const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "registration-open", label: "Đang mở" },
  { key: "upcoming", label: "Sắp mở" },
  { key: "in-progress", label: "Đang diễn ra" },
] as const;

const PRICE_FILTERS = [
  { key: "all", label: "Mọi giá", min: 0, max: Infinity },
  { key: "under500", label: "Dưới 500k", min: 0, max: 499_999 },
  { key: "500to1m", label: "500k – 1 triệu", min: 500_000, max: 1_000_000 },
  { key: "over1m", label: "Trên 1 triệu", min: 1_000_001, max: Infinity },
] as const;

type StatusKey = (typeof STATUS_FILTERS)[number]["key"];
type PriceKey = (typeof PRICE_FILTERS)[number]["key"];

function normalizeEventStatus(status: string): string {
  return (status || "").toLowerCase().replace(/_/g, "-");
}

/** Giải còn hiện trên trang khám phá (bỏ completed / quá ngày / hủy). */
function isDiscoverablePublicEvent(event: RaceEventListItemDto): boolean {
  const sk = normalizeEventStatus(event.status);
  if (
    sk === "completed" ||
    sk === "cancelled" ||
    sk === "rejected" ||
    sk === "draft" ||
    sk === "pending" ||
    sk === "pending-approval"
  ) {
    return false;
  }
  if (isEventEnded(event)) return false;
  return true;
}

function matchesEventStatus(
  event: RaceEventListItemDto,
  filter: StatusKey
): boolean {
  if (filter === "all") return true;
  if (filter === "registration-open") return isPublicRegistrationLive(event);
  if (filter === "in-progress") {
    const sk = normalizeEventStatus(event.status);
    return isEventStarted(event) || sk === "in-progress";
  }
  // upcoming: chưa mở ĐK live, chưa tới race day
  if (isPublicRegistrationLive(event) || isEventStarted(event)) return false;
  const sk = normalizeEventStatus(event.status);
  return (
    sk === "upcoming" ||
    sk === "approved" ||
    sk === "published" ||
    sk === "registration-open" ||
    sk === "closed"
  );
}

function minEventPrice(event: RaceEventListItemDto): number | null {
  if (typeof event.minPrice === "number" && Number.isFinite(event.minPrice)) {
    return event.minPrice;
  }
  const distances = event.distances || [];
  if (distances.length) {
    const prices = distances
      .map((d) => Number(d.basePrice ?? d.price))
      .filter((p) => Number.isFinite(p) && p >= 0);
    if (prices.length) return Math.min(...prices);
  }
  return null;
}

function EventsClientInner() {
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get("tag") || "";

  const [boot, setBoot] = useState(true);
  const [catalog, setCatalog] = useState<RaceEventListItemDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
  const [distanceFilter, setDistanceFilter] = useState<DistanceBucketKey>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<PriceKey>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

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
  }, [loadAttempt]);

  useEffect(() => {
    if (!tagFromUrl) return;
    const isStatus = STATUS_FILTERS.some((f) => f.key === tagFromUrl);
    const isDistance = DISTANCE_BUCKETS.some((f) => f.key === tagFromUrl);
    if (isStatus) setStatusFilter(tagFromUrl as StatusKey);
    else if (isDistance) setDistanceFilter(tagFromUrl as DistanceBucketKey);
    else if (tagFromUrl === "registered" || tagFromUrl === "ended") {
      /* legacy — trang public không filter ĐK / đã kết thúc */
    }
    setFiltersOpen(true);
  }, [tagFromUrl]);

  /** Catalog public: bỏ giải đã kết thúc / hủy */
  const discoverable = useMemo(
    () => catalog.filter(isDiscoverablePublicEvent),
    [catalog]
  );

  /** 34 tỉnh/thành (sau sáp nhập) + số giải đang khám phá được */
  const provinceOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of discoverable) {
      const p = matchVnProvince(event.location || "");
      if (!p) continue;
      counts.set(p.key, (counts.get(p.key) || 0) + 1);
    }
    return VN_PROVINCES.map((p) => ({
      ...p,
      count: counts.get(p.key) || 0,
    })).sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [discoverable]);

  const filtered = useMemo(() => {
    const priceBand =
      PRICE_FILTERS.find((p) => p.key === priceFilter) ?? PRICE_FILTERS[0];
    const list = discoverable.filter((event) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        event.name.toLowerCase().includes(q) ||
        (event.location || "").toLowerCase().includes(q);

      const matchesStatus = matchesEventStatus(event, statusFilter);
      const matchesDistance = matchesDistanceBucket(
        eventDistanceKms(event),
        distanceFilter
      );
      const matchesProvince = eventMatchesProvince(
        event.location || "",
        provinceFilter
      );

      const price = minEventPrice(event);
      // Không có giá → không khớp band cụ thể (tránh mọi filter đều pass).
      const matchesPrice =
        priceFilter === "all"
          ? true
          : price != null && price >= priceBand.min && price <= priceBand.max;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDistance &&
        matchesProvince &&
        matchesPrice
      );
    });

    return [...list].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [
    discoverable,
    searchQuery,
    statusFilter,
    distanceFilter,
    provinceFilter,
    priceFilter,
  ]);

  const resetKey = `${searchQuery}|${statusFilter}|${distanceFilter}|${provinceFilter}|${priceFilter}`;
  const pager = usePagedList(filtered, PAGE_SIZE, resetKey);

  const activeFilterCount = [
    statusFilter !== "all",
    distanceFilter !== "all",
    provinceFilter !== "all",
    priceFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDistanceFilter("all");
    setProvinceFilter("all");
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
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-700">Tìm vạch xuất phát tiếp theo</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Khám phá giải chạy
        </h1>
        <p className="mt-1.5 text-muted-foreground max-w-3xl text-sm sm:text-base">
          Chọn giải chạy phù hợp với bạn. Tìm theo địa điểm, cự ly và mức giá để bắt đầu hành trình mới.
        </p>

        <Label htmlFor="event-search" className="mt-6 mb-2 block text-sm font-semibold">Bạn muốn chạy ở đâu?</Label>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="event-search"
              type="search"
              placeholder="Tìm giải, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-xl bg-background pl-10 pr-12 text-base focus-visible:border-orange-500 focus-visible:ring-orange-500/20 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl hover:bg-muted text-muted-foreground focus-visible:outline-2 focus-visible:outline-orange-600"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="event-filters"
            aria-label={`Bộ lọc giải chạy${activeFilterCount ? `, ${activeFilterCount} đang áp dụng` : ""}`}
            className={`shrink-0 inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-3 sm:px-4 text-sm font-semibold transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? "border-orange-300 bg-orange-50 text-orange-800"
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
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => { setBoot(true); setLoadAttempt((attempt) => attempt + 1); }}
            className="mt-3 min-h-11 rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {filtersOpen && (
        <div id="event-filters" className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-1">
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
                Cự ly
              </span>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={distanceFilter === "all"}
                  onClick={() => setDistanceFilter("all")}
                >
                  Mọi cự ly
                </FilterChip>
                {DISTANCE_BUCKETS.map((f) => (
                  <FilterChip
                    key={f.key}
                    active={distanceFilter === f.key}
                    onClick={() => setDistanceFilter(f.key)}
                  >
                    {f.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:w-24 sm:pt-2 shrink-0">
                Tỉnh / thành
              </span>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                <FilterChip
                  active={provinceFilter === "all"}
                  onClick={() => setProvinceFilter("all")}
                >
                  Mọi nơi
                </FilterChip>
                {provinceOptions.map((p) => (
                  <FilterChip
                    key={p.key}
                    active={provinceFilter === p.key}
                    onClick={() => setProvinceFilter(p.key)}
                  >
                    {p.count > 0 ? `${p.label} (${p.count})` : p.label}
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

      {!error && <p role="status" className="mb-4 text-sm text-muted-foreground">
        Hiển thị {filtered.length} / {discoverable.length} giải
      </p>}

      {!error && <><div
        className={`list-fade ${pager.visible ? "list-fade-in" : "list-fade-out"} relative min-h-[280px]`}
      >
        {pager.turning ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: Math.min(PAGE_SIZE, 6) }).map((_, i) => (
              <EventCardSkeleton key={`sk-${i}`} />
            ))}
          </div>
        ) : pager.pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-3" />
            <h2 className="text-lg font-semibold mb-1">{discoverable.length ? "Không tìm thấy giải phù hợp" : "Chưa có giải chạy để khám phá"}</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {discoverable.length ? "Thử đổi từ khóa hoặc xóa bộ lọc để xem thêm giải chạy." : "Các giải chạy mới sẽ được cập nhật tại đây. Bạn hãy quay lại sau nhé."}
            </p>
            {(searchQuery || activeFilterCount > 0) && <button
              type="button"
              onClick={clearFilters}
              className="mt-4 min-h-11 rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Xóa bộ lọc
            </button>}
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
      </>}
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
