"use client";
import { getAuthUser } from "@/stores/auth-store";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Ticket,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  LogIn,
  Flag,
} from "lucide-react";
import { getEvents, getMyRegistrations, getEventById } from "@/api/events";
import {
  RaceEventListItemDto,
  RaceEventDto,
  RegistrationDto,
} from "@/dto/event.dto";
import EventCard from "@/components/events/EventCard";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";
import { getApiErrorMessage } from "@/lib/error";
import FilterChip from "@/components/events/FilterChip";
import RunnerPageHeader from "@/components/runner/RunnerPageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PAGE_SIZE = 6;

/** Lọc theo trạng thái đăng ký của user */
const REG_STATUS_FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "pending_payment", label: "Chờ thanh toán" },
  { key: "pending_approval", label: "Chờ duyệt" },
  { key: "confirmed", label: "Đã đăng ký" },
  { key: "finished", label: "Đã hoàn thành" },
  { key: "rejected", label: "Bị từ chối" },
  { key: "cancelled", label: "Đã hủy" },
] as const;

type RegStatusKey = (typeof REG_STATUS_FILTERS)[number]["key"];

type RegisteredRow = {
  event: RaceEventListItemDto;
  regStatus: string;
  regId: string;
};

function toListItem(ev: RaceEventDto | RaceEventListItemDto): RaceEventListItemDto {
  return {
    id: ev.id,
    name: ev.name,
    tagline: ev.tagline,
    bannerImage: ev.bannerImage,
    location: ev.location,
    date: ev.date,
    status: ev.status,
    totalRunners: ev.totalRunners,
    distances: ev.distances,
    organizerName:
      "organizerName" in ev
        ? ev.organizerName
        : ev.organizer?.name,
  };
}

function rankRegStatus(s: string): number {
  if (s === "confirmed" || s === "finished") return 4;
  if (s === "pending_approval") return 3;
  if (s === "pending_payment") return 2;
  if (s === "rejected") return 1;
  return 0;
}

function eventCity(event: RaceEventListItemDto): string {
  const parts = (event.location || "").split(",").map((s) => s.trim());
  return parts[parts.length - 1] || event.location || "Khác";
}

export default function RegisteredEventsClient() {
  const [boot, setBoot] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [rows, setRows] = useState<RegisteredRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegStatusKey>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const authenticatedUser = getAuthUser();
    setLoggedIn(Boolean(authenticatedUser));
    if (!authenticatedUser) {
      setBoot(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [regsRaw, catalogRaw] = await Promise.all([
          getMyRegistrations(),
          getEvents().catch(() => [] as RaceEventListItemDto[]),
        ]);
        if (cancelled) return;

        const regs = Array.isArray(regsRaw) ? regsRaw : [];
        const catalog = Array.isArray(catalogRaw) ? catalogRaw : [];
        const byEventId = new Map<string, RaceEventListItemDto>();
        for (const e of catalog) byEventId.set(String(e.id), e);

        /** eventId → registration ưu tiên cao nhất */
        const bestReg = new Map<string, RegistrationDto>();
        for (const r of regs) {
          const id = String(r.eventId);
          const prev = bestReg.get(id);
          if (!prev || rankRegStatus(r.status) > rankRegStatus(prev.status)) {
            bestReg.set(id, r);
          }
        }

        const missingIds = [...bestReg.keys()].filter((id) => !byEventId.has(id));
        const fetched = await Promise.all(
          missingIds.map(async (id) => {
            try {
              return toListItem(await getEventById(id));
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        for (const ev of fetched) {
          if (ev) byEventId.set(String(ev.id), ev);
        }

        const next: RegisteredRow[] = [];
        for (const [eventId, reg] of bestReg) {
          const event = byEventId.get(eventId);
          if (!event) {
            next.push({
              event: {
                id: eventId,
                name: reg.eventName || "Giải chạy",
                location: "",
                date: "",
                status: "registration-open",
              },
              regStatus: reg.status,
              regId: reg.id,
            });
            continue;
          }
          next.push({
            event,
            regStatus: reg.status,
            regId: reg.id,
          });
        }

        next.sort((a, b) =>
          (b.event.date || "").localeCompare(a.event.date || "")
        );
        setRows(next);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được giải đã đăng ký."));
          setRows([]);
        }
      } finally {
        if (!cancelled) setBoot(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        row.event.name.toLowerCase().includes(q) ||
        (row.event.location || "").toLowerCase().includes(q) ||
        eventCity(row.event).toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || row.regStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchQuery, statusFilter]);

  const resetKey = `${searchQuery}|${statusFilter}`;
  const pager = usePagedList(filtered, PAGE_SIZE, resetKey);
  const activeFilterCount = [statusFilter !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  if (boot) {
    return (
      <PageLoading
        title="Đang tải giải đã đăng ký…"
        description="RaceDay đang lấy các giải bạn đã tham gia."
        icon={Ticket}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className={`${PAGE_SHELL} py-16 flex flex-col items-center text-center gap-4`}>
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-extrabold">Đăng nhập để xem giải đã đăng ký</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Danh sách các giải bạn đã đăng ký, kèm trạng thái thanh toán và duyệt hồ sơ.
        </p>
        <Link
          href="/login?from=/registered-events"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL} py-7 sm:py-8`}>
      <RunnerPageHeader title="Giải đã đăng ký" description="Các cột mốc trên hành trình của bạn. Theo dõi giải chạy và trạng thái đăng ký tại đây." />
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <Label htmlFor="registered-event-search" className="mb-2 block text-sm font-semibold">Tìm trong các giải của bạn</Label>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="registered-event-search"
              type="search"
              placeholder="Tìm giải đã đăng ký..."
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
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="registration-filters"
            aria-label={`Bộ lọc đăng ký${activeFilterCount ? `, ${activeFilterCount} đang áp dụng` : ""}`}
            className={`shrink-0 inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-3 sm:px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-orange-600 ${
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
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => { setBoot(true); setLoadAttempt((attempt) => attempt + 1); }}
            className="mt-3 min-h-11 rounded-xl bg-orange-700 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-800"
          >
            Thử lại
          </button>
        </div>
      )}

      {filtersOpen && (
        <div id="registration-filters" className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">Bộ lọc đăng ký</p>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-11 px-2 text-sm font-semibold text-orange-700 hover:underline"
                >
                  Xóa hết
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                Đóng
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:w-28 sm:pt-2 shrink-0">
              Trạng thái ĐK
            </span>
            <div className="flex flex-wrap gap-2">
              {REG_STATUS_FILTERS.map((f) => (
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
        </div>
      )}

      {!error && <><div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-sm text-muted-foreground">
          Hiển thị {filtered.length} / {rows.length} giải
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:underline"
        >
          <Flag className="h-3.5 w-3.5" />
          Khám phá thêm giải
        </Link>
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center">
            <Ticket className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">
              {rows.length === 0
                ? "Bạn chưa đăng ký giải nào"
                : "Không tìm thấy giải"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {rows.length === 0
                ? "Khám phá giải đang mở và đăng ký để theo dõi tại đây."
                : "Thử đổi từ khóa hoặc bộ lọc trạng thái đăng ký."}
            </p>
            {rows.length === 0 ? (
              <Link
                href="/events"
                className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Khám phá giải chạy
              </Link>
            ) : (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 list-stagger">
            {pager.pageItems.map((row) => (
              <EventCard
                key={row.regId}
                event={row.event}
                statusMode="registration"
                myRegistrationStatus={row.regStatus}
                registrationId={row.regId}
              />
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
