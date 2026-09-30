"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { Ticket, Camera, QrCode, LogIn, Award } from "lucide-react";
import {
  loadRegistrations,
  type RunnerRegistration,
} from "@/data/mock-registrations";
import { formatPrice, formatDate, getEventById } from "@/data/mock-events";
import { getResultByEventAndBib } from "@/data/mock-results";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";

const PAGE_SIZE = 4;

export default function MyRegistrationsPage() {
  const [list, setList] = useState<RunnerRegistration[]>([]);
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [filter, setFilter] = useState<"all" | "confirmed" | "finished">("all");

  useEffect(() => {
    const token = Cookies.get("access_token");
    setLoggedIn(Boolean(token));
    setList(loadRegistrations());
    setReady(true);
  }, []);

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
      <div className="rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-5 sm:p-6">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1.5">
          Vé của tôi
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Vé / đăng ký của tôi</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Quản lý BIB, mã QR check-in và chứng nhận (nếu đã hoàn thành).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all", label: "Tất cả" },
            { key: "confirmed", label: "Đã xác nhận" },
            { key: "finished", label: "Đã về đích" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
              filter === f.key
                ? "bg-orange-500 text-white border-orange-600"
                : "bg-white text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center space-y-3">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="font-bold text-lg">Chưa có vé nào</h2>
          <p className="text-sm text-muted-foreground">Đăng ký một giải để nhận BIB và mã QR.</p>
          <Link
            href="/events"
            className="inline-flex rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Xem giải đang mở
          </Link>
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
                  const event = getEventById(reg.event_id);
                  const result = getResultByEventAndBib(reg.event_id, reg.bib);
                  return (
                    <article
                      key={reg.id}
                      className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm hover:border-orange-500/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative sm:w-40 h-28 sm:min-h-[8.5rem] shrink-0 bg-muted">
                          {event?.bannerImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={event.bannerImage}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <div
                              className="absolute inset-0"
                              style={{ background: event?.bannerGradient || "#f97316" }}
                            />
                          )}
                        </div>
                        <div className="flex-1 p-4 sm:p-5 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                                BIB {reg.bib} ·{" "}
                                {reg.status === "finished" ? "Đã về đích" : "Đã xác nhận"}
                              </p>
                              <h2 className="text-lg font-bold mt-0.5">{reg.eventTitle}</h2>
                              <p className="text-sm text-muted-foreground">
                                {reg.distanceLabel} · {reg.fullName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Đăng ký: {new Date(reg.registeredAt).toLocaleString("vi-VN")}
                                {event ? ` · Ngày đua: ${formatDate(event.date)}` : ""}
                              </p>
                            </div>
                            <p className="text-lg font-extrabold text-orange-600">
                              {formatPrice(reg.price)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/my-registrations/${reg.id}`}
                              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              Xem vé & QR
                            </Link>
                            <Link
                              href={`/photos?bib=${reg.bib}`}
                              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              Tìm ảnh
                            </Link>
                            {result?.certificateId && (
                              <Link
                                href={`/certificates/${result.certificateId}`}
                                className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                <Award className="h-3.5 w-3.5" />
                                Chứng nhận
                              </Link>
                            )}
                            {result && (
                              <Link
                                href={`/results/${reg.event_id}?bib=${reg.bib}`}
                                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                              >
                                Kết quả
                              </Link>
                            )}
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
      )}
    </div>
  );
}
