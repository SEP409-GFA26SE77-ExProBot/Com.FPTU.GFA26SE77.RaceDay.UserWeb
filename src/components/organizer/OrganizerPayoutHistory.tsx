"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import {
  getEventFinanceSummary,
  listPayoutRequests,
} from "@/api/finance";
import type { PayoutRequestDto } from "@/dto/finance.dto";
import { formatPrice, getPayoutStatusLabel } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";

function payoutClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-800 border-amber-500/30";
    case "approved":
      return "bg-sky-500/15 text-sky-800 border-sky-500/30";
    case "transferred":
      return "bg-emerald-500/15 text-emerald-800 border-emerald-500/30";
    case "rejected":
      return "bg-red-500/15 text-red-800 border-red-500/30";
    default:
      return "bg-slate-500/15 text-slate-700 border-slate-500/30";
  }
}

export default function OrganizerPayoutHistory({
  eventId,
}: {
  eventId: string;
}) {
  const [eventName, setEventName] = useState("");
  const [items, setItems] = useState<PayoutRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [summary, list] = await Promise.all([
        getEventFinanceSummary(eventId),
        listPayoutRequests(eventId),
      ]);
      setEventName(summary.eventName);
      setItems(list);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được lịch sử giải ngân."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        Đang tải lịch sử giải ngân…
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL} space-y-5 py-1`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Lịch sử giải ngân
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            {eventName || "Giải đang mở"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chỉ các lệnh rút gắn túi escrow của giải này.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/organizer/events/${eventId}/wallet`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
          >
            <Wallet className="h-3.5 w-3.5" /> Ví & giải ngân
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Chưa có lệnh rút cho giải này.{" "}
          <Link
            href={`/organizer/events/${eventId}/wallet`}
            className="font-semibold text-orange-600 hover:underline"
          >
            Tạo yêu cầu
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-extrabold text-orange-600">
                    {formatPrice(p.amount)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString("vi-VN")}
                    {p.transferredAt
                      ? ` · CK ${new Date(p.transferredAt).toLocaleString("vi-VN")}`
                      : ""}
                  </p>
                  {p.note ? (
                    <p className="mt-1 text-xs text-foreground">{p.note}</p>
                  ) : null}
                  {p.rejectReason ? (
                    <p className="mt-1 text-xs text-red-600">
                      Lý do: {p.rejectReason}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${payoutClass(p.status)}`}
                >
                  {getPayoutStatusLabel(p.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
