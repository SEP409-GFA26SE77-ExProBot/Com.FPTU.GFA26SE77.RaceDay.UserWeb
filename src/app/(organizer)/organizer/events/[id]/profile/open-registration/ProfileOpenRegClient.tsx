"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Lock,
  Send,
  Unlock,
} from "lucide-react";
import { getEventById } from "@/api/events";
import {
  closeEventRegistration,
  openEventRegistration,
} from "@/api/event-packages";
import { submitRaceEvent } from "@/api/organizer";
import { listEventStaff } from "@/api/event-staff";
import { hasEventCourse } from "@/api/race-map";
import OrganizerEventStatusModal from "@/components/events/OrganizerEventStatusModal";
import type { RaceEventDto, TicketPricingDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { getOrganizerStatusLabel, getStatusColor } from "@/lib/format";
import {
  canOpenRegistration,
  canSubmitForApproval,
  PROFILE_DOC_TYPES,
  statusKey,
} from "../_shared";

type CheckItem = {
  id: string;
  label: string;
  ok: boolean;
  href?: string;
};

function hasPricing(event: RaceEventDto): boolean {
  const raw = event.ticketPricing as TicketPricingDto | undefined;
  if (raw?.phases?.some((p) =>
    Object.values(p.pricesByDistanceName || {}).some((v) => Number(v) > 0)
  )) {
    return true;
  }
  if (raw?.byDistanceName) {
    for (const row of Object.values(raw.byDistanceName)) {
      if (Number(row?.basePrice) > 0) return true;
      if (row?.phases?.some((p) => Number(p.price) > 0)) return true;
    }
  }
  return (event.distances || []).some((d) => Number(d.price) > 0);
}

/** Có dữ liệu cung đường thật (không tính tọa độ start placeholder). */
function isNonEmptyRoute(v: unknown): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length >= 2;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t || t === "{}" || t === "[]" || t === "null") return false;
    try {
      return isNonEmptyRoute(JSON.parse(t));
    } catch {
      return t.length > 8;
    }
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.coordinates) && o.coordinates.length > 0) return true;
    if (Array.isArray(o.features) && o.features.length > 0) return true;
    if (Array.isArray(o.points) && o.points.length >= 2) return true;
    const keys = Object.keys(o);
    return keys.length > 0 && JSON.stringify(o) !== "{}";
  }
  return false;
}

/** Route gắn trên distance DTO (RouteGeometryJson → leaflet/geo/osrm). */
function distanceHasRouteGeometry(event: RaceEventDto): boolean {
  return (event.distances || []).some(
    (d) =>
      isNonEmptyRoute(d.leafletPolyline) ||
      isNonEmptyRoute(d.geoJson) ||
      isNonEmptyRoute(d.osrmWaypoints)
  );
}

function requiredDocsOk(event: RaceEventDto): boolean {
  const keys = new Set(
    (event.documents || [])
      .filter((d) => d.fileUrl)
      .map((d) => d.documentKey)
  );
  return PROFILE_DOC_TYPES.filter((d) => d.required).every((d) => keys.has(d.id));
}

export default function ProfileOpenRegClient() {
  const params = useParams();
  const eventId = String(params?.id || "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [staffCount, setStaffCount] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    const data = await getEventById(eventId);
    setEvent(data);

    try {
      const staff = await listEventStaff(eventId);
      setStaffCount(Array.isArray(staff) ? staff.length : 0);
    } catch {
      setStaffCount(0);
    }

    // Map module course (polyline) — không tin tọa độ start seed.
    if (distanceHasRouteGeometry(data)) {
      setMapReady(true);
    } else {
      const distances = data.distances || [];
      if (distances.length === 0) {
        setMapReady(false);
      } else {
        const flags = await Promise.all(
          distances.map((d) => hasEventCourse(eventId, d.id).catch(() => false))
        );
        setMapReady(flags.some(Boolean));
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
          setError(getApiErrorMessage(e, "Không tải được hồ sơ."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, load]);

  const checks: CheckItem[] = useMemo(() => {
    if (!event) return [];
    const base = `/organizer/events/${eventId}/profile`;
    return [
      {
        id: "basic",
        label: "Thông tin cơ bản (tên, địa điểm, ngày)",
        ok: Boolean(
          event.name?.trim() &&
            event.location?.trim() &&
            !/chưa cập nhật/i.test(event.location) &&
            event.date
        ),
        href: `${base}/basic`,
      },
      {
        id: "distances",
        label: "Ít nhất 1 cự ly",
        ok: (event.distances?.length || 0) >= 1,
        href: `${base}/distances`,
      },
      {
        id: "pricing",
        label: "Đã cấu hình giá vé",
        ok: hasPricing(event),
        href: `${base}/distances`,
      },
      {
        id: "docs",
        label: "Đủ tài liệu bắt buộc",
        ok: requiredDocsOk(event),
        href: `${base}/documents`,
      },
      {
        id: "map",
        label: "Đã thiết lập bản đồ / cung đường",
        ok: mapReady,
        href: `/organizer/events/${eventId}/setup-map`,
      },
      {
        id: "staff",
        label: "Có ít nhất 1 nhân sự",
        ok: staffCount >= 1,
        href: `/organizer/events/${eventId}/staff`,
      },
      {
        id: "window",
        label: "Đã đặt lịch mở / đóng ĐK (khuyến nghị)",
        ok: Boolean(
          event.registrationOpensAtUtc || event.registrationClosesAtUtc
        ),
        href: `${base}/basic`,
      },
    ];
  }, [event, eventId, staffCount, mapReady]);

  const requiredReady = checks
    .filter((c) => c.id !== "window")
    .every((c) => c.ok);
  const sk = event ? statusKey(event.status) : "";
  const isOpen = sk === "registration-open";
  const canOpen = event ? canOpenRegistration(event.status) && requiredReady : false;
  const canSubmit = event ? canSubmitForApproval(event.status) : false;
  const isPending =
    sk === "pending" || sk === "pending-approval";
  const isRejected = sk === "rejected";
  const handleSubmitApproval = async () => {
    if (!canSubmit || acting) return;
    if (!requiredReady) {
      setError("Hoàn thành checklist bắt buộc trước khi gửi admin duyệt.");
      return;
    }
    setActing(true);
    setError(null);
    try {
      await submitRaceEvent(eventId);
      await load();
      notify("Đã gửi hồ sơ cho admin duyệt.");
    } catch (e) {
      setError(getApiErrorMessage(e, "Gửi duyệt thất bại."));
    } finally {
      setActing(false);
    }
  };

  const handleOpen = async () => {
    if (!canOpen || acting) return;
    setActing(true);
    setError(null);
    try {
      await openEventRegistration(eventId);
      await load();
      notify("Đã mở đăng ký.");
    } catch (e) {
      setError(getApiErrorMessage(e, "Mở ĐK thất bại."));
    } finally {
      setActing(false);
    }
  };

  const handleClose = async () => {
    if (!isOpen || acting) return;
    setActing(true);
    setError(null);
    try {
      await closeEventRegistration(eventId);
      await load();
      notify("Đã đóng đăng ký.");
    } catch (e) {
      setError(getApiErrorMessage(e, "Đóng ĐK thất bại."));
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Hồ sơ giải
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">Xét mở chính thức</h1>
          {isRejected ? (
            <button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-extrabold transition hover:ring-2 hover:ring-red-300 ${getStatusColor(event.status)}`}
              title="Xem lý do từ chối & hồ sơ xét duyệt"
            >
              {getOrganizerStatusLabel(event.status)}
            </button>
          ) : (
            <span
              className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${getStatusColor(event.status)}`}
            >
              {getOrganizerStatusLabel(event.status)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canSubmit && (
            <button
              type="button"
              disabled={acting || !requiredReady}
              onClick={() => void handleSubmitApproval()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 disabled:opacity-50"
              title={
                requiredReady
                  ? "Gửi hồ sơ cho admin duyệt"
                  : "Hoàn thành checklist bắt buộc trước"
              }
            >
              {acting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Gửi admin duyệt giải
            </button>
          )}
          {isPending && (
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800">
              Đang chờ admin duyệt
            </span>
          )}
          {isOpen ? (
            <button
              type="button"
              disabled={acting}
              onClick={() => void handleClose()}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            >
              {acting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Đóng ĐK ngay
            </button>
          ) : canOpenRegistration(event.status) || sk === "approved" ? (
            <button
              type="button"
              disabled={!canOpen || acting}
              onClick={() => void handleOpen()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {acting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              Mở ĐK ngay
            </button>
          ) : null}
        </div>
      </div>

      {isRejected && (
        <button
          type="button"
          onClick={() => setStatusModalOpen(true)}
          className="flex w-full items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/5 p-4 text-left transition hover:border-red-400 hover:bg-red-500/10"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-700">
              Hồ sơ bị từ chối — xem xét duyệt
            </p>
            <p className="mt-1 text-sm text-red-600/95">
              {event.rejectionReason?.trim() ||
                "Admin đã từ chối hồ sơ. Bấm để xem chi tiết xét duyệt và lý do."}
            </p>
            <p className="mt-2 text-xs font-semibold text-orange-600 underline underline-offset-2">
              Mở mục xét duyệt →
            </p>
          </div>
        </button>
      )}

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
        <h2 className="text-sm font-bold">Lịch đăng ký</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Giờ mở đăng ký</p>
            <p className="mt-1 font-semibold">
              {event.registrationOpensAtUtc
                ? new Date(event.registrationOpensAtUtc).toLocaleString("vi-VN")
                : "— Chưa đặt"}
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">Giờ đóng đăng ký</p>
            <p className="mt-1 font-semibold">
              {event.registrationClosesAtUtc
                ? new Date(event.registrationClosesAtUtc).toLocaleString("vi-VN")
                : "— Chưa đặt"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Sau khi admin duyệt giải, hệ thống sẽ tự mở / đóng đăng ký đúng lịch đã
          đặt. Bạn vẫn có thể mở hoặc đóng thủ công bằng nút bên trên.
        </p>
        {canSubmit && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Hoàn tất checklist → bấm <strong>Gửi admin duyệt giải</strong>. Chỉ
            sau khi admin duyệt mới mở được đăng ký.
          </p>
        )}
        {isPending && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            Hồ sơ đã gửi — đang chờ admin duyệt. Không cần gửi lại trừ khi bị từ
            chối.
          </p>
        )}
        {sk === "approved" && (
          <p className="mt-2 text-xs font-medium text-emerald-700">
            Admin đã duyệt — có thể mở đăng ký thủ công hoặc chờ lịch tự mở.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold">Checklist sẵn sàng</h2>
        <ul className="space-y-2">
          {checks.map((c) => (
            <li
              key={c.id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                c.ok
                  ? "border-border/50"
                  : "border-amber-300/80 bg-amber-50/60"
              }`}
            >
              <div className="flex items-center gap-2 text-sm">
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-amber-500" />
                )}
                <span className={c.ok ? "text-foreground" : "font-medium text-amber-900"}>
                  {c.label}
                  {c.id === "window" && !c.ok ? (
                    <span className="ml-1 font-normal text-muted-foreground">
                      (khuyến nghị)
                    </span>
                  ) : null}
                </span>
              </div>
              {c.href && !c.ok && (
                <Link
                  href={c.href}
                  className="shrink-0 text-xs font-bold text-orange-600 hover:underline"
                >
                  Bổ sung
                </Link>
              )}
            </li>
          ))}
        </ul>
        {isRejected && (
          <p className="mt-3 text-xs text-red-700">
            Hồ sơ bị từ chối: sửa theo lý do admin, đủ checklist, rồi bấm{" "}
            <span className="font-bold">Gửi admin duyệt giải</span> lại.{" "}
            <button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              className="font-bold text-orange-600 underline underline-offset-2"
            >
              Xem lại xét duyệt
            </button>
          </p>
        )}
      </section>

      {statusModalOpen ? (
        <OrganizerEventStatusModal
          eventId={eventId}
          listStatus={event.status}
          open
          onClose={() => setStatusModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
