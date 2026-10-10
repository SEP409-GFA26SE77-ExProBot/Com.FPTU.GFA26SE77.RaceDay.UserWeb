"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Receipt, ExternalLink, LogIn } from "lucide-react";
import { getMyPayments } from "@/api/payments";
import { getMyRegistrations } from "@/api/events";
import { PaymentDto } from "@/dto/payment.dto";
import { RegistrationDto } from "@/dto/event.dto";
import { formatPrice, getPaymentStatusLabel } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";

const PAGE_SIZE = 5;

function statusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-800 border-amber-500/30";
    case "paid":
      return "bg-emerald-500/15 text-emerald-800 border-emerald-500/30";
    case "failed":
      return "bg-red-500/15 text-red-800 border-red-500/30";
    case "cancelled":
      return "bg-amber-500/15 text-amber-800 border-amber-500/30";
    case "expired":
      return "bg-slate-500/15 text-slate-700 border-slate-500/30";
    case "refunded":
      return "bg-sky-500/15 text-sky-800 border-sky-500/30";
    default:
      return "bg-slate-500/15 text-slate-700 border-slate-500/30";
  }
}

type Row = PaymentDto & {
  eventId?: string;
  bibNumber?: string | null;
};

export default function PaymentsHistoryPage() {
  const [boot, setBoot] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("access_token");
    setLoggedIn(Boolean(token));
    if (!token) {
      setBoot(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [payments, regs] = await Promise.all([
          getMyPayments(),
          getMyRegistrations(),
        ]);
        if (cancelled) return;

        const regById = new Map<string, RegistrationDto>(
          (Array.isArray(regs) ? regs : []).map((r) => [r.id, r])
        );

        const mapped: Row[] = (Array.isArray(payments) ? payments : [])
          .map((p) => {
            const reg = regById.get(p.registrationId);
            return {
              ...p,
              eventName: p.eventName || reg?.eventName || "Đăng ký giải chạy",
              distanceName: p.distanceName || reg?.distanceName || "—",
              eventId: reg?.eventId,
              bibNumber: reg?.bibNumber ?? null,
            };
          })
          .sort((a, b) => {
            const ta = a.paidAt || a.createdAt || "";
            const tb = b.paidAt || b.createdAt || "";
            return tb.localeCompare(ta);
          });

        setItems(mapped);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được lịch sử."));
          setItems([]);
        }
      } finally {
        if (!cancelled) setBoot(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pager = usePagedList(items, PAGE_SIZE, String(items.length));

  if (boot) {
    return (
      <PageLoading
        title="Đang tải lịch sử thanh toán…"
        description="Các giao dịch PayOS của tài khoản vận động viên."
        icon={Receipt}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <p className="text-muted-foreground">Đăng nhập để xem lịch sử thanh toán.</p>
        <Link
          href="/login?from=/payments"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL} py-7 max-w-3xl`}>
      <div className="mb-6">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
          Vận động viên
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Lịch sử thanh toán</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi giao dịch PayOS (thành công / chờ / hoàn tiền / thất bại / hủy).
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Chưa có giao dịch. Đăng ký giải và thanh toán để xuất hiện tại đây.
        </div>
      ) : (
        <>
          <ul
            className={`list-fade ${pager.visible ? "list-fade-in" : "list-fade-out"} space-y-3 list-stagger min-h-[200px]`}
          >
            {pager.turning
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <li
                    key={i}
                    className="h-28 rounded-2xl border bg-muted/40 skeleton-shimmer"
                  />
                ))
              : pager.pageItems.map((p) => {
                  const when = p.paidAt || p.createdAt;
                  return (
                    <li key={p.id} className="rounded-2xl border bg-card p-4 sm:p-5 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm sm:text-base truncate">
                            {p.eventName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.distanceName} · PayOS
                            {when ? ` · ${new Date(when).toLocaleString("vi-VN")}` : ""}
                            {p.bibNumber ? ` · BIB ${p.bibNumber}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(p.status)}`}
                        >
                          {getPaymentStatusLabel(p.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <p className="text-lg font-extrabold text-orange-600">
                          {formatPrice(Number(p.amount || 0))}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {p.status === "pending" && p.eventId && p.registrationId && (
                            <Link
                              href={`/events/${p.eventId}/payment?regId=${p.registrationId}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                            >
                              Thanh toán <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                          {(p.status === "paid" || p.status === "refunded") &&
                            p.registrationId && (
                              <Link
                                href={`/my-registrations/${p.registrationId}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                              >
                                {p.status === "refunded" ? "Chi tiết" : "Xem vé"}{" "}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          {p.eventId && (
                            <Link
                              href={`/events/${p.eventId}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:underline"
                            >
                              Chi tiết giải <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
          </ul>

          <div className="mt-4 border-t border-border/60 pt-4">
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
