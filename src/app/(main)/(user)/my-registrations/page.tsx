"use client";
import { getAuthUser } from "@/stores/auth-store";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ticket,
  Camera,
  QrCode,
  LogIn,
  Clock,
  XCircle,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { getMyRegistrations, cancelRegistration, getEventById } from "@/api/events";
import { RegistrationDto, RaceEventDto } from "@/dto/event.dto";
import {
  formatPrice,
  formatDate,
  getRegistrationStatusLabel,
  getRegistrationStatusColor,
} from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";
import RunnerPageHeader from "@/components/runner/RunnerPageHeader";
import FilterChip from "@/components/events/FilterChip";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 4;

type FilterKey =
  | "all"
  | "pending_payment"
  | "pending_approval"
  | "confirmed"
  | "rejected"
  | "cancelled";

export default function MyRegistrationsPage() {
  const [list, setList] = useState<RegistrationDto[]>([]);
  const [eventMap, setEventMap] = useState<Record<string, RaceEventDto | undefined>>({});
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const reload = async () => {
    const apiList = await getMyRegistrations();
    const regs = Array.isArray(apiList) ? apiList : [];
    setList(regs);
    const ids = [...new Set(regs.map((r) => String(r.eventId)).filter(Boolean))];
    const pairs = await Promise.all(
      ids.map(async (id) => {
        try {
          return [id, await getEventById(id)] as const;
        } catch {
          return [id, undefined] as const;
        }
      })
    );
    setEventMap(Object.fromEntries(pairs));
  };

  useEffect(() => {
    const authenticatedUser = getAuthUser();
    setLoggedIn(Boolean(authenticatedUser));
    if (!authenticatedUser) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await reload();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được vé."));
          setList([]);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  const handleCancel = async (regId: string) => {
    if (!window.confirm("Hủy đơn chờ thanh toán này? Bạn có thể đăng ký lại sau.")) return;
    setCancellingId(regId);
    setError(null);
    try {
      await cancelRegistration(regId);
      await reload();
    } catch (e) {
      setError(getApiErrorMessage(e, "Hủy đơn thất bại."));
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = useMemo(
    () => list.filter((r) => (filter === "all" ? true : r.status === filter)),
    [list, filter]
  );
  const pager = usePagedList(filtered, PAGE_SIZE, filter);

  if (!ready) {
    return (
      <PageLoading
        title="Đang tải vé của bạn…"
        description="Lấy danh sách đăng ký và mã QR."
        icon={Ticket}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <p className="text-muted-foreground">Đăng nhập để xem vé và đăng ký của bạn.</p>
        <Link
          href="/login?from=/my-registrations"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL_FORM} py-7 space-y-5`}>
      <RunnerPageHeader title="Vé của tôi" description="Xem mã QR, theo dõi duyệt hồ sơ và tiếp tục các đăng ký đang chờ thanh toán." actions={
        <Button asChild className="min-h-11 rounded-xl bg-orange-600 px-4 text-white hover:bg-orange-700"><Link href="/events">Khám phá giải chạy</Link></Button>
      } />

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{error}</p>
          <Button type="button" variant="outline" onClick={() => { setReady(false); setLoadAttempt((attempt) => attempt + 1); }} className="mt-3 min-h-11 bg-card">Thử lại</Button>
        </div>
      )}

      <div role="group" aria-label="Lọc vé theo trạng thái" className="flex flex-wrap gap-2">
        {(
          [
            { key: "all", label: "Tất cả" },
            { key: "pending_payment", label: "Chờ thanh toán" },
            { key: "pending_approval", label: "Chờ duyệt" },
            { key: "confirmed", label: "Đã xác nhận" },
            { key: "rejected", label: "Từ chối" },
            { key: "cancelled", label: "Đã hủy" },
          ] as const
        ).map((f) => (
          <FilterChip
            key={f.key}
            active={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </FilterChip>
        ))}
      </div>

      {!(error && list.length === 0) && (filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center space-y-3">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="font-bold text-lg">{list.length ? "Không có vé ở trạng thái này" : "Bạn chưa có vé nào"}</h2>
          <p className="text-sm text-muted-foreground">{list.length ? "Chọn trạng thái khác hoặc xem tất cả vé của bạn." : "Tìm giải chạy phù hợp và đăng ký để bắt đầu hành trình."}</p>
          {list.length ? <Button type="button" variant="outline" className="min-h-11" onClick={() => setFilter("all")}>Xem tất cả vé</Button> : <Link
            href="/events"
            className="inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Xem giải đang mở
          </Link>}
        </div>
      ) : (
        <>
          <div
            className={`list-fade ${pager.visible ? "list-fade-in" : "list-fade-out"} space-y-4 list-stagger min-h-[200px]`}
          >
            {pager.turning
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 rounded-2xl border bg-muted/40 skeleton-shimmer"
                  />
                ))
              : pager.pageItems.map((reg) => {
                  const event = eventMap[String(reg.eventId)];
                  const price =
                    (typeof reg.price === "number" && Number.isFinite(reg.price)
                      ? reg.price
                      : null) ??
                    (typeof reg.distancePrice === "number" &&
                    Number.isFinite(reg.distancePrice)
                      ? reg.distancePrice
                      : 0);
                  const statusLine = reg.bibNumber
                    ? `BIB ${reg.bibNumber} · ${getRegistrationStatusLabel(reg.status)}`
                    : getRegistrationStatusLabel(reg.status);
                  return (
                    <article
                      key={reg.id}
                      className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:border-orange-500/30 transition-colors [&_a]:min-h-11 [&_button]:min-h-11 [&_a]:rounded-xl [&_button]:rounded-xl"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative sm:w-40 h-28 sm:min-h-[8.5rem] shrink-0 bg-muted">
                          {event?.bannerImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mediaDisplayUrl(event.bannerImage)}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <div
                              className="absolute inset-0"
                              style={{
                                background:
                                  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)",
                              }}
                            />
                          )}
                        </div>
                        <div className="flex-1 p-4 sm:p-5 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getRegistrationStatusColor(reg.status)}`}
                              >
                                {statusLine}
                              </span>
                              <h2 className="text-lg font-bold mt-1">
                                {reg.eventName || event?.name || "Giải chạy"}
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                {reg.distanceName ||
                                  (reg.distanceKm ? `${reg.distanceKm}K` : "—")}{" "}
                                · {reg.fullName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {reg.createdAt
                                  ? `Đăng ký: ${new Date(reg.createdAt).toLocaleString("vi-VN")}`
                                  : ""}
                                {event ? ` · Ngày đua: ${formatDate(event.date)}` : ""}
                              </p>
                              {reg.status === "rejected" && reg.rejectionReason && (
                                <p className="mt-2 text-xs text-red-700 line-clamp-2">
                                  Lý do: {reg.rejectionReason}
                                </p>
                              )}
                            </div>
                            <p className="text-lg font-extrabold text-orange-600">
                              {formatPrice(price)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {reg.status === "pending_payment" && (
                              <>
                                <Link
                                  href={`/events/${reg.eventId}/payment?regId=${reg.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Thanh toán
                                </Link>
                                <button
                                  type="button"
                                  disabled={cancellingId === reg.id}
                                  onClick={() => void handleCancel(reg.id)}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 disabled:opacity-60"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  {cancellingId === reg.id ? "Đang hủy…" : "Hủy đơn"}
                                </button>
                              </>
                            )}
                            {reg.status === "pending_approval" && (
                              <Link
                                href={`/events/${reg.eventId}/pending?regId=${reg.id}`}
                                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                Xem chờ duyệt
                              </Link>
                            )}
                            {reg.status === "rejected" && (
                              <>
                                <Link
                                  href={`/my-registrations/${reg.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Chi tiết từ chối
                                </Link>
                                <Link
                                  href="/payments"
                                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                                >
                                  Lịch sử TT
                                </Link>
                              </>
                            )}
                            {reg.status === "confirmed" && (
                              <>
                                <Link
                                  href={`/my-registrations/${reg.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                                >
                                  <QrCode className="h-3.5 w-3.5" />
                                  Xem vé & QR
                                </Link>
                                {reg.bibNumber && (
                                  <Link
                                    href={`/photos?eventId=${reg.eventId}&bib=${encodeURIComponent(reg.bibNumber)}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                                  >
                                    <Camera className="h-3.5 w-3.5" />
                                    Tìm ảnh
                                  </Link>
                                )}
                              </>
                            )}
                            <Link
                              href={`/events/${reg.eventId}`}
                              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Chi tiết giải
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
          </div>

          <div className="border-t border-border/60 pt-4">
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
      ))}
    </div>
  );
}
