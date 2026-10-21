"use client";
import { getAccessToken } from "@/lib/auth-cookie";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Flag,
  LayoutDashboard,
  LogIn,
  MapPin,
  PlusCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { listOrganizerEvents } from "@/api/organizer";
import type { RaceEventListItemDto } from "@/dto/event.dto";
import { formatDate } from "@/lib/format";
import {
  getMyEventsCardStatusColor,
  getMyEventsCardStatusLabel,
} from "@/lib/event-lifecycle";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";
import OrganizerEventStatusModal from "@/components/events/OrganizerEventStatusModal";

const PAGE_SIZE = 6;

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

type FilterKey =
  | "all"
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "started"
  | "ended";

function statusKey(status: string): string {
  return (status || "").toLowerCase().replace(/_/g, "-");
}

function eventEnded(event: RaceEventListItemDto): boolean {
  const key = statusKey(event.status);
  if (key === "completed" || key === "cancelled") return true;
  const end = (event.endDate || event.date || "").slice(0, 10);
  if (!end) return false;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return today > end;
}

function eventStarted(event: RaceEventListItemDto): boolean {
  if (eventEnded(event)) return false;
  const start = (event.date || "").slice(0, 10);
  if (!start) return false;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return today >= start;
}

function matchesFilter(event: RaceEventListItemDto, filter: FilterKey): boolean {
  if (filter === "all") return true;
  const key = statusKey(event.status);
  switch (filter) {
    case "draft":
      return key === "draft";
    case "pending":
      return key === "pending" || key === "pending-approval";
    case "rejected":
      return key === "rejected";
    case "ended":
      return eventEnded(event) || key === "closed" || key === "completed";
    case "started":
      return eventStarted(event);
    case "approved":
      // Đã duyệt / mở ĐK nhưng chưa tới ngày tổ chức và chưa kết thúc
      return (
        !eventStarted(event) &&
        !eventEnded(event) &&
        (key === "approved" ||
          key === "published" ||
          key === "registration-open" ||
          key === "closed")
      );
    default:
      return true;
  }
}

/** Đã duyệt / mở ĐK — CTA “Xem chi tiết” */
function isApprovedOrOpen(status: string): boolean {
  const key = statusKey(status);
  return (
    key === "approved" ||
    key === "published" ||
    key === "registration-open" ||
    key === "closed" ||
    key === "completed"
  );
}

function isDraftStatus(status: string): boolean {
  return statusKey(status) === "draft";
}

function isPendingStatus(status: string): boolean {
  const key = statusKey(status);
  return key === "pending" || key === "pending-approval";
}

function isRejectedStatus(status: string): boolean {
  return statusKey(status) === "rejected";
}

/** Chờ duyệt / bị từ chối → vẫn vào organizer panel, modal optional */
function opensStatusModal(status: string): boolean {
  return false;
}

function manageCardCta(status: string): {
  label: string;
  tone: "orange" | "amber" | "red";
} {
  if (isDraftStatus(status)) {
    return { label: "Tiếp tục đăng ký", tone: "orange" };
  }
  if (isApprovedOrOpen(status)) {
    return { label: "Xem chi tiết", tone: "orange" };
  }
  if (isRejectedStatus(status)) {
    return { label: "Giải bị từ chối · Xem lý do", tone: "red" };
  }
  if (isPendingStatus(status)) {
    return { label: "Đang chờ duyệt · Xem hồ sơ", tone: "amber" };
  }
  return { label: "Xem chi tiết", tone: "orange" };
}

/**
 * Chip theo tên cự ly lúc tạo giải (`distances[].name`).
 * Fallback km nếu thiếu tên. Không dùng `distanceTypes` (road/trail…).
 */
function distanceChipLabels(event: RaceEventListItemDto): string[] {
  const distances = event.distances || [];
  if (!distances.length) return [];

  const labels = distances
    .map((d) => {
      const name = (d.name || "").trim();
      if (name) return name;
      if (d.distanceKm != null && Number.isFinite(Number(d.distanceKm))) {
        return `${d.distanceKm}K`;
      }
      return "";
    })
    .filter(Boolean);

  return [...new Set(labels)].slice(0, 4);
}

export default function MyEventsClient() {
  const [list, setList] = useState<RaceEventListItemDto[]>([]);
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [statusModal, setStatusModal] = useState<{
    id: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    setLoggedIn(Boolean(token));
    if (!token) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const items = await listOrganizerEvents();
        if (!cancelled) {
          setList(items);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được giải của bạn."));
          setList([]);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => list.filter((e) => matchesFilter(e, filter)),
    [list, filter]
  );
  const pager = usePagedList(filtered, PAGE_SIZE, filter);

  if (!ready) {
    return (
      <PageLoading
        title="Đang tải giải của bạn…"
        description="Lấy danh sách giải theo tài khoản đang đăng nhập."
        icon={LayoutDashboard}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className={`${PAGE_SHELL} py-16 text-center`}>
        <LogIn className="mx-auto h-10 w-10 text-orange-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-foreground">
          Đăng nhập để quản lý giải
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Danh sách giải gắn với tài khoản của bạn.
        </p>
        <Link
          href="/login?from=/my-events"
          className="mt-6 inline-flex rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "draft", label: "Chưa duyệt" },
    { key: "pending", label: "Chờ duyệt" },
    { key: "approved", label: "Đã duyệt" },
    { key: "rejected", label: "Đã từ chối" },
    { key: "started", label: "Đã bắt đầu" },
    { key: "ended", label: "Đã kết thúc" },
  ];

  return (
    <div className={`${PAGE_SHELL} py-8 sm:py-10`}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-500">
            Quản lý giải
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Giải của tôi
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Theo tài khoản đang đăng nhập. Bấm vào giải để xem chi tiết và thao
            tác quản lý.
          </p>
        </div>
        <Link
          href="/events/create"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/35"
        >
          <PlusCircle className="h-4 w-4" />
          Tạo giải mới
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              filter === f.key
                ? "bg-orange-500/15 text-orange-600"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
          <Flag className="mx-auto h-10 w-10 text-orange-500" />
          <h2 className="mt-3 text-lg font-bold text-foreground">
            Chưa có giải nào
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo giải mới hoặc đổi bộ lọc trạng thái.
          </p>
          <Link
            href="/events/create"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
          >
            <PlusCircle className="h-4 w-4" />
            Tạo giải
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pager.pageItems.map((event) => (
              <ManageEventCard
                key={event.id}
                event={event}
                onOpenStatusModal={() =>
                  setStatusModal({ id: event.id, status: event.status })
                }
              />
            ))}
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
        </>
      )}

      {statusModal ? (
        <OrganizerEventStatusModal
          eventId={statusModal.id}
          listStatus={statusModal.status}
          open
          onClose={() => setStatusModal(null)}
        />
      ) : null}
    </div>
  );
}

function ManageEventCard({
  event,
  onOpenStatusModal,
}: {
  event: RaceEventListItemDto;
  onOpenStatusModal: () => void;
}) {
  const chips = distanceChipLabels(event);
  const total = event.totalRunners ?? 0;
  const active = event.activeRunners ?? 0;
  const pct = total > 0 ? Math.round((active / total) * 100) : 0;
  const cta = manageCardCta(event.status);
  const statusLabel = getMyEventsCardStatusLabel(event);
  const href = `/organizer/events/${event.id}`;

  const cardClass =
    "group block w-full overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/8";

  const body = (
    <>
      <div className="relative h-40 overflow-hidden">
        {event.bannerImage ? (
          <Image
            src={mediaDisplayUrl(event.bannerImage)}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: DEFAULT_GRADIENT }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/35" />
        <span
          className={`absolute left-3 top-3 inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-extrabold shadow-md ring-1 ring-white/40 ${getMyEventsCardStatusColor(
            statusLabel
          )}`}
        >
          {statusLabel}
        </span>
        {chips.length > 0 ? (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {chips.map((label) => (
              <span
                key={label}
                className="rounded-md bg-zinc-950 px-2 py-0.5 text-[11px] font-extrabold text-white ring-2 ring-white/80"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-orange-600">
          {event.name}
        </h2>
        {event.tagline ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {event.tagline}
          </p>
        ) : null}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span className="truncate">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {active.toLocaleString("vi-VN")} /{" "}
                {total.toLocaleString("vi-VN")} VĐV
              </span>
            </div>
            <span className="font-semibold text-foreground/80">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        <div
          className={`flex items-center justify-between gap-2 pt-1 text-sm font-bold ${
            cta.tone === "red"
              ? "text-red-600"
              : cta.tone === "orange"
                ? "text-orange-600"
                : "text-amber-700"
          }`}
        >
          <span className="line-clamp-1">{cta.label}</span>
          <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onOpenStatusModal} className={cardClass}>
      {body}
    </button>
  );
}
