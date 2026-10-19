"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Receipt, ExternalLink, LogIn, Undo2, X } from "lucide-react";
import { getMyPayments, getPaymentStatus } from "@/api/payments";
import { getMyRegistrations } from "@/api/events";
import {
  createRefundRequest,
  listMyRefundRequests,
} from "@/api/finance";
import { PaymentDto, PaymentStatusDto } from "@/dto/payment.dto";
import { RegistrationDto } from "@/dto/event.dto";
import type { RefundRequestDto } from "@/dto/finance.dto";
import {
  formatDateTime,
  formatPrice,
  getPaymentStatusLabel,
  getRefundStatusLabel,
} from "@/lib/format";
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

function isRegistrationPayment(p: PaymentDto): boolean {
  const purpose = (p.purpose || "").toLowerCase();
  if (purpose === "event_package") return false;
  if (purpose === "registration") return true;
  return Boolean(p.registrationId);
}

type Row = PaymentDto & {
  eventId?: string;
  bibNumber?: string | null;
};

export default function PaymentsHistoryPage() {
  const [boot, setBoot] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [refunds, setRefunds] = useState<RefundRequestDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refundBusyId, setRefundBusyId] = useState<string | null>(null);
  const [refundMsg, setRefundMsg] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<Row | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [payOsMode, setPayOsMode] = useState<PaymentStatusDto["payOsMode"] | null>(
    null
  );

  useEffect(() => {
    const token = Cookies.get("accessToken");
    setLoggedIn(Boolean(token));
    if (!token) {
      setBoot(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [payments, regs, refundList, payStatus] = await Promise.all([
          getMyPayments(),
          getMyRegistrations(),
          listMyRefundRequests().catch(() => [] as RefundRequestDto[]),
          getPaymentStatus().catch(() => null),
        ]);
        if (cancelled) return;
        if (payStatus?.payOsMode) setPayOsMode(payStatus.payOsMode);

        const regById = new Map<string, RegistrationDto>(
          (Array.isArray(regs) ? regs : []).map((r) => [r.id, r])
        );

        const mapped: Row[] = (Array.isArray(payments) ? payments : [])
          .map((p) => {
            const reg = p.registrationId
              ? regById.get(p.registrationId)
              : undefined;
            const purpose = (p.purpose || "").toLowerCase();
            const isPackage = purpose === "event_package";
            return {
              ...p,
              eventName:
                p.eventName ||
                reg?.eventName ||
                (isPackage ? "Gói tạo giải RaceDay" : "Đăng ký giải chạy"),
              distanceName:
                p.distanceName ||
                reg?.distanceName ||
                (isPackage ? "Gói sự kiện" : "—"),
              eventId: p.eventId || reg?.eventId,
              bibNumber: reg?.bibNumber ?? null,
            };
          })
          .sort((a, b) => {
            const ta = a.paidAt || a.createdAt || "";
            const tb = b.paidAt || b.createdAt || "";
            return tb.localeCompare(ta);
          });

        setItems(mapped);
        setRefunds(Array.isArray(refundList) ? refundList : []);
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

  const refundByPayment = new Map(
    refunds.map((r) => [r.paymentId, r] as const)
  );

  const openRefund = (row: Row) => {
    setRefundTarget(row);
    setRefundReason("");
    setRefundMsg(null);
  };

  const submitRefund = async () => {
    if (!refundTarget || refundReason.trim().length < 10) return;
    const paymentId = refundTarget.id;
    setRefundBusyId(paymentId);
    setRefundMsg(null);
    try {
      const row = await createRefundRequest({
        paymentId,
        reason: refundReason.trim(),
        eventId: refundTarget.eventId,
        amount: Number(refundTarget.amount || 0) || undefined,
      });
      setRefunds((prev) => [
        row,
        ...prev.filter((r) => r.paymentId !== paymentId),
      ]);
      setItems((prev) =>
        prev.map((p) =>
          p.id === paymentId &&
          (row.status === "refunded" || row.status === "processing")
            ? {
                ...p,
                status:
                  row.status === "refunded" ? "refunded" : p.status,
              }
            : p
        )
      );
      setRefundTarget(null);
      setRefundReason("");
      setRefundMsg(
        row.status === "refunded"
          ? payOsMode === "mock"
            ? "Đã hoàn nội bộ (PayOS mock) — ledger/payment cập nhật; không chuyển khoản ngân hàng thật."
            : "Đã hoàn tiền thành công — PayOS lệnh chi về STK đối ứng (nếu có). Ví BTC cập nhật cột Hoàn tiền VĐV."
          : "Đã gửi yêu cầu hoàn tiền — theo dõi bảng bên dưới."
      );
    } catch (e) {
      setRefundMsg(getApiErrorMessage(e, "Gửi yêu cầu hoàn tiền thất bại."));
    } finally {
      setRefundBusyId(null);
    }
  };

  const pager = usePagedList(items, PAGE_SIZE, String(items.length));
  const refundPager = usePagedList(
    refunds,
    PAGE_SIZE,
    `rf-${refunds.length}`
  );

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
          Theo dõi giao dịch PayOS. Hoàn tiền vé đăng ký cần lý do — BE hoàn theo
          % chính sách × số đã trả (không theo giá cự ly hiện tại). Gói tạo giải
          không hoàn qua nút này.
        </p>
      </div>

      {payOsMode === "mock" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          PayOS đang chạy <span className="font-semibold">mock</span> — thanh toán
          và hoàn tiền chỉ cập nhật hệ thống RaceDay, không có tiền thật vào/ra
          ngân hàng.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {refundMsg && (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {refundMsg}
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
                  const canRefund =
                    p.status === "paid" &&
                    isRegistrationPayment(p) &&
                    !refundByPayment.has(p.id);
                  const isPackage =
                    (p.purpose || "").toLowerCase() === "event_package";
                  return (
                    <li key={p.id} className="rounded-2xl border bg-card p-4 sm:p-5 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm sm:text-base truncate">
                            {p.eventName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.distanceName} · PayOS
                            {isPackage ? " · Gói tạo giải" : ""}
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
                      <div className="flex flex-wrap items-end justify-between gap-2 pt-1">
                        <div>
                          <p className="text-lg font-extrabold text-orange-600">
                            {formatPrice(Number(p.amount || 0))}
                          </p>
                          {Number(p.discountAmount || 0) > 0 ? (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Gốc {formatPrice(Number(p.listAmount || 0))}
                              {p.promoCode ? (
                                <>
                                  {" "}
                                  · mã{" "}
                                  <span className="font-semibold text-emerald-700">
                                    {p.promoCode}
                                  </span>
                                </>
                              ) : null}{" "}
                              · giảm{" "}
                              <span className="font-semibold text-emerald-700">
                                -{formatPrice(Number(p.discountAmount || 0))}
                              </span>
                              {" "}
                              · hoàn theo số đã TT
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {p.status === "pending" &&
                            p.eventId &&
                            p.registrationId && (
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
                          {canRefund && (
                            <button
                              type="button"
                              disabled={refundBusyId === p.id}
                              onClick={() => openRefund(p)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline disabled:opacity-50"
                            >
                              <Undo2 className="h-3 w-3" />
                              Yêu cầu hoàn tiền
                            </button>
                          )}
                          {isPackage && p.status === "paid" ? (
                            <span className="text-[11px] text-muted-foreground">
                              Gói tạo giải — không hoàn qua form VĐV
                            </span>
                          ) : null}
                          {refundByPayment.get(p.id) ? (
                            <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-800">
                              {getRefundStatusLabel(
                                refundByPayment.get(p.id)!.status
                              )}
                            </span>
                          ) : null}
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

      <section className="mt-10 space-y-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">
            Bảng yêu cầu hoàn tiền
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Mỗi lần gửi hoàn tiền xuất hiện tại đây. BE hoàn ngay theo chính
            sách (không chờ Admin duyệt riêng) — payment → refunded, ledger
            cộng cột Hoàn tiền VĐV.
          </p>
        </div>
        {refunds.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Chưa có yêu cầu hoàn tiền.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-bold">Số tiền</th>
                      <th className="px-4 py-3 font-bold">Lý do</th>
                      <th className="px-4 py-3 font-bold">Trạng thái</th>
                      <th className="px-4 py-3 font-bold">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {refundPager.pageItems.map((r) => (
                      <tr key={r.id} className="hover:bg-orange-50/40">
                        <td className="px-4 py-3 font-extrabold text-orange-600">
                          {formatPrice(Number(r.amount || 0))}
                        </td>
                        <td className="px-4 py-3">
                          <p className="line-clamp-2 text-xs text-foreground">
                            {r.reason || "—"}
                          </p>
                          {r.rejectReason ? (
                            <p className="mt-1 text-[11px] text-red-700">
                              Từ chối: {r.rejectReason}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-800">
                            {getRefundStatusLabel(r.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDateTime(r.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              page={refundPager.page}
              totalPages={refundPager.totalPages}
              totalItems={refundPager.totalItems}
              pageSize={PAGE_SIZE}
              onChange={refundPager.goTo}
              disabled={refundPager.turning}
            />
          </>
        )}
      </section>

      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">Yêu cầu hoàn tiền</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {refundTarget.eventName} ·{" "}
                  {formatPrice(Number(refundTarget.amount || 0))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Số hoàn = % chính sách × số đã thanh toán trên payment (không lấy
              giá vé hiện tại). Ghi rõ lý do (tối thiểu 10 ký tự).
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              placeholder="VD: Không tham gia được / giải hủy / lý do sức khỏe…"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={
                  refundReason.trim().length < 10 ||
                  refundBusyId === refundTarget.id
                }
                onClick={() => void submitRefund()}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {refundBusyId === refundTarget.id
                  ? "Đang gửi…"
                  : "Gửi yêu cầu hoàn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
