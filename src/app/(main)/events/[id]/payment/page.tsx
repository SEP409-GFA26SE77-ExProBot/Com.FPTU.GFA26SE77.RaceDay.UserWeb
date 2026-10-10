"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getEventById, getRegistrationById, cancelRegistration } from "@/api/events";
import { createCheckout, syncPayment, mockCancel } from "@/api/payments";
import { RaceEventDto, RegistrationDto } from "@/dto/event.dto";
import type { CheckoutResponseDto } from "@/dto/payment.dto";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import { PayOsEmbedded } from "@/components/payment/PayOsEmbedded";
import { VietQrCheckout } from "@/components/payment/VietQrCheckout";

type PaymentState = "booting" | "checkout" | "success" | "error";

function toAbsoluteCheckoutUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (typeof window === "undefined") return url;
  const base = window.location.origin;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function PaymentContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventId = String(params.id);
  const regId = searchParams.get("regId");
  const abandon = searchParams.get("abandon") === "1";

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [registration, setRegistration] = useState<RegistrationDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [paymentState, setPaymentState] = useState<PaymentState>("booting");
  const [checkout, setCheckout] = useState<CheckoutResponseDto | null>(null);
  const [returnUrl, setReturnUrl] = useState("");

  const startedCheckoutRef = useRef(false);
  const cancellingRef = useRef(false);

  /** Quay lại form: giữ draft + đơn pending → nút «Tiếp tục thanh toán» */
  const returnToFormKeepDraft = useCallback(() => {
    router.push(`/events/${eventId}/register?resume=1`);
  }, [router, eventId]);

  /** Hủy thanh toán: xóa đơn + form sạch */
  const cancelAndWipe = useCallback(async () => {
    if (cancellingRef.current) return;
    cancellingRef.current = true;
    const reg = registration?.id || regId;
    const payId = checkout?.paymentId;
    try {
      if (payId) {
        try {
          await mockCancel(payId);
        } catch {
          /* live: không có mock-cancel */
        }
      }
      if (reg) {
        try {
          await cancelRegistration(reg);
        } catch {
          /* đã hủy */
        }
      }
    } finally {
      try {
        sessionStorage.removeItem(`registration_form_draft_${eventId}`);
        sessionStorage.removeItem("registration_data");
        sessionStorage.removeItem("last_registration_id");
        sessionStorage.removeItem("confirmation_data");
      } catch {
        /* ignore */
      }
      router.push(`/events/${eventId}/register`);
    }
  }, [router, eventId, registration?.id, regId, checkout?.paymentId]);

  const goPending = useCallback(
    (paymentId: string) => {
      const id = registration?.id || regId;
      router.push(
        `/events/${eventId}/pending?regId=${id}&paymentId=${paymentId}&status=PAID`
      );
    },
    [router, eventId, registration?.id, regId]
  );

  // PayOS redirect cancelUrl (?abandon=1) → hủy đơn → form sạch
  useEffect(() => {
    if (!abandon) return;
    void cancelAndWipe();
  }, [abandon, cancelAndWipe]);

  useEffect(() => {
    if (abandon) return;
    let isMounted = true;

    async function loadAndCheckout() {
      setPaymentState("booting");
      setError(null);
      startedCheckoutRef.current = false;

      try {
        const eventData = await getEventById(eventId);
        if (!isMounted) return;
        setEvent(eventData);

        let reg: RegistrationDto | null = null;
        if (regId) {
          try {
            reg = await getRegistrationById(regId);
          } catch {
            const stored = sessionStorage.getItem("registration_data");
            if (stored) {
              const parsed = JSON.parse(stored);
              reg = {
                id: parsed.registrationId || regId,
                userId: "",
                eventId: parsed.eventId || eventId,
                distanceId: parsed.distance?.id || "",
                status: "pending_payment",
                fullName: parsed.fullName || "Vận động viên",
                email: parsed.email || "",
                phone: "",
                eventName: parsed.eventTitle || eventData.name,
                distanceName:
                  parsed.distance?.name || parsed.distance?.type || "Cự ly",
                distanceKm: parsed.distance?.distanceKm || 0,
                distancePrice: parsed.distance?.price || 0,
              };
            }
          }
        }

        if (!isMounted) return;
        setRegistration(reg);

        const effectiveId = reg?.id || regId;
        if (!effectiveId) {
          setError("Không tìm thấy mã đăng ký. Vui lòng đăng ký lại.");
          setPaymentState("error");
          return;
        }

        if (startedCheckoutRef.current) return;
        startedCheckoutRef.current = true;

        const origin = window.location.origin;
        const nextReturnUrl = `${origin}/events/${eventId}/pending?regId=${effectiveId}`;
        // PayOS hủy → quay lại đây để FE hủy đơn rồi về form sạch
        const cancelUrl = `${origin}/events/${eventId}/payment?regId=${effectiveId}&abandon=1`;

        const checkoutRes = await createCheckout({
          registrationId: effectiveId,
          returnUrl: nextReturnUrl,
          cancelUrl,
        });

        if (!isMounted) return;

        if (!checkoutRes.checkoutUrl && !checkoutRes.qrCode) {
          throw new Error("Không nhận được liên kết thanh toán từ PayOS.");
        }

        const amount = reg?.distancePrice || checkoutRes.amount || 0;
        sessionStorage.setItem(
          "confirmation_data",
          JSON.stringify({
            registrationId: effectiveId,
            paymentId: checkoutRes.paymentId,
            eventId,
            eventTitle: reg?.eventName || eventData.name || "",
            distanceLabel: reg?.distanceName || "",
            distanceKm: reg?.distanceKm || 0,
            fullName: reg?.fullName || "Vận động viên",
            email: reg?.email || "",
            price: amount,
            registeredAt: new Date().toISOString(),
          })
        );
        sessionStorage.setItem("last_registration_id", effectiveId);

        setReturnUrl(nextReturnUrl);
        setCheckout({
          ...checkoutRes,
          checkoutUrl: checkoutRes.checkoutUrl
            ? toAbsoluteCheckoutUrl(checkoutRes.checkoutUrl)
            : "",
          amount: checkoutRes.amount ?? amount,
        });
        setPaymentState("checkout");
      } catch (err) {
        if (!isMounted) return;
        setError(
          getApiErrorMessage(err, "Không thể mở cổng thanh toán. Vui lòng thử lại.")
        );
        setPaymentState("error");
      }
    }

    loadAndCheckout();

    return () => {
      isMounted = false;
    };
  }, [eventId, regId, abandon]);

  const useNativeVietQr = Boolean(checkout?.qrCode);
  const activePaymentId = checkout?.paymentId || null;

  // Poll sync khi dùng khung VietQR tự vẽ
  useEffect(() => {
    if (paymentState !== "checkout" || !useNativeVietQr || !activePaymentId) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const p = await syncPayment(activePaymentId);
        if (cancelled) return;
        if (String(p.status).toLowerCase() === "paid") {
          setPaymentState("success");
          setTimeout(() => goPending(activePaymentId), 600);
        }
      } catch {
        /* chờ lần sau */
      }
    };

    const id = window.setInterval(tick, 3500);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [paymentState, useNativeVietQr, activePaymentId, goPending]);

  const handleEmbedSuccess = useCallback(() => {
    setPaymentState("success");
    if (activePaymentId) setTimeout(() => goPending(activePaymentId), 600);
    else returnToFormKeepDraft();
  }, [activePaymentId, goPending, returnToFormKeepDraft]);

  if (paymentState === "booting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CreditCard className="h-7 w-7 text-orange-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Đang mở thanh toán…</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Chuẩn bị mã VietQR và thông tin chuyển khoản trong cùng một khung.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span>Bảo mật PayOS SSL</span>
        </div>
      </div>
    );
  }

  if (paymentState === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Thanh toán thành công!</h2>
        <p className="text-sm text-muted-foreground">Đang chuyển tới trang chờ duyệt…</p>
        <Loader2 className="mt-3 h-5 w-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (paymentState === "error" || !checkout) {
    return (
      <div className={`${PAGE_SHELL_FORM} py-16 text-center space-y-4`}>
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="text-xl font-extrabold">Không mở được thanh toán</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {error || "Vui lòng quay lại form đăng ký và thử lại."}
        </p>
        <button
          type="button"
          onClick={returnToFormKeepDraft}
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về form đăng ký
        </button>
      </div>
    );
  }

  const amountToPay = checkout.amount ?? registration?.distancePrice ?? 0;
  const effectiveRegistrationId = registration?.id || regId;

  return (
    <div className={`${PAGE_SHELL_FORM} py-6 sm:py-8`}>
      <div className="mb-4">
        <button
          type="button"
          onClick={returnToFormKeepDraft}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại form đăng ký
        </button>
      </div>

      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Thanh toán đơn đăng ký
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quét VietQR hoặc chuyển khoản — cùng một khung bên dưới.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0 border-b lg:border-b-0 lg:border-r border-border">
            {useNativeVietQr ? (
              <VietQrCheckout
                qrCode={checkout.qrCode}
                accountNumber={checkout.accountNumber}
                accountName={checkout.accountName}
                bin={checkout.bin}
                transferDescription={checkout.transferDescription}
                amount={amountToPay}
                polling
              />
            ) : (
              <PayOsEmbedded
                key={checkout.checkoutUrl}
                checkoutUrl={checkout.checkoutUrl}
                returnUrl={returnUrl}
                onSuccess={handleEmbedSuccess}
                onCancel={() => void cancelAndWipe()}
                onExit={returnToFormKeepDraft}
                className="w-full h-[min(480px,62vh)] bg-white"
              />
            )}
          </div>

          <aside className="p-5 space-y-4 bg-muted/20">
            <h2 className="font-bold text-foreground text-sm">Thông tin đơn hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Giải chạy</span>
                <span className="font-medium text-foreground text-right line-clamp-2">
                  {registration?.eventName || event?.name}
                </span>
              </div>
              {registration?.distanceKm ? (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Khoảng cách</span>
                  <span className="font-medium text-foreground">
                    {registration.distanceKm} km
                  </span>
                </div>
              ) : null}
              {registration?.fullName && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">VĐV</span>
                  <span className="font-medium text-foreground text-right line-clamp-2">
                    {registration.fullName}
                  </span>
                </div>
              )}
              {effectiveRegistrationId && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Mã ĐK</span>
                  <span className="font-mono text-[11px] text-muted-foreground text-right break-all max-w-[130px]">
                    {effectiveRegistrationId}
                  </span>
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            <div className="flex justify-between items-baseline gap-2">
              <span className="text-sm font-bold text-foreground">Tổng</span>
              <span className="text-xl font-extrabold text-orange-600">
                {formatPrice(amountToPay)}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              PayOS xác nhận xong sẽ tự chuyển trang. «Quay lại form» giữ thông tin + đơn chờ thanh toán; «Hủy thanh toán» xóa đơn và form trống.
            </p>

            <button
              type="button"
              onClick={() => void cancelAndWipe()}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Hủy thanh toán
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Đang tải trang thanh toán…</p>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
