"use client";
import { getAuthUser } from "@/stores/auth-store";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Loader2, Trophy } from "lucide-react";
import { getEventById } from "@/api/events";
import { getEventLeaderboard, getLeaderboardDistances, getMyLeaderboard } from "@/api/leaderboards";
import type { RaceEventDto } from "@/dto/event.dto";
import type { LeaderboardDistanceDto, LeaderboardEntryDto, LeaderboardGender } from "@/dto/leaderboard.dto";
import { distanceCategory, LEADERBOARD_GENDERS, leaderboardEntryKey, mergeLeaderboardEntries } from "@/lib/leaderboard";
import { getApiErrorMessage } from "@/lib/error";
import { formatDate } from "@/lib/format";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

const columnLabel = "text-[10px] font-bold uppercase tracking-wider text-slate-500";

function rankLabel(rank: number | null | undefined) {
  return rank && rank > 0 ? rank : "-";
}

function RaceTime({ value }: { value: string | null }) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return <span>-</span>;
  return (
    <span className="block tabular-nums" title={date.toLocaleString("vi-VN")}>
      {date.toLocaleTimeString("vi-VN", { hour12: false })}
      <span className="mt-0.5 block text-[11px] text-slate-400">{date.toLocaleDateString("vi-VN")}</span>
    </span>
  );
}

function MyRankBar({ entry, loading = false, error, onRetry }: {
  entry: LeaderboardEntryDto | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <aside aria-label="Thứ hạng của bạn" aria-busy={loading} className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-orange-400 bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className={`${PAGE_SHELL} space-y-2.5`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-xs font-extrabold text-orange-600">THỨ HẠNG CỦA BẠN</p>
          <p className={`text-[11px] ${error ? "text-red-700" : "text-slate-500"}`} aria-live="polite">
            {loading ? "Đang tải thứ hạng của bạn…" : error || (!entry ? "Bạn chưa có kết quả ở hạng mục này." : entry.distanceName)}
            {error && onRetry && <button type="button" onClick={onRetry} className="ml-2 font-bold underline underline-offset-2">Thử lại</button>}
          </p>
        </div>
        <div className="grid grid-cols-[40px_minmax(0,1fr)_84px_64px] items-start gap-3 sm:grid-cols-[60px_minmax(0,1fr)_100px_120px_90px] sm:gap-5">
          <div><p className={columnLabel}>Hạng</p><p className="mt-1 text-lg font-black tabular-nums text-orange-600">{rankLabel(entry?.rank)}</p></div>
          <div className="min-w-0">
            <p className={columnLabel}>Vận động viên</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-900" title={entry?.fullName}>{entry?.fullName || "-"}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 sm:hidden">BIB {entry?.bib || "-"}</p>
          </div>
          <div className="hidden sm:block"><p className={columnLabel}>BIB</p><p className="mt-1 text-sm font-semibold text-slate-700">{entry?.bib || "-"}</p></div>
          <div><p className={columnLabel}>Thành tích</p><p className="mt-1 text-sm font-extrabold tabular-nums text-slate-900">{entry?.totalTime || "-"}</p></div>
          <div><p className={columnLabel}>Pace /km</p><p className="mt-1 text-sm font-bold tabular-nums text-slate-700">{entry?.pace || "-"}</p></div>
        </div>
      </div>
    </aside>
  );
}

function CategoryLeaderboard({ eventId, distance, gender }: {
  eventId: string;
  distance: LeaderboardDistanceDto;
  gender: LeaderboardGender;
}) {
  const [rows, setRows] = useState<LeaderboardEntryDto[]>([]);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [mine, setMine] = useState<LeaderboardEntryDto | null>(null);
  const [mineLoading, setMineLoading] = useState(true);
  const [mineError, setMineError] = useState<string | null>(null);
  const [mineRetry, setMineRetry] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const nextScheduled = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getEventLeaderboard(eventId, distance.id, gender, page)
      .then((result) => {
        if (cancelled) return;
        setRows((previous) => page === 1 ? result.items : mergeLeaderboardEntries(previous, result.items));
        setHasMore(result.hasMore);
        setTotalCount((previous) => result.totalCount ?? previous);
        if (page === 1) setFetchedAt(result.fetchedAt);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, "Không tải được bảng xếp hạng. Vui lòng thử lại."));
      })
      .finally(() => {
        if (!cancelled) {
          nextScheduled.current = false;
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [eventId, distance.id, gender, page, retry]);

  useEffect(() => {
    let cancelled = false;
    const request = getAuthUser() ? getMyLeaderboard(eventId, distance.id, gender) : Promise.resolve(null);
    request
      .then((entry) => { if (!cancelled) setMine(entry); })
      .catch((err: unknown) => {
        if (!cancelled) setMineError(getApiErrorMessage(err, "Không tải được thứ hạng của bạn."));
      })
      .finally(() => { if (!cancelled) setMineLoading(false); });
    return () => { cancelled = true; };
  }, [eventId, distance.id, gender, mineRetry]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || error || nextScheduled.current) return;
    nextScheduled.current = true;
    setLoading(true);
    setPage((previous) => previous + 1);
  }, [loading, hasMore, error]);

  useEffect(() => {
    if (loading || !hasMore || error) return;
    let frame = 0;
    const checkPosition = () => {
      frame = 0;
      // Also handles jumping past the sentinel directly into the page footer.
      if (sentinel.current && sentinel.current.getBoundingClientRect().top <= window.innerHeight + 280) loadMore();
    };
    const scheduleCheck = () => {
      if (!frame) frame = window.requestAnimationFrame(checkPosition);
    };
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    scheduleCheck();
    return () => {
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      window.cancelAnimationFrame(frame);
    };
  }, [loading, hasMore, error, loadMore]);

  return (
    <>
      <section aria-label="Bảng xếp hạng" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <p className="text-sm font-semibold text-slate-600" aria-live="polite">
            {rows.length.toLocaleString("vi-VN")}{totalCount !== null ? ` / ${totalCount.toLocaleString("vi-VN")}` : ""} vận động viên
          </p>
          {fetchedAt && <p className="text-[11px] text-slate-400">Cập nhật {new Date(fetchedAt).toLocaleString("vi-VN")}</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm" aria-busy={loading}>
            <caption className="sr-only">Kết quả {distance.type}, {LEADERBOARD_GENDERS.find((item) => item.value === gender)?.label}</caption>
            <thead className="bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950">
              <tr className="text-[11px] font-extrabold uppercase tracking-wide">
                <th scope="col" className="w-20 px-5 py-4 text-center">Hạng</th>
                <th scope="col" className="px-4 py-4">Vận động viên</th>
                <th scope="col" className="px-4 py-4">BIB</th>
                <th scope="col" className="px-4 py-4">Cự ly</th>
                <th scope="col" className="px-4 py-4">Xuất phát</th>
                <th scope="col" className="px-4 py-4">Về đích</th>
                <th scope="col" className="px-4 py-4">Thành tích</th>
                <th scope="col" className="px-5 py-4">Pace /km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const ownRow = Boolean(mine?.bib && mine.bib === row.bib);
                const podium = row.rank !== null && row.rank >= 1 && row.rank <= 3;
                return (
                  <tr key={leaderboardEntryKey(row)} className={ownRow ? "bg-orange-50" : "transition-colors hover:bg-slate-50"}>
                    <td className="px-5 py-5 text-center">
                      <span className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-1.5 font-extrabold tabular-nums ${podium ? row.rank === 1 ? "bg-amber-100 text-amber-700" : row.rank === 2 ? "bg-slate-200 text-slate-600" : "bg-orange-100 text-orange-700" : "text-slate-500"}`}>{rankLabel(row.rank)}</span>
                    </td>
                    <th scope="row" className="min-w-52 px-4 py-5 font-bold text-slate-800">
                      {row.fullName || "-"}
                      {ownRow && <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">BẠN</span>}
                    </th>
                    <td className="px-4 py-5 text-xs font-semibold text-slate-500">{row.bib || "-"}</td>
                    <td className="px-4 py-5 text-xs text-slate-500">{row.distanceName || "-"}</td>
                    <td className="whitespace-nowrap px-4 py-5 text-xs text-slate-600"><RaceTime value={row.startAtUtc} /></td>
                    <td className="whitespace-nowrap px-4 py-5 text-xs text-slate-600"><RaceTime value={row.finishAtUtc} /></td>
                    <td className="px-4 py-5 font-extrabold tabular-nums text-slate-900">{row.totalTime || "-"}</td>
                    <td className="px-5 py-5 font-semibold tabular-nums text-slate-600">{row.pace || "-"}</td>
                  </tr>
                );
              })}
              {loading && rows.length === 0 && Array.from({ length: 6 }, (_, index) => (
                <tr key={index} className="animate-pulse" aria-hidden="true">
                  {Array.from({ length: 8 }, (_, cell) => <td key={cell} className="px-4 py-6"><div className="h-3.5 rounded bg-slate-100" /></td>)}
                </tr>
              ))}
              {!loading && !error && rows.length === 0 && <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-slate-500">Chưa có kết quả cho hạng mục này.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 text-center" aria-live="polite">
          {error ? (
            <div role="alert" className="space-y-2 text-sm text-red-700">
              <p>{error}</p>
              <button type="button" className="font-bold underline underline-offset-2" onClick={() => {
                setError(null);
                setLoading(true);
                setRetry((value) => value + 1);
              }}>Thử lại</button>
            </div>
          ) : loading ? (
            <p className="inline-flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Đang tải kết quả…</p>
          ) : hasMore ? (
            <button type="button" onClick={loadMore} className="text-xs font-semibold text-orange-600 hover:underline">Cuộn xuống để xem thêm · Tải thêm kết quả</button>
          ) : rows.length > 0 ? <p className="text-xs text-slate-400">Đã hiển thị tất cả kết quả.</p> : null}
          <div ref={sentinel} className="h-1" aria-hidden="true" />
        </div>
      </section>
      <MyRankBar entry={mine} loading={mineLoading} error={mineError} onRetry={() => {
        setMineLoading(true);
        setMineError(null);
        setMineRetry((value) => value + 1);
      }} />
    </>
  );
}

export default function EventLeaderboard({ eventId }: { eventId: string }) {
  const [data, setData] = useState<{
    event: RaceEventDto | null;
    distances: LeaderboardDistanceDto[];
    error: string | null;
    loading: boolean;
  }>({ event: null, distances: [], error: null, loading: true });
  const [retry, setRetry] = useState(0);
  const [distanceId, setDistanceId] = useState("");
  const [gender, setGender] = useState<LeaderboardGender>("All");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getEventById(eventId), getLeaderboardDistances(eventId)])
      .then(([event, distances]) => {
        if (!cancelled) setData({ event, distances, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) setData({ event: null, distances: [], error: getApiErrorMessage(error, "Không tải được kết quả giải."), loading: false });
      });
    return () => { cancelled = true; };
  }, [eventId, retry]);

  if (data.loading) return <PageLoading title="Đang tải bảng xếp hạng…" description="Lấy thông tin giải và các cự ly thi đấu." icon={Trophy} />;
  if (data.error || !data.event) return (
    <div className={`${PAGE_SHELL} flex min-h-[50vh] flex-col items-center justify-center gap-4 py-12 text-center`}>
      <h1 className="text-2xl font-bold">Không tải được bảng xếp hạng</h1>
      <p role="alert" className="text-sm text-red-700">{data.error || "Không tìm thấy giải."}</p>
      <button type="button" className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white" onClick={() => {
        setData((previous) => ({ ...previous, loading: true, error: null }));
        setRetry((value) => value + 1);
      }}>Thử lại</button>
      <Link href="/results" className="text-sm font-semibold text-slate-500 hover:underline">Về danh sách kết quả</Link>
    </div>
  );

  const event = data.event;
  const distance = data.distances.find((item) => item.id === distanceId) ?? data.distances[0];
  const genderMeta = LEADERBOARD_GENDERS.find((item) => item.value === gender)!;

  return (
    <div className={`${PAGE_SHELL} space-y-6 pt-7 pb-44 sm:pb-40`}>
      <Link href="/results" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-orange-600"><ArrowLeft className="h-3.5 w-3.5" />Tất cả kết quả</Link>
      <header className="space-y-2 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-600">Kết quả thi đấu</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{event.name}</h1>
        <p className="text-sm text-slate-500">{event.location} · {formatDate(event.date)}</p>
        <Link href={`/events/${event.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">Thông tin giải<ArrowUpRight className="h-3 w-3" /></Link>
      </header>
      {distance ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Bảng xếp hạng</h2>
                <p className="mt-0.5 text-xs text-slate-500">{genderMeta.label} · {distance.distanceKm.toLocaleString("vi-VN")} km</p>
              </div>
              <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1" aria-label="Lọc giới tính">
                {LEADERBOARD_GENDERS.map((item) => <button key={item.value} type="button" aria-pressed={gender === item.value} onClick={() => setGender(item.value)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${gender === item.value ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{item.label}</button>)}
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Chọn hạng mục cự ly">
              {data.distances.map((item) => (
                <button key={item.id} type="button" aria-pressed={distance.id === item.id} title={`${genderMeta.label} · ${item.distanceKm} km`} onClick={() => setDistanceId(item.id)} className={`shrink-0 rounded-lg border px-5 py-3 text-xs font-extrabold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${distance.id === item.id ? "border-orange-400 bg-orange-500 text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-orange-300 hover:text-orange-600"}`}>{genderMeta.code}-{distanceCategory(item)}</button>
              ))}
            </div>
          </div>
          <CategoryLeaderboard key={`${eventId}:${distance.id}:${gender}`} eventId={eventId} distance={distance} gender={gender} />
        </>
      ) : <><div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center text-sm text-slate-500">Giải này chưa có cự ly để hiển thị kết quả.</div><MyRankBar entry={null} /></>}
    </div>
  );
}
