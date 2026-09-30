"use client";

import { PAGE_SHELL } from "@/lib/page-shell";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Trophy,
  Flag,
  Award,
  MessageSquareWarning,
} from "lucide-react";
import { getEventById, formatDate } from "@/data/mock-events";
import {
  getLeaderboard,
  getResultByEventAndBib,
  getResultsForEvent,
} from "@/data/mock-results";
import PageLoading from "@/components/ui/PageLoading";

function ResultsDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = Number(params.eventId);
  const bibParam = searchParams.get("bib");
  const bib = bibParam ? Number(bibParam) : 1234;

  const event = getEventById(eventId);
  const personal = getResultByEventAndBib(eventId, bib);
  const leaderboard = getLeaderboard(eventId);
  const hasAny = getResultsForEvent(eventId).length > 0 || leaderboard;

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-3">
        <h1 className="text-2xl font-bold">Không tìm thấy giải</h1>
        <Link href="/results" className="text-orange-600 font-semibold">
          Về trang kết quả
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL} py-7 space-y-8`}>
      <Link
        href="/results"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Tất cả kết quả
      </Link>

      <div>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
          Kết quả giải
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{event.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDate(event.date)} · {event.city}
        </p>
      </div>

      {!hasAny && (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-2">
          <Flag className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="font-bold text-lg">BTC chưa công bố kết quả</h2>
          <p className="text-sm text-muted-foreground">
            Vui lòng quay lại sau khi giải kết thúc và dữ liệu được chứng nhận.
          </p>
        </div>
      )}

      {personal?.cutOffWarning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Cảnh báo cut-off (2.7)</p>
            <p className="mt-0.5">{personal.cutOffWarning}</p>
          </div>
        </div>
      )}

      {personal && (
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-orange-500" />
              Thành tích cá nhân — BIB {personal.bib}
            </h2>
            <div className="flex flex-wrap gap-2">
              {personal.certificateId && (
                <Link
                  href={`/certificates/${personal.certificateId}`}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Award className="h-3.5 w-3.5" />
                  Chứng nhận
                </Link>
              )}
              {personal.status === "finished" && (
                <Link
                  href={`/results/${eventId}/dispute?bib=${personal.bib}`}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  <MessageSquareWarning className="h-3.5 w-3.5" />
                  Khiếu nại KQ
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Chip time</p>
              <p className="text-xl font-extrabold tabular-nums">
                {personal.finishTime || "—"}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Hạng chung</p>
              <p className="text-xl font-extrabold">
                {personal.rankOverall ? `#${personal.rankOverall}` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Hạng giới</p>
              <p className="text-xl font-extrabold">
                {personal.rankGender ? `#${personal.rankGender}` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Trạng thái</p>
              <p className="text-sm font-bold mt-1">
                {personal.status === "finished"
                  ? "Đã về đích"
                  : personal.status === "racing"
                    ? "Đang đua"
                    : personal.status.toUpperCase()}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Split time từng checkpoint</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2">Checkpoint</th>
                    <th className="text-center px-3 py-2">Đoạn</th>
                    <th className="text-center px-3 py-2">Tích lũy</th>
                    <th className="text-center px-3 py-2">Cut-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {personal.splits.map((s) => (
                    <tr
                      key={s.checkpoint}
                      className={s.atRisk ? "bg-amber-500/10" : undefined}
                    >
                      <td className="px-3 py-2 font-medium">{s.checkpoint}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{s.time}</td>
                      <td className="px-3 py-2 text-center tabular-nums font-semibold">
                        {s.cumulative}
                      </td>
                      <td className="px-3 py-2 text-center text-muted-foreground tabular-nums">
                        {s.cutOff || "—"}
                        {s.atRisk && (
                          <span className="ml-1 text-[10px] font-bold text-amber-700">RỦI RO</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {leaderboard && (
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold">Bảng xếp hạng (mẫu)</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">Hạng</th>
                  <th className="text-left px-3 py-2">BIB</th>
                  <th className="text-left px-3 py-2">Họ tên</th>
                  <th className="text-left px-3 py-2">Giới</th>
                  <th className="text-right px-3 py-2">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaderboard.map((row) => (
                  <tr
                    key={row.bib}
                    className={row.bib === bib ? "bg-orange-500/10 font-semibold" : undefined}
                  >
                    <td className="px-3 py-2">#{row.rank}</td>
                    <td className="px-3 py-2">{row.bib}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.gender}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.finishTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Demo: thêm <code>?bib=1234</code> để nhấn mạnh thành tích cá nhân.
          </p>
        </section>
      )}
    </div>
  );
}

export default function ResultsEventPage() {
  return (
    <Suspense
      fallback={
        <PageLoading
          title="Đang tải kết quả…"
          description="Lấy thành tích cá nhân và bảng xếp hạng."
          icon={Trophy}
        />
      }
    >
      <ResultsDetailInner />
    </Suspense>
  );
}
