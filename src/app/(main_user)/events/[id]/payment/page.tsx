"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { getEventById, getRegistrationById, cancelRegistration } from "@/api/events";
import { createCheckout, mockCancel } from "@/api/payments";
import { RaceEventDto, RegistrationDto } from "@/dto/event.dto";
import type { CheckoutResponseDto } from "@/dto/payment.dto";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import {
  PaymentCheckoutView,
  PaymentBootingView,
  PaymentSuccessView,
} from "@/components/payment";

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
      setPaymentState("success");
      setTimeout(() => {
        router.push(
          `/events/${eventId}/pending?regId=${id}&paymentId=${paymentId}&status=PAID`
        );
      }, 600);
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

  if (paymentState === "booting") {
    return <PaymentBootingView />;
  }

  if (paymentState === "success") {
    return <PaymentSuccessView subtitle="Đang chuyển tới trang chờ duyệt…" />;
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

  const effectiveRegistrationId = registration?.id || regId;

  return (
    <div className={`${PAGE_SHELL_FORM} py-6 sm:py-8`}>
      <div className="mb-4">
        <button
          type="button"
          onClick={returnToFormKeepDraft}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại form đăng ký
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <PaymentCheckoutView
        title="Thanh toán đơn đăng ký"
        subtitle="Quét VietQR hoặc chuyển khoản — cùng một khung bảo mật bên dưới."
        checkout={checkout}
        returnUrl={returnUrl}
        amount={checkout.amount ?? registration?.distancePrice ?? 0}
        orderSummaryTitle="Thông tin đơn hàng"
        orderSummaryItems={[
          {
            label: "Giải chạy",
            value: (
              <span className="line-clamp-2">
                {registration?.eventName || event?.name}
              </span>
            ),
          },
          ...(registration?.distanceKm
            ? [{ label: "Khoảng cách", value: `${registration.distanceKm} km` }]
            : []),
          ...(registration?.fullName
            ? [{ label: "VĐV", value: registration.fullName }]
            : []),
          ...(effectiveRegistrationId
            ? [
                {
                  label: "Mã ĐK",
                  value: (
                    <span className="font-mono text-[11px] text-muted-foreground break-all">
                      {effectiveRegistrationId}
                    </span>
                  ),
                },
              ]
            : []),
        ]}
        orderSummaryNotes="PayOS xác nhận xong sẽ tự chuyển trang. «Quay lại form» giữ thông tin + đơn chờ thanh toán; «Hủy thanh toán» xóa đơn và form trống."
        onSuccess={goPending}
        onCancel={() => void cancelAndWipe()}
        onExit={returnToFormKeepDraft}
        cancelLabel="Hủy thanh toán"
        exitLabel="Quay lại form đăng ký"
        enableMockPay={true}
      />
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
