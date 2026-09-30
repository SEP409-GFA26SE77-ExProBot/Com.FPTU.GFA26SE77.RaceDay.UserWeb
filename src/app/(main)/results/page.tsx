"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Trophy, Medal, Flag, ChevronRight } from "lucide-react";
import { MOCK_EVENTS, formatDate, getStatusLabel } from "@/data/mock-events";
import { MOCK_RUNNER_RESULTS, getLeaderboard } from "@/data/mock-results";
import { PAGE_SHELL } from "@/lib/page-shell";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";

const EVENT_PAGE_SIZE = 6;

export default function ResultsPage() {
  const publishedEventIds = useMemo(
    () =>
      new Set([
        ...MOCK_RUNNER_RESULTS.map((r) => r.eventId),
        ...Object.keys(getLeaderboard(1) ? { 1: true } : {}).map(Number),
      ]),
    []
  );

  const eventsWithResults = useMemo(
    () =>
      MOCK_EVENTS.filter(
        (e) => e.id === 1 || e.id === 2 || e.status === "completed" || e.status === "sold-out"
      ),
    []
  );

  const eventPager = usePagedList(eventsWithResults, EVENT_PAGE_SIZE, "events");

  return (
    <div className={`${PAGE_SHELL} py-7`}>
      <div className="mb-6 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-5 sm:p-6">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1.5">
          Kết quả
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Kết quả & bảng xếp hạng</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">
          Chọn giải để xem thành tích cá nhân, split time và BXH. Demo: BIB 1234 (Sa Pa), BIB 2048
          (TP.HCM).
        </p>
      </div>

      <div className="space-y-3 mb-8 list-stagger">
        {MOCK_RUNNER_RESULTS.map((r) => {
          const event = MOCK_EVENTS.find((e) => e.id === r.eventId);
          return (
            <Link
              key={`${r.eventId}-${r.bib}`}
              href={`/results/${r.eventId}?bib=${r.bib}`}
              className="block rounded-2xl border border-border bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between hover:border-orange-500/40 transition-colors shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase">
                  <Trophy className="h-3.5 w-3.5" />
                  BIB {r.bib}
                </div>
                <h2 className="font-bold text-lg">{r.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {event?.title} · {r.distanceLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event ? formatDate(event.date) : ""} ·{" "}
                  {event ? getStatusLabel(event.status) : ""}
                </p>
              </div>
              <div className="flex gap-6 text-center items-center">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Chip time
                  </p>
                  <p className="text-xl font-extrabold tabular-nums">{r.finishTime || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Hạng</p>
                  <p className="text-xl font-extrabold flex items-center justify-center gap-1">
                    <Medal className="h-4 w-4 text-amber-500" />
                    {r.rankOverall ? `#${r.rankOverall}` : "—"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="font-bold text-lg mb-3">Xem theo giải</h2>
      <div
        className={`list-fade ${eventPager.visible ? "list-fade-in" : "list-fade-out"} grid sm:grid-cols-2 lg:grid-cols-3 gap-3 list-stagger min-h-[120px]`}
      >
        {eventPager.turning
          ? Array.from({ length: EVENT_PAGE_SIZE }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl border bg-muted/40 skeleton-shimmer" />
            ))
          : eventPager.pageItems.map((ev) => (
              <Link
                key={ev.id}
                href={`/results/${ev.id}`}
                className="rounded-xl border bg-white p-4 hover:border-orange-500/40 transition-colors shadow-sm"
              >
                <p className="font-semibold text-sm line-clamp-2">{ev.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getLeaderboard(ev.id) || publishedEventIds.has(ev.id)
                    ? "Có dữ liệu demo"
                    : "Có thể chưa công bố"}
                </p>
              </Link>
            ))}
      </div>

      <div className="mt-4 mb-8">
        <Pagination
          page={eventPager.page}
          totalPages={eventPager.totalPages}
          totalItems={eventPager.totalItems}
          pageSize={EVENT_PAGE_SIZE}
          onChange={eventPager.goTo}
          disabled={eventPager.turning}
        />
      </div>

      <Link
        href="/results/99"
        className="block rounded-xl border border-dashed p-4 hover:border-orange-500/40 mb-8 bg-white/60"
      >
        <p className="font-semibold text-sm">Giải demo chưa công bố (#99)</p>
        <p className="text-xs text-muted-foreground mt-1">Edge case: empty / chưa publish</p>
      </Link>

      <div className="rounded-2xl border border-dashed border-border bg-white p-6 text-center">
        <Flag className="h-8 w-8 text-orange-500 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">Đã có BIB? Tìm ảnh race của bạn ngay.</p>
        <Link
          href="/photos"
          className="inline-flex rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Tìm ảnh theo BIB
        </Link>
      </div>
    </div>
  );
}
