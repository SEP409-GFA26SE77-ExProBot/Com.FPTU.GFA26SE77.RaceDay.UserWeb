"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
} from "lucide-react";
import { syncPayment, mockPay } from "@/api/payments";
import type { CheckoutResponseDto } from "@/dto/payment.dto";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { VietQrCheckout } from "./VietQrCheckout";
import { PayOsEmbedded } from "./PayOsEmbedded";

export interface OrderSummaryItem {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export interface PaymentCheckoutViewProps {
  /** Dữ liệu checkout nhận từ API createCheckout hoặc createPackageCheckout */
  checkout: CheckoutResponseDto;
  /** Return URL khi PayOS hoàn tất */
  returnUrl?: string;
  /** Số tiền hiển thị (fallback nếu checkout.amount không có) */
  amount?: number;
  /** Tiêu đề màn hình thanh toán */
  title?: string;
  /** Phụ đề hướng dẫn */
  subtitle?: string;
  /** Nhãn nhỏ phía trên tiêu đề (kicker badge) */
  kicker?: string;
  /** Tiêu đề mục tóm tắt đơn (mặc định: "Chi tiết đơn hàng") */
  orderSummaryTitle?: string;
  /** Danh sách các dòng thông tin đơn hàng */
  orderSummaryItems?: OrderSummaryItem[];
  /** Ghi chú hiển thị dưới tổng tiền */
  orderSummaryNotes?: React.ReactNode;
  /** Callback khi thanh toán thành công (qua PayOS callback, polling sync hoặc mock pay) */
  onSuccess: (paymentId: string) => void;
  /** Callback khi người dùng nhấn Hủy thanh toán */
  onCancel?: () => void;
  /** Callback khi người dùng thoát/quay lại form */
  onExit?: () => void;
  /** Nhãn cho nút Hủy (nếu có onCancel) */
  cancelLabel?: string;
  /** Nhãn cho nút Quay lại (nếu có onExit) */
  exitLabel?: string;
  /** Bật khung nút Giả lập thanh toán (Mock Pay) cho môi trường test/dev */
  enableMockPay?: boolean;
  /** Tần số polling kiểm tra trạng thái thanh toán VietQR (mili-giây, mặc định: 3500) */
  pollingIntervalMs?: number;
  /** Tuỳ chỉnh className bọc ngoài */
  className?: string;
}

/**
 * Component thanh toán đa năng, tái sử dụng cho toàn bộ các trang (EventPackage, Registration, v.v.):
 * - Tự động hiển thị VietQR (nếu có qrCode) hoặc nhúng PayOS iframe
 * - Tự động đồng bộ (polling) trạng thái thanh toán VietQR
 * - Tích hợp sẵn bộ giả lập thanh toán (Mock Pay) cho Dev/QA
 * - Đồng bộ layout thẻ tóm tắt đơn hàng và tính tổng tiền
 */
export function PaymentCheckoutView({
  checkout,
  returnUrl = "",
  amount,
  title = "Thanh toán đơn hàng",
  subtitle = "Quét VietQR hoặc chuyển khoản bên dưới — cùng một khung bảo mật.",
  kicker,
  orderSummaryTitle = "Chi tiết đơn hàng",
  orderSummaryItems = [],
  orderSummaryNotes,
  onSuccess,
  onCancel,
  onExit,
  cancelLabel = "Hủy thanh toán",
  exitLabel,
  enableMockPay = true,
  pollingIntervalMs = 3500,
  className = "",
}: PaymentCheckoutViewProps) {
  const activePaymentId = checkout.paymentId || "";
  const useNativeVietQr = Boolean(checkout.qrCode);
  const totalAmount = checkout.amount ?? amount ?? 0;

  // Mock Pay states
  const [mockPaying, setMockPaying] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);

  // Auto Polling VietQR
  useEffect(() => {
    if (!useNativeVietQr || !activePaymentId) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const p = await syncPayment(activePaymentId);
        if (cancelled) return;
        if (String(p.status).toLowerCase() === "paid") {
          onSuccess(activePaymentId);
        }
      } catch {
        /* chờ lượt poll kế tiếp */
      }
    };

    const id = window.setInterval(tick, pollingIntervalMs);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [useNativeVietQr, activePaymentId, pollingIntervalMs, onSuccess]);

  const handleMockPay = useCallback(async () => {
    if (!activePaymentId) {
      setMockError("Không tìm thấy mã thanh toán (paymentId).");
      return;
    }
    setMockPaying(true);
    setMockError(null);
    try {
      await mockPay(activePaymentId);
      onSuccess(activePaymentId);
    } catch (e) {
      setMockError(getApiErrorMessage(e, "Giả lập thanh toán thất bại."));
    } finally {
      setMockPaying(false);
    }
  }, [activePaymentId, onSuccess]);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Header */}
      <div>
        {kicker && (
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            {kicker}
          </p>
        )}
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Main Payment Container */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
          {/* Left panel: VietQR or PayOS Iframe */}
          <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
            {useNativeVietQr ? (
              <VietQrCheckout
                qrCode={checkout.qrCode}
                accountNumber={checkout.accountNumber}
                accountName={checkout.accountName}
                bin={checkout.bin}
                transferDescription={checkout.transferDescription}
                amount={totalAmount}
                polling
              />
            ) : (
              <PayOsEmbedded
                key={checkout.checkoutUrl}
                checkoutUrl={checkout.checkoutUrl}
                returnUrl={returnUrl}
                onSuccess={() => onSuccess(activePaymentId)}
                onCancel={onCancel ?? (() => {})}
                onExit={onExit ?? (() => {})}
                className="h-[min(480px,62vh)] w-full bg-white"
              />
            )}
          </div>

          {/* Right panel: Order details, total & Mock Mode */}
          <aside className="space-y-4 bg-muted/20 p-5">
            <h3 className="text-sm font-bold text-foreground">
              {orderSummaryTitle}
            </h3>

            {orderSummaryItems.length > 0 && (
              <div className="space-y-2.5 text-sm">
                {orderSummaryItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between gap-3 ${item.className ?? ""}`}
                  >
                    <span className="text-muted-foreground shrink-0">
                      {item.label}
                    </span>
                    <span className="text-right font-medium text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Total */}
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-bold text-foreground">Tổng</span>
              <span className="text-xl font-extrabold text-orange-600">
                {formatPrice(totalAmount)}
              </span>
            </div>

            {orderSummaryNotes && (
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                {orderSummaryNotes}
              </div>
            )}

            {/* Mock Payment Box */}
            {enableMockPay && (
              <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                    Thử nghiệm / Test
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    MOCK MODE
                  </span>
                </div>
                <button
                  type="button"
                  disabled={mockPaying || !activePaymentId}
                  onClick={() => void handleMockPay()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {mockPaying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {mockPaying
                    ? "Đang giả lập thanh toán…"
                    : "Giả lập thanh toán (Mock Pay)"}
                </button>
                {mockError && (
                  <p className="text-[11px] text-red-500 font-medium">
                    {mockError}
                  </p>
                )}
                <p className="text-[10px] leading-tight text-muted-foreground">
                  Bấm để gọi API{" "}
                  <code className="font-mono text-emerald-700 dark:text-emerald-400">
                    mockPay()
                  </code>{" "}
                  xác nhận đơn đã thanh toán thành công.
                </p>
              </div>
            )}

            {/* Action Buttons (Exit / Cancel) */}
            <div className="space-y-2 pt-1">
              {onExit && exitLabel && (
                <button
                  type="button"
                  onClick={onExit}
                  className="w-full rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {exitLabel}
                </button>
              )}
              {onCancel && cancelLabel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {cancelLabel}
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Component màn hình chờ mở thanh toán */
export function PaymentBootingView({
  title = "Đang mở thanh toán…",
  subtitle = "Chuẩn bị mã VietQR và thông tin chuyển khoản trong cùng một khung.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <CreditCard className="h-7 w-7 text-orange-500" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-sm">{subtitle}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>Bảo mật PayOS SSL</span>
      </div>
    </div>
  );
}

/** Component màn hình thông báo thanh toán thành công */
export function PaymentSuccessView({
  title = "Thanh toán thành công!",
  subtitle = "Đang chuyển tiếp tới trang tiếp theo…",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <Loader2 className="mt-3 h-5 w-5 text-muted-foreground animate-spin" />
    </div>
  );
}
