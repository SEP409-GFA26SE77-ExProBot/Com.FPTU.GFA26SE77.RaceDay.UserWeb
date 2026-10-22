"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { getPaymentStatus, mockPay, syncPayment } from "@/api/payments";
import { BASE_URL } from "@/config/global-config";
import { CONTINUABLE_PAYMENT_STATUSES, loadPaymentOrder, startContinuedPayment, type PaymentOrder } from "@/lib/continue-payment";
import { getApiErrorMessage } from "@/lib/error";
import { formatPrice, getPaymentStatusLabel } from "@/lib/format";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import { VietQrCheckout } from "./VietQrCheckout";
import { PayOsEmbedded } from "./PayOsEmbedded";

type ActiveCheckout = Awaited<ReturnType<typeof startContinuedPayment>>;

export default function ContinuePaymentCheckout({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mock, setMock] = useState(false);
  const [active, setActive] = useState<ActiveCheckout | null>(null);
  const starting = useRef(false);
  const finished = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loaded, status] = await Promise.all([
          loadPaymentOrder(paymentId),
          getPaymentStatus().catch(() => null),
        ]);
        if (cancelled) return;
        setOrder(loaded);
        setMock(status?.payOsMode === "mock");
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "Không tải được đơn thanh toán."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [paymentId]);

  const confirmPayment = useCallback(async () => {
    if (!active || finished.current) return;
    const payment = await syncPayment(active.checkout.paymentId);
    if (payment.status === "paid") {
      finished.current = true;
      router.replace(`${active.successPath}&paymentId=${encodeURIComponent(payment.id)}`);
    } else if (["cancelled", "failed", "expired"].includes(payment.status)) {
      setActive(null);
      setError("Thanh toán đã hủy hoặc hết hạn. Bạn có thể thử lại.");
    }
  }, [active, router]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let polling = false;
    const tick = async () => {
      if (cancelled || polling) return;
      polling = true;
      try {
        await confirmPayment();
      } catch {
        // A temporary sync failure should not interrupt checkout.
      } finally {
        polling = false;
      }
    };
    const interval = window.setInterval(() => void tick(), 3500);
    void tick();
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [active, confirmPayment]);

  const openCheckout = async () => {
    if (!order || starting.current) return;
    starting.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = await startContinuedPayment(order, window.location.origin, setOrder);
      if (!next.checkout.checkoutUrl && !next.checkout.qrCode) {
        throw new Error("Không nhận được thông tin thanh toán. Vui lòng thử lại.");
      }
      if (next.checkout.checkoutUrl) {
        const url = new URL(next.checkout.checkoutUrl, new URL(BASE_URL || "/", window.location.origin));
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("Liên kết thanh toán không hợp lệ.");
        next.checkout.checkoutUrl = url.href;
      }
      finished.current = false;
      setActive(next);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không thể tiếp tục thanh toán."));
    } finally {
      starting.current = false;
      setBusy(false);
    }
  };

  const confirmMock = async () => {
    if (!active || busy) return;
    setBusy(true);
    setError(null);
    try {
      await mockPay(active.checkout.paymentId);
      await confirmPayment();
    } catch (e) {
      setError(getApiErrorMessage(e, "Không thể giả lập thanh toán."));
    } finally {
      setBusy(false);
    }
  };

  const closeCheckout = useCallback(() => {
    setActive(null);
    setError("Đã đóng thanh toán. Bạn có thể tiếp tục khi sẵn sàng.");
  }, []);

  if (loading) return <PageLoading title="Đang tải đơn thanh toán…" icon={CreditCard} />;

  const canContinue = order && CONTINUABLE_PAYMENT_STATUSES.includes(order.payment.status);
  const amount = active?.checkout.amount ?? order?.payment.amount ?? 0;

  return (
    <div className={`${PAGE_SHELL_FORM} space-y-5 py-8`}>
      <Link href="/payments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Lịch sử thanh toán
      </Link>
      <div>
        <h1 className="text-2xl font-extrabold">Tiếp tục thanh toán</h1>
        <p className="mt-1 text-sm text-muted-foreground">Xem lại đơn hàng và hoàn tất thanh toán.</p>
      </div>
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {order && (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <h2 className="font-bold">{order.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{order.detail}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{getPaymentStatusLabel(active ? "pending" : order.payment.status)}</span>
            <span className="text-2xl font-extrabold text-orange-600">{formatPrice(amount)}</span>
          </div>
          {!active && canContinue && (
            <>
              <p className="text-xs text-muted-foreground">Đơn đã hủy được tạo lại từ thông tin đã lưu. Giá và tình trạng chỗ được kiểm tra khi mở thanh toán.</p>
              <button type="button" disabled={busy} onClick={() => void openCheckout()} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {busy ? "Đang mở thanh toán…" : "Tiếp tục thanh toán"}
              </button>
            </>
          )}
          {!canContinue && <p className="text-sm text-muted-foreground">Giao dịch này không cần thanh toán lại.</p>}
        </section>
      )}
      {active && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          {active.checkout.qrCode ? (
            <VietQrCheckout {...active.checkout} amount={amount} polling />
          ) : (
            <PayOsEmbedded checkoutUrl={active.checkout.checkoutUrl} returnUrl={active.returnUrl} onSuccess={() => void confirmPayment().catch((e) => setError(getApiErrorMessage(e, "Chưa xác nhận được thanh toán.")))} onCancel={closeCheckout} onExit={closeCheckout} className="h-[min(520px,70vh)] w-full bg-white" />
          )}
          {mock && (
            <div className="space-y-3 border-t border-border p-4">
              <p className="text-xs text-muted-foreground">Chế độ thử nghiệm: thanh toán không chuyển tiền thật.</p>
              <button type="button" disabled={busy} onClick={() => void confirmMock()} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {busy ? "Đang xác nhận…" : "Giả lập thanh toán thành công"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
