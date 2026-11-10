"use client";
import { getAuthUser } from "@/stores/auth-store";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Receipt,
  ExternalLink,
  LogIn,
  Undo2,
  X,
  Paperclip,
  Loader2,
  Upload,
  AlertCircle,
} from "lucide-react";
import { getMyPayments, getPaymentStatus } from "@/api/payments";
import { getMyRegistrations, uploadHealthCert } from "@/api/events";
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
import { toastError, toastSuccess } from "@/lib/toast";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";
import RunnerPageHeader from "@/components/runner/RunnerPageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isRefundReasonReady } from "@/lib/refund-reasons";

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

function refundStatusClass(status: string) {
  switch ((status || "").toLowerCase()) {
    case "requested":
    case "processing":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800";
    case "refunded":
      return "border-sky-500/30 bg-sky-500/10 text-sky-800";
    case "rejected":
      return "border-red-500/30 bg-red-500/10 text-red-700";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-700";
  }
}

function parseRefundReason(reason: string) {
  const raw = reason || "";
  const marker = "\n\nĐính kèm:\n";
  const idx = raw.indexOf(marker);
  if (idx >= 0) {
    const text = raw.slice(0, idx).trim();
    const urls = raw
      .slice(idx + marker.length)
      .split("\n")
      .map((line) => line.replace(/^-\s*/, "").trim())
      .filter(Boolean);
    return { text: text || "—", urls };
  }
  const urls = Array.from(
    raw.matchAll(/https?:\/\/\S+/g),
    (m) => m[0].replace(/[),.;]+$/, "")
  );
  return { text: raw.trim() || "—", urls };
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url);
}

type Row = Omit<PaymentDto, "bibNumber"> & {
  bibNumber?: string | null;
};

type RefundDetailView = {
  payment: Row;
  refund: RefundRequestDto;
};

export default function PaymentsHistoryPage() {
  const [boot, setBoot] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [refunds, setRefunds] = useState<RefundRequestDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refundBusyId, setRefundBusyId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<Row | null>(null);
  const [refundDetail, setRefundDetail] = useState<RefundDetailView | null>(null);
  const [refundReasonDetail, setRefundReasonDetail] = useState("");
  const [refundFiles, setRefundFiles] = useState<File[]>([]);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const refundTriggerRef = useRef<HTMLButtonElement | null>(null);
  const refundDetailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const refundFileInputRef = useRef<HTMLInputElement | null>(null);
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
    setRefundReasonDetail("");
    setRefundFiles([]);
    setRefundError(null);
    if (refundFileInputRef.current) refundFileInputRef.current.value = "";
  };

  const onPickRefundFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...refundFiles, ...Array.from(files)].slice(0, 3);
    setRefundFiles(next);
  };

  const submitRefund = async () => {
    if (!refundTarget || !isRefundReasonReady("system_error", refundReasonDetail)) {
      return;
    }
    const paymentId = refundTarget.id;
    setRefundBusyId(paymentId);
    setRefundError(null);
    try {
      const evidenceUrls: string[] = [];
      for (const file of refundFiles) {
        const uploaded = await uploadHealthCert(file);
        evidenceUrls.push(uploaded.fileUrl);
      }
      const detail = refundReasonDetail.trim();
      const reason =
        evidenceUrls.length > 0
          ? `${detail}\n\nĐính kèm:\n${evidenceUrls.map((u) => `- ${u}`).join("\n")}`
          : detail;

      const row = await createRefundRequest({
        paymentId,
        reason,
        eventId: refundTarget.eventId,
        systemErrorClaim: true,
      });
      setRefunds((prev) => [
        row,
        ...prev.filter((r) => r.paymentId !== paymentId),
      ]);
      setRefundTarget(null);
      setRefundReasonDetail("");
      setRefundFiles([]);
      toastSuccess(
        "Đã gửi yêu cầu hoàn tiền. Chúng tôi sẽ xem xét trong vòng tối đa 7 ngày làm việc."
      );
    } catch (e) {
      const message = getApiErrorMessage(
        e,
        "Gửi yêu cầu hoàn tiền thất bại. Vui lòng thử lại."
      );
      setRefundError(message);
      toastError(message);
    } finally {
      setRefundBusyId(null);
    }
  };

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
                  const existingRefund = refundByPayment.get(p.id);
                  const canRefund =
                    p.status === "paid" &&
                    isRegistrationPayment(p) &&
                    (!existingRefund || existingRefund.status === "rejected");
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
                          {/* Registration: paid → view ticket */}
                          {p.status === "paid" &&
                            !isPackage &&
                            p.registrationId && (
                              <Link
                                href={`/my-registrations/${p.registrationId}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:underline"
                              >
                                Xem vé <ExternalLink className="h-3 w-3" />
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
                              onClick={(event) => {
                                refundTriggerRef.current = event.currentTarget;
                                openRefund(p);
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors disabled:opacity-60 ${
                                refundBusyId === p.id
                                  ? "border-emerald-500/30 bg-emerald-600 text-white"
                                  : "border-orange-300/80 bg-orange-50 text-orange-800 hover:bg-orange-100"
                              }`}
                            >
                              {refundBusyId === p.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Undo2 className="h-3 w-3" />
                              )}
                              {refundBusyId === p.id
                                ? "Đang gửi…"
                                : "Yêu cầu hoàn tiền"}
                            </button>
                          )}
                          {existingRefund ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                refundDetailTriggerRef.current =
                                  event.currentTarget;
                                setRefundDetail({
                                  payment: p,
                                  refund: existingRefund,
                                });
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition-colors hover:brightness-[0.98] ${refundStatusClass(existingRefund.status)}`}
                            >
                              <span>{getRefundStatusLabel(existingRefund.status)}</span>
                              <span aria-hidden="true" className="opacity-50">
                                ·
                              </span>
                              <span className="underline underline-offset-2">
                                Lý do chi tiết
                              </span>
                            </button>
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

      <Dialog
        open={Boolean(refundDetail)}
        onOpenChange={(open) => {
          if (!open) setRefundDetail(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[90dvh] w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border border-border p-0 shadow-2xl sm:max-w-3xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            refundDetailTriggerRef.current?.focus();
          }}
        >
          {refundDetail ? (
            <>
              <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-red-600" />
              <DialogHeader className="space-y-2 border-b border-border/60 px-5 pb-3 pt-4 text-left sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-2 pr-10">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500">
                      Yêu cầu hoàn tiền
                    </p>
                    <DialogTitle className="text-lg font-extrabold tracking-tight">
                      Chi tiết yêu cầu
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-muted-foreground">
                      {refundDetail.payment.eventName || "Giải chạy"}
                      {refundDetail.payment.bibNumber
                        ? ` · BIB ${refundDetail.payment.bibNumber}`
                        : ""}
                    </DialogDescription>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${refundStatusClass(refundDetail.refund.status)}`}
                  >
                    {getRefundStatusLabel(refundDetail.refund.status)}
                  </span>
                </div>
              </DialogHeader>
              <button
                type="button"
                onClick={() => setRefundDetail(null)}
                aria-label="Đóng"
                className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X aria-hidden="true" className="size-5" />
              </button>

              {(() => {
                const parsed = parseRefundReason(refundDetail.refund.reason || "");
                const paidWhen =
                  refundDetail.payment.paidAt || refundDetail.payment.createdAt;
                const receivedAt =
                  refundDetail.refund.updatedAt ||
                  (refundDetail.refund.status === "requested"
                    ? null
                    : refundDetail.refund.createdAt);
                return (
                  <div className="grid max-h-[min(68dvh,34rem)] gap-0 overflow-y-auto md:grid-cols-2">
                    <section className="space-y-3 border-b border-border/60 p-5 md:border-b-0 md:border-r sm:p-6">
                      <h3 className="text-sm font-extrabold tracking-tight">
                        Thông tin thanh toán
                      </h3>
                      <dl className="space-y-3 rounded-xl bg-muted/50 p-4 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Giải / cự ly</dt>
                          <dd className="mt-1 font-semibold">
                            {refundDetail.payment.eventName || "—"}
                          </dd>
                          <dd className="text-xs text-muted-foreground">
                            {refundDetail.payment.distanceName || "—"}
                            {refundDetail.payment.bibNumber
                              ? ` · BIB ${refundDetail.payment.bibNumber}`
                              : ""}
                          </dd>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Đã thanh toán
                            </dt>
                            <dd className="mt-1 font-extrabold text-orange-700">
                              {formatPrice(
                                Number(
                                  refundDetail.refund.paidAmount ??
                                    refundDetail.payment.amount ??
                                    0
                                )
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Số tiền hoàn
                            </dt>
                            <dd className="mt-1 font-extrabold text-sky-700">
                              {formatPrice(Number(refundDetail.refund.amount || 0))}
                            </dd>
                          </div>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Thời gian thanh toán
                          </dt>
                          <dd className="mt-1">
                            {paidWhen
                              ? formatDateTime(paidWhen)
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Trạng thái giao dịch
                          </dt>
                          <dd className="mt-1">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusClass(refundDetail.payment.status)}`}
                            >
                              {getPaymentStatusLabel(refundDetail.payment.status)}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section className="space-y-3 p-5 sm:p-6">
                      <h3 className="text-sm font-extrabold tracking-tight">
                        Yêu cầu hoàn
                      </h3>
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Thời gian gửi</dt>
                          <dd className="mt-1">
                            {formatDateTime(refundDetail.refund.createdAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">
                            Thời gian nhận / cập nhật
                          </dt>
                          <dd className="mt-1">
                            {receivedAt ? formatDateTime(receivedAt) : "Đang chờ xử lý"}
                          </dd>
                        </div>
                      </dl>

                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Lý do hoàn
                        </p>
                        <p className="whitespace-pre-wrap rounded-xl border border-border bg-card px-3 py-2.5 text-sm leading-relaxed">
                          {parsed.text}
                        </p>
                      </div>

                      <div>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Đính kèm
                        </p>
                        {parsed.urls.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Không có đính kèm.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {parsed.urls.map((url) =>
                              isImageUrl(url) ? (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="overflow-hidden rounded-xl border border-border"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt="Đính kèm"
                                    className="h-24 w-24 object-cover"
                                  />
                                </a>
                              ) : (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
                                >
                                  <Paperclip className="size-3.5" />
                                  Mở file
                                  <ExternalLink className="size-3" />
                                </a>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      {refundDetail.refund.rejectReason ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                          <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                            Lý do từ chối
                          </p>
                          <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                            {refundDetail.refund.rejectReason}
                          </p>
                        </div>
                      ) : null}
                    </section>
                  </div>
                );
              })()}

              <div className="flex justify-end border-t border-border/60 bg-muted/20 px-5 py-3.5 sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRefundDetail(null)}
                  className="min-h-11 rounded-xl px-4 font-semibold"
                >
                  Đóng
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(refundTarget)}
        onOpenChange={(open) => {
          if (!open && !refundBusyId) {
            setRefundTarget(null);
            setRefundFiles([]);
            setRefundReasonDetail("");
            setRefundError(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[90dvh] w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border border-border p-0 shadow-2xl sm:max-w-lg"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            refundTriggerRef.current?.focus();
          }}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 to-red-600" />

          <DialogHeader className="space-y-1 border-b border-border/60 px-5 pb-3 pt-4 text-left sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-orange-500">
              Lịch sử thanh toán
            </p>
            <DialogTitle className="pr-10 text-lg font-extrabold tracking-tight">
              Yêu cầu hoàn tiền
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {refundTarget?.eventName || "Giải chạy"}
              {refundTarget?.bibNumber ? ` · BIB ${refundTarget.bibNumber}` : ""}
            </DialogDescription>
          </DialogHeader>

          <button
            type="button"
            disabled={Boolean(refundBusyId)}
            onClick={() => {
              setRefundTarget(null);
              setRefundFiles([]);
              setRefundReasonDetail("");
              setRefundError(null);
            }}
            aria-label="Đóng"
            className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <X aria-hidden="true" className="size-5" />
          </button>

          <div className="max-h-[min(60dvh,28rem)] space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="flex gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <p className="leading-relaxed">
                Chỉ dùng khi nghi{" "}
                <span className="font-semibold">lỗi hệ thống</span>. Lý do cá nhân
                không được hoàn. Chúng tôi sẽ xem xét yêu cầu của bạn trong vòng tối
                đa 7 ngày làm việc.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="refund-reason-detail" className="text-sm font-bold">
                Mô tả lỗi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="refund-reason-detail"
                value={refundReasonDetail}
                disabled={Boolean(refundBusyId)}
                onChange={(e) => {
                  setRefundReasonDetail(e.target.value);
                  if (refundError) setRefundError(null);
                }}
                rows={4}
                required
                minLength={20}
                maxLength={1000}
                className="min-h-28 rounded-xl border-border text-sm outline-none focus-visible:border-orange-400 focus-visible:ring-orange-500/20"
                placeholder="Ví dụ: đã trừ tiền nhưng vé vẫn pending, thanh toán trùng…"
              />
              <p className="text-xs text-muted-foreground">
                Tối thiểu 20 ký tự · {refundReasonDetail.trim().length}/1000
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">Đính kèm (tuỳ chọn)</Label>
              <input
                ref={refundFileInputRef}
                id="refund-evidence"
                type="file"
                accept="image/*,.pdf"
                multiple
                disabled={Boolean(refundBusyId) || refundFiles.length >= 3}
                onChange={(e) => {
                  onPickRefundFiles(e.target.files);
                  e.target.value = "";
                }}
                className="sr-only"
              />
              <button
                type="button"
                disabled={Boolean(refundBusyId) || refundFiles.length >= 3}
                onClick={() => refundFileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300/70 bg-orange-50/40 px-4 py-3.5 text-sm font-semibold text-orange-800 transition-colors hover:bg-orange-50 disabled:opacity-50"
              >
                <Upload className="size-4" />
                {refundFiles.length >= 3
                  ? "Đã đủ 3 file"
                  : "Chọn ảnh hoặc PDF"}
              </button>
              <p className="text-xs text-muted-foreground">
                Tối đa 3 file · ảnh screenshot / biên lai giúp duyệt nhanh hơn.
              </p>
              {refundFiles.length > 0 ? (
                <ul className="space-y-1.5">
                  {refundFiles.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm shadow-sm"
                    >
                      <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                        <Paperclip className="size-3.5 shrink-0 text-orange-600" />
                        <span className="truncate font-medium">{f.name}</span>
                      </span>
                      <button
                        type="button"
                        disabled={Boolean(refundBusyId)}
                        className="shrink-0 text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
                        onClick={() =>
                          setRefundFiles((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {refundError ? (
              <p
                id="refund-error"
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800"
              >
                {refundError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-3.5 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(refundBusyId)}
              onClick={() => {
                setRefundTarget(null);
                setRefundFiles([]);
                setRefundReasonDetail("");
                setRefundError(null);
              }}
              className="min-h-11 rounded-xl border-border px-4 font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={
                !isRefundReasonReady("system_error", refundReasonDetail) ||
                Boolean(refundBusyId)
              }
              onClick={() => void submitRefund()}
              className={`min-h-11 rounded-xl px-4 font-bold text-white shadow-sm disabled:opacity-60 ${
                refundBusyId
                  ? "bg-emerald-600 hover:bg-emerald-600"
                  : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              }`}
            >
              {refundBusyId ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Đang gửi…
                </span>
              ) : (
                "Gửi yêu cầu hoàn tiền"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
