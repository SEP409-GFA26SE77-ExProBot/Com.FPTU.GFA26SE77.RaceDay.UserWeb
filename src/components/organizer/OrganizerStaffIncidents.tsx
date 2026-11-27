"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Loader2,
  MapPin,
  MapPinOff,
  RefreshCw,
  Search,
} from "lucide-react";
import { getEventById } from "@/api/events";
import {
  listStaffIncidents,
  type StaffIncident,
  type StaffIncidentKind,
  type StaffIncidentPage,
  type StaffIncidentType,
} from "@/api/staff-incidents";
import FilterChip from "@/components/events/FilterChip";
import Pagination from "@/components/ui/Pagination";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL } from "@/lib/page-shell";

const PAGE_SIZE = 20;
/** Trang tự tải lại để BTC thấy sự cố mới trong lúc giải diễn ra. */
const REFRESH_MS = 30_000;

const TYPE_LABELS: Record<StaffIncidentType, string> = {
  Logistics: "Hậu cần, phương tiện",
  Medical: "Y tế",
  CourseHazard: "Nguy hiểm trên đường chạy",
  Security: "An ninh",
  Weather: "Thời tiết",
  Other: "Khác",
};

const ROLE_LABELS: Record<string, string> = {
  "race-staff": "Nhân viên giải",
  photographer: "Nhiếp ảnh gia",
};

function roleLabel(role: string) {
  return role
    .split(",")
    .map((r) => ROLE_LABELS[r.trim()] ?? r.trim())
    .filter(Boolean)
    .join(", ");
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatDuration(fromIso: string, toMs: number) {
  const minutes = Math.max(0, Math.round((toMs - new Date(fromIso).getTime()) / 60_000));
  if (minutes < 1) return "dưới 1 phút";
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

function mapsUrl(item: StaffIncident) {
  return `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;
}

function LocationLink({ item }: { item: StaffIncident }) {
  if (item.latitude == null || item.longitude == null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <MapPinOff className="h-3.5 w-3.5" aria-hidden /> Không có vị trí
      </span>
    );
  }
  return (
    <a
      href={mapsUrl(item)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
    >
      <MapPin className="h-3.5 w-3.5" aria-hidden /> Xem vị trí
      {item.accuracyMeters != null ? ` (±${Math.round(item.accuracyMeters)} m)` : ""}
    </a>
  );
}

function StaffLine({ item }: { item: StaffIncident }) {
  return (
    <div>
      <p className="font-bold text-foreground">{item.staffName}</p>
      <p className="text-xs text-muted-foreground">
        {roleLabel(item.role)}
        {item.zoneName ? ` · ${item.zoneName}` : ""}
      </p>
    </div>
  );
}

function OutOfZoneRow({ item, now }: { item: StaffIncident; now: number }) {
  const outside = item.returnedAtUtc == null;
  return (
    <li
      className={`rounded-2xl border bg-card p-4 shadow-sm ${
        outside ? "border-red-300 bg-red-50/60" : "border-border/60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <StaffLine item={item} />
        {outside ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Đang ở ngoài vùng
          </span>
        ) : (
          <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            Đã vào lại vùng
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden /> Ra ngoài lúc {formatTime(item.occurredAtUtc)}
        </span>
        {item.returnedAtUtc ? <span>Vào lại lúc {formatTime(item.returnedAtUtc)}</span> : null}
        <span className="font-semibold text-foreground">
          {outside ? "Đã ở ngoài " : "Ở ngoài "}
          {formatDuration(
            item.occurredAtUtc,
            item.returnedAtUtc ? new Date(item.returnedAtUtc).getTime() : now,
          )}
        </span>
        <LocationLink item={item} />
      </div>
    </li>
  );
}

function ReportRow({ item }: { item: StaffIncident }) {
  return (
    <li className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <StaffLine item={item} />
        <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-800">
          {item.incidentType ? TYPE_LABELS[item.incidentType] ?? item.incidentType : "Báo cáo"}
        </span>
      </div>
      {item.description ? (
        <p className="mt-3 whitespace-pre-line text-sm text-foreground">{item.description}</p>
      ) : null}
      {item.photoUrl ? (
        <a
          href={mediaDisplayUrl(item.photoUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-fit"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaDisplayUrl(item.photoUrl)}
            alt={`Ảnh sự cố của ${item.staffName}`}
            className="h-40 max-w-full rounded-xl border object-cover"
            loading="lazy"
          />
        </a>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden /> {formatTime(item.occurredAtUtc)}
        </span>
        <LocationLink item={item} />
      </div>
    </li>
  );
}

export default function OrganizerStaffIncidents({ eventId }: { eventId: string }) {
  const [eventName, setEventName] = useState("");
  const [kind, setKind] = useState<StaffIncidentKind>("OutOfZone");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StaffIncidentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    getEventById(eventId)
      .then((event) => {
        if (!cancelled) setEventName(event.name);
      })
      .catch(() => {
        /* Tên giải chỉ để hiển thị; danh sách vẫn tải được. */
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  /** Spinner only for a manual refresh; the 30-second refresh runs quietly. */
  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const result = await listStaffIncidents(eventId, { kind, search, page, pageSize: PAGE_SIZE });
      if (id !== requestId.current) return;
      setData(result);
      setError(null);
      setNow(Date.now());
    } catch (e) {
      if (id !== requestId.current) return;
      setError(getApiErrorMessage(e, "Không tải được sự cố nhân viên."));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [eventId, kind, search, page]);

  useEffect(() => {
    // First load right away, then every 30 s while the tab is visible.
    const first = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const refresh = () => {
    setRefreshing(true);
    void load();
  };

  const changeKind = (next: StaffIncidentKind) => {
    if (next === kind) return;
    setKind(next);
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className={`${PAGE_SHELL} space-y-5 py-1`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Sự cố nhân viên
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            {eventName || "Giải của bạn"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nhân sự ra ngoài vùng hoạt động và các sự cố được báo cáo từ app RaceDay Staff. Tự cập nhật mỗi 30 giây.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden /> Làm mới
        </button>
      </div>

      {data && data.currentlyOutsideCount > 0 ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {data.currentlyOutsideCount} nhân sự đang ở ngoài vùng hoạt động.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={kind === "OutOfZone"} onClick={() => changeKind("OutOfZone")}>
          Ra ngoài vùng ({data?.outOfZoneCount ?? 0})
        </FilterChip>
        <FilterChip active={kind === "Report"} onClick={() => changeKind("Report")}>
          Báo cáo sự cố ({data?.reportCount ?? 0})
        </FilterChip>
        <label className="relative ml-auto w-full sm:w-72">
          <span className="sr-only">Tìm sự cố</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tên, vai trò, vùng, mô tả…"
            className="h-11 rounded-xl pl-9"
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" aria-hidden />
          Đang tải sự cố nhân viên…
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {search
            ? "Không có sự cố khớp từ khóa."
            : kind === "OutOfZone"
              ? "Chưa có nhân sự nào ra ngoài vùng hoạt động."
              : "Chưa có báo cáo sự cố nào."}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {data.items.map((item) =>
              item.kind === "OutOfZone" ? (
                <OutOfZoneRow key={item.id} item={item} now={now} />
              ) : (
                <ReportRow key={item.id} item={item} />
              ),
            )}
          </ul>
          <Pagination
            page={data.page}
            totalPages={totalPages}
            totalItems={data.total}
            pageSize={data.pageSize}
            onChange={setPage}
            disabled={refreshing}
          />
        </>
      )}
    </div>
  );
}
