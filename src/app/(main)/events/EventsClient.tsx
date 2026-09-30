"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_EVENTS, type RaceEvent } from "@/data/mock-events";
import EventCard from "@/components/events/EventCard";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import { Search, X, Flag } from "lucide-react";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";

const PAGE_SIZE = 6;

const STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "registration-open", label: "Đang mở" },
  { key: "upcoming", label: "Sắp mở" },
  { key: "sold-out", label: "Hết slot" },
] as const;

const TYPE_FILTERS = [
  { key: "trail", label: "Trail" },
  { key: "ultra", label: "Ultra" },
  { key: "núi", label: "Núi" },
  { key: "đường-phố", label: "Đường phố" },
  { key: "chạy-đêm", label: "Chạy đêm" },
  { key: "biển", label: "Biển / Đảo" },
] as const;

type StatusKey = (typeof STATUS_FILTERS)[number]["key"];
type TypeKey = (typeof TYPE_FILTERS)[number]["key"] | "all";

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

function filterEvents(
  events: RaceEvent[],
  searchQuery: string,
  statusFilter: StatusKey,
  typeFilter: TypeKey
) {
  return events.filter((event) => {
    const matchesSearch =
      searchQuery === "" ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || event.status === statusFilter;

    const matchesType =
      typeFilter === "all" ||
      event.tags.some((t) => {
        const key = t.toLowerCase().replace(/\s+/g, "-");
        if (typeFilter === "biển") return /biển|đảo|ven biển|island/i.test(t);
        return key === typeFilter;
      });

    return matchesSearch && matchesStatus && matchesType;
  });
}

export default function EventsClient() {
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get("tag") || "";

  const [boot, setBoot] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
  const [typeFilter, setTypeFilter] = useState<TypeKey>("all");

  useEffect(() => {
    const t = window.setTimeout(() => setBoot(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!tagFromUrl) return;
    const isStatus = STATUS_FILTERS.some((f) => f.key === tagFromUrl);
    if (isStatus) setStatusFilter(tagFromUrl as StatusKey);
    else setTypeFilter(tagFromUrl as TypeKey);
  }, [tagFromUrl]);

  const filtered = useMemo(
    () => filterEvents(MOCK_EVENTS, searchQuery, statusFilter, typeFilter),
    [searchQuery, statusFilter, typeFilter]
  );

  const resetKey = `${searchQuery}|${statusFilter}|${typeFilter}`;
  const pager = usePagedList(filtered, PAGE_SIZE, resetKey);

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
          Lọc theo trạng thái đăng ký và loại hình địa hình — mỗi giải một cung đường riêng.
        </p>

        <div className="mt-4 relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 space-y-3">
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
            <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
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
      </div>

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
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 list-stagger">
            {pager.pageItems.map((event) => (
              <EventCard key={event.id} event={event} />
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
