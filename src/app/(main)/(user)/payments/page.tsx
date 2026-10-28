"use client";
import { getAuthUser } from "@/stores/auth-store";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";
import RunnerPageHeader from "@/components/runner/RunnerPageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

function isRegistrationPayment(p: Row): boolean {
  const purpose = (p.purpose || "").toLowerCase();
  if (purpose === "event_package") return false;
  if (purpose === "registration") return true;
  return Boolean(p.registrationId);
}

type Row = Omit<PaymentDto, "bibNumber"> & {
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
  const [refundError, setRefundError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const refundTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [payOsMode, setPayOsMode] = useState<PaymentStatusDto["payOsMode"] | null>(
    null
  );

  useEffect(() => {
    const authenticatedUser = getAuthUser();
    setLoggedIn(Boolean(authenticatedUser));
    if (!authenticatedUser) {
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
  }, [loadAttempt]);

  const refundByPayment = new Map(
    refunds.map((r) => [r.paymentId, r] as const)
  );

  const openRefund = (row: Row) => {
    setRefundTarget(row);
    setRefundReason("");
    setRefundMsg(null);
    setRefundError(null);
  };

  const submitRefund = async () => {
    if (!refundTarget || refundReason.trim().length < 10) return;
    const paymentId = refundTarget.id;
    setRefundBusyId(paymentId);
    setRefundMsg(null);
    setRefundError(null);
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
      setRefundError(getApiErrorMessage(e, "Gửi yêu cầu hoàn tiền thất bại. Vui lòng thử lại."));
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
    <div className={`${PAGE_SHELL_FORM} py-7 sm:py-8`}>
      <RunnerPageHeader title="Lịch sử thanh toán" description="Theo dõi giao dịch, tiếp tục thanh toán và quản lý yêu cầu hoàn tiền của bạn." />

      {payOsMode === "mock" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          PayOS đang chạy <span className="font-semibold">mock</span> — thanh toán
          và hoàn tiền chỉ cập nhật hệ thống RaceDay, không có tiền thật vào/ra
          ngân hàng.
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{error}</p>
          <Button type="button" variant="outline" className="mt-3 min-h-11 bg-card" onClick={() => { setBoot(true); setLoadAttempt((attempt) => attempt + 1); }}>Thử lại</Button>
        </div>
      )}
      {refundMsg && (
        <div role="status" className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {refundMsg}
        </div>
      )}

      {!error && (items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          <Receipt aria-hidden="true" className="mx-auto mb-3 size-10 text-orange-700" />
          <h2 className="text-lg font-bold text-foreground">Bạn chưa có giao dịch nào</h2>
          <p className="mt-2">Các khoản thanh toán cho giải chạy sẽ xuất hiện tại đây.</p>
          <Button asChild className="mt-5 min-h-11 rounded-xl bg-orange-700 px-5 text-white hover:bg-orange-800"><Link href="/events">Khám phá giải chạy</Link></Button>
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
                    <li key={p.id} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3 shadow-sm [&_a]:min-h-11 [&_button]:min-h-11 [&_a]:rounded-xl">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-base break-words [overflow-wrap:anywhere]">
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
                          <p className="text-lg font-extrabold text-orange-700">
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
                          {["pending", "cancelled", "failed", "expired"].includes(p.status) && (
                            <Link
                              href={`/payments/${encodeURIComponent(p.id)}/continue`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white hover:bg-orange-800 transition-colors"
                            >
                              {p.status === "pending" ? "Tiếp tục thanh toán" : "Thanh toán lại"}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                          {/* Registration: paid/refunded → view ticket */}
                          {(p.status === "paid" || p.status === "refunded") &&
                            !isPackage &&
                            p.registrationId && (
                              <Link
                                href={`/my-registrations/${p.registrationId}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:underline"
                              >
                                {p.status === "refunded" ? "Chi tiết" : "Xem vé"}{" "}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          {/* Package: paid → organizer dashboard */}
                          {p.status === "paid" && isPackage && (
                            <Link
                              href="/organizer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:underline"
                            >
                              Xem giải của tôi <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                          {/* Event detail link for any payment that has an eventId */}
                          {p.eventId && !isPackage && (
                            <Link
                              href={`/events/${p.eventId}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:underline"
                            >
                              Chi tiết giải <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                          {/* Refund */}
                          {canRefund && (
                            <button
                              type="button"
                              disabled={refundBusyId === p.id}
                              onClick={(event) => { refundTriggerRef.current = event.currentTarget; openRefund(p); }}
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
      ))}

      {!error && <section className="mt-10 space-y-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">
            Bảng yêu cầu hoàn tiền
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Theo dõi số tiền, lý do và trạng thái xử lý. Số tiền hoàn được xác định theo chính sách của giải và khoản bạn đã thanh toán.
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
                        <td className="px-4 py-3 font-extrabold text-orange-700">
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
      </section>}

      <Dialog open={Boolean(refundTarget)} onOpenChange={(open) => { if (!open && !refundBusyId) setRefundTarget(null); }}>
        <DialogContent showCloseButton={false} className="max-h-[85dvh] overflow-y-auto rounded-2xl p-5 sm:max-w-md sm:p-6"
          onCloseAutoFocus={(event) => { event.preventDefault(); refundTriggerRef.current?.focus(); }}>
          <DialogHeader className="pr-10">
            <DialogTitle className="text-xl font-bold">Yêu cầu hoàn tiền</DialogTitle>
            <DialogDescription className="break-words leading-relaxed">{refundTarget?.eventName} · {formatPrice(Number(refundTarget?.amount || 0))}</DialogDescription>
          </DialogHeader>
          <Button type="button" variant="ghost" disabled={Boolean(refundBusyId)} onClick={() => setRefundTarget(null)} aria-label="Đóng yêu cầu hoàn tiền" className="absolute right-2 top-2 size-11 rounded-xl"><X aria-hidden="true" className="size-4" /></Button>
          <p className="text-sm leading-relaxed text-muted-foreground">Số tiền hoàn được tính theo chính sách của giải dựa trên số tiền bạn đã thanh toán.</p>
          <div className="space-y-2">
            <Label htmlFor="refund-reason">Lý do hoàn tiền <span className="text-destructive">*</span></Label>
            <Textarea id="refund-reason" value={refundReason} disabled={Boolean(refundBusyId)} onChange={(e) => setRefundReason(e.target.value)} rows={4}
              aria-describedby={`refund-reason-help${refundError ? " refund-error" : ""}`} required minLength={10}
              className="min-h-28 rounded-xl text-base" placeholder="Ví dụ: Tôi không thể tham gia giải vì…" />
            <p id="refund-reason-help" className="text-xs text-muted-foreground">Vui lòng nhập ít nhất 10 ký tự để giải thích lý do.</p>
          </div>
          {refundError && <p id="refund-error" role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{refundError}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={Boolean(refundBusyId)} onClick={() => setRefundTarget(null)} className="min-h-11 rounded-xl px-4">Quay lại</Button>
            <Button type="button" disabled={refundReason.trim().length < 10 || Boolean(refundBusyId)} onClick={() => void submitRefund()} className="min-h-11 rounded-xl bg-orange-700 px-4 text-white hover:bg-orange-800">
              {refundBusyId ? "Đang gửi…" : "Gửi yêu cầu hoàn tiền"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
