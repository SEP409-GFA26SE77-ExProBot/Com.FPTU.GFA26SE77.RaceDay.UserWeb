"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Wallet } from "lucide-react";
import {
  getEventFinanceSummary,
  listPayoutRequests,
} from "@/api/finance";
import type {
  EventFinanceSummaryDto,
  PayoutRequestDto,
} from "@/dto/finance.dto";
import { formatPrice, getPayoutStatusLabel } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";

export default function EventFinancePanel({ eventId }: { eventId: string }) {
  const [data, setData] = useState<EventFinanceSummaryDto | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [row, po] = await Promise.all([
          getEventFinanceSummary(eventId),
          listPayoutRequests(eventId),
        ]);
        if (!cancelled) {
          setData(row);
          setPayouts(po);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được thống kê tài chính."));
          setData(null);
          setPayouts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
        Đang tải thống kê tài chính…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error || "Không có dữ liệu."}
      </div>
    );
  }

  const rows = [
    ["Vé đã bán", `${data.ticketsSold.toLocaleString("vi-VN")} vé`],
    ["Doanh thu gộp", formatPrice(data.grossRevenue)],
    [
      `Phí nền tảng (${data.platformFeePercent}%)`,
      formatPrice(data.platformFeeAmount),
    ],
    ["Đã hoàn tiền VĐV", formatPrice(data.refundedTotal)],
    ["Thực nhận BTC (ước tính)", formatPrice(data.netToOrganizer)],
    ["Escrow đang giữ", formatPrice(data.escrowHeld)],
    ["Đang chờ duyệt rút", formatPrice(data.payoutPending)],
    ["Có thể xin rút", formatPrice(data.availableToWithdraw)],
    ["Đã giải ngân", formatPrice(data.withdrawnTotal)],
  ] as const;

  return (
    <section className="mt-6 space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
          Tài chính giải
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-foreground">
          {data.eventName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Túi escrow riêng của giải này. Hoàn tiền và lệnh rút chỉ trừ trên túi
          này — không đụng doanh thu giải khác.
        </p>
        <p className="mt-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {data.withdrawPolicyNote}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-base font-extrabold text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">Lệnh rút của giải này</h3>
        {payouts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có lệnh rút.</p>
        ) : (
          <ul className="space-y-1.5">
            {payouts.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-xs"
              >
                <span className="font-bold text-orange-600">
                  {formatPrice(p.amount)}
                </span>
                <span className="text-muted-foreground">
                  {new Date(p.createdAt).toLocaleString("vi-VN")}
                </span>
                <span className="font-semibold">
                  {getPayoutStatusLabel(p.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/organizer/events/${eventId}/wallet`}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          <Wallet className="h-4 w-4" />
          Ví & giải ngân
        </Link>
        <Link
          href={`/organizer/events/${eventId}/payout-history`}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:border-orange-300"
        >
          Lịch sử giải ngân
        </Link>
      </div>
    </section>
  );
}
