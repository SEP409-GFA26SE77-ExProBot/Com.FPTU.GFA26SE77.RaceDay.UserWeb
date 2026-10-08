"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Shield,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { getEventById, getRegistrationById } from "@/api/events";
import { createCheckout, mockPay, getPaymentStatus } from "@/api/payments";
import { RaceEventDto, RegistrationDto } from "@/dto/event.dto";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";

type PaymentState = "form" | "processing" | "redirecting" | "success";

function PaymentContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventId = String(params.id);
  const regId = searchParams.get("regId");
  const isCancelled = searchParams.get("cancelled") === "true";

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [registration, setRegistration] = useState<RegistrationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payOsMode, setPayOsMode] = useState<"mock" | "live">("mock");

  const [paymentState, setPaymentState] = useState<PaymentState>("form");
  const [isSimulating, setIsSimulating] = useState(false);

  // Load registration and event data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch event
        const eventData = await getEventById(eventId);
        if (isMounted) setEvent(eventData);

        // Fetch PayOS status mode
        try {
          const status = await getPaymentStatus();
          if (isMounted && status?.payOsMode) {
            setPayOsMode(status.payOsMode);
          }
        } catch {
          // Default to mock if status call fails
        }

        // Fetch registration details
        if (regId) {
          try {
            const regData = await getRegistrationById(regId);
            if (isMounted) setRegistration(regData);
          } catch {
            // Fallback to sessionStorage if direct API call fails
            const stored = sessionStorage.getItem("registration_data");
            if (stored && isMounted) {
              const parsed = JSON.parse(stored);
              setRegistration({
                id: parsed.registrationId || regId,
                userId: "",
                eventId: parsed.eventId || eventId,
                distanceId: parsed.distance?.id || "",
                status: "pending_payment",
                fullName: parsed.fullName || "Runner",
                email: parsed.email || "",
                phone: "",
                eventName: parsed.eventTitle || eventData.name,
                distanceName: parsed.distance?.name || parsed.distance?.type || "Distance",
                distanceKm: parsed.distance?.distanceKm || 0,
                distancePrice: parsed.distance?.price || 0,
              });
            }
          }
        } else {
          // Read from sessionStorage fallback
          const stored = sessionStorage.getItem("registration_data");
          if (stored && isMounted) {
            const parsed = JSON.parse(stored);
            setRegistration({
              id: parsed.registrationId || "",
              userId: "",
              eventId: parsed.eventId || eventId,
              distanceId: parsed.distance?.id || "",
              status: "pending_payment",
              fullName: parsed.fullName || "Runner",
              email: parsed.email || "",
              phone: "",
              eventName: parsed.eventTitle || eventData.name,
              distanceName: parsed.distance?.name || parsed.distance?.type || "Distance",
              distanceKm: parsed.distance?.distanceKm || 0,
              distancePrice: parsed.distance?.price || 0,
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(getApiErrorMessage(err, "Không thể tải thông tin thanh toán. Vui lòng thử lại."));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [eventId, regId]);

  const effectiveRegistrationId = registration?.id || regId;

  // Real PayOS checkout
  const handlePayOSCheckout = async () => {
    if (!effectiveRegistrationId) {
      setError("Không tìm thấy mã đăng ký để tạo thanh toán.");
      return;
    }

    setPaymentState("processing");
    setError(null);

    try {
      const origin = window.location.origin;
      const checkoutRes = await createCheckout({
        registrationId: effectiveRegistrationId,
        returnUrl: `${origin}/events/${eventId}/confirmation?regId=${effectiveRegistrationId}`,
        cancelUrl: `${origin}/events/${eventId}/payment?regId=${effectiveRegistrationId}&cancelled=true`,
      });

      // Save confirmation meta
      sessionStorage.setItem(
        "confirmation_data",
        JSON.stringify({
          registrationId: effectiveRegistrationId,
          paymentId: checkoutRes.paymentId,
          eventId: eventId,
          eventTitle: registration?.eventName || event?.name || "",
          distanceLabel: registration?.distanceName || "",
          distanceKm: registration?.distanceKm || 0,
          fullName: registration?.fullName || "Runner",
          email: registration?.email || "",
          price: registration?.distancePrice || checkoutRes.amount || 0,
          registeredAt: new Date().toISOString(),
        })
      );

      if (checkoutRes.checkoutUrl) {
        setPaymentState("redirecting");
        window.location.href = checkoutRes.checkoutUrl;
      } else {
        throw new Error("Không nhận được liên kết thanh toán từ PayOS.");
      }
    } catch (err) {
      setPaymentState("form");
      setError(getApiErrorMessage(err, "Khởi tạo thanh toán thất bại. Vui lòng thử lại."));
    }
  };

  // Mock / simulation payment
  const handleSimulatePayment = async () => {
    if (!effectiveRegistrationId) {
      setError("Không tìm thấy mã đăng ký để giả lập thanh toán.");
      return;
    }

    setIsSimulating(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const checkoutRes = await createCheckout({
        registrationId: effectiveRegistrationId,
        returnUrl: `${origin}/events/${eventId}/confirmation?regId=${effectiveRegistrationId}`,
        cancelUrl: `${origin}/events/${eventId}/payment?regId=${effectiveRegistrationId}&cancelled=true`,
      });

      // Execute mock payment immediately on backend
      await mockPay(checkoutRes.paymentId);

      // Save confirmation meta
      sessionStorage.setItem(
        "confirmation_data",
        JSON.stringify({
          registrationId: effectiveRegistrationId,
          paymentId: checkoutRes.paymentId,
          eventId: eventId,
          eventTitle: registration?.eventName || event?.name || "",
          distanceLabel: registration?.distanceName || "",
          distanceKm: registration?.distanceKm || 0,
          fullName: registration?.fullName || "Runner",
          email: registration?.email || "",
          price: registration?.distancePrice || checkoutRes.amount || 0,
          registeredAt: new Date().toISOString(),
        })
      );

      setPaymentState("success");
      setTimeout(() => {
        router.push(
          `/events/${eventId}/confirmation?regId=${effectiveRegistrationId}&paymentId=${checkoutRes.paymentId}&status=PAID`
        );
      }, 1200);
    } catch (err) {
      setIsSimulating(false);
      setError(getApiErrorMessage(err, "Giả lập thanh toán thất bại."));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Đang tải thông tin đơn hàng…</p>
      </div>
    );
  }

  if (error && !event && !registration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Không tìm thấy thông tin đơn hàng</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6">{error}</p>
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại giải chạy
        </Link>
      </div>
    );
  }

  // Processing state
  if (paymentState === "processing" || paymentState === "redirecting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="relative mb-8">
          <div className="h-24 w-24 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {paymentState === "redirecting"
            ? "Đang chuyển hướng tới cổng PayOS…"
            : "Đang tạo liên kết thanh toán…"}
        </h2>
        <p className="text-muted-foreground max-w-sm">
          Vui lòng đợi giây lát, hệ thống đang kết nối an toàn với cổng thanh toán.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span>Mã hóa bảo mật PayOS 256-bit SSL</span>
        </div>
      </div>
    );
  }

  // Success state (brief flash before redirect)
  if (paymentState === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 animate-in fade-in-0 duration-500">
          Thanh toán thành công!
        </h2>
        <p className="text-muted-foreground animate-in fade-in-0 duration-700">
          Đang chuyển hướng đến trang xác nhận vé…
        </p>
        <Loader2 className="mt-4 h-5 w-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const amountToPay = registration?.distancePrice ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/events/${eventId}/register`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại Đăng ký
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Thanh toán đơn đăng ký
        </h1>
        <p className="mt-1 text-muted-foreground">
          Xác nhận thông tin và thanh toán qua cổng PayOS để hoàn tất đăng ký vé chạy.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Cancelled notice */}
      {isCancelled && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Giao dịch trước đó đã bị hủy
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Bạn có thể nhấn nút thanh toán bên dưới để thử lại bất cứ lúc nào.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Payment info / options */}
        <div className="lg:col-span-3 space-y-6">
          {/* PayOS gateway card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-bold text-foreground">Cổng thanh toán</h2>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600">
                PayOS Gateway
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Bạn sẽ được chuyển sang giao diện thanh toán bảo mật của <strong>PayOS</strong> để quét mã QR chuyển khoản ngân hàng (VietQR) nhanh chóng và tự động.
            </p>

            <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Hình thức hỗ trợ:</span>
                <span className="font-semibold text-foreground">VietQR • Napas • Mọi ngân hàng VN</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Thời gian xử lý:</span>
                <span className="font-semibold text-emerald-600">Tức thì (Real-time)</span>
              </div>
            </div>

            {/* Security badges */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span>Bảo mật chuẩn ngân hàng</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-emerald-500" />
                <span>Mã hóa SSL 256-bit</span>
              </div>
            </div>
          </div>

          {/* Dev / Mock helper note */}
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-700 dark:text-orange-400">
              <Sparkles className="h-4 w-4" />
              <span>Chế độ kiểm thử (PayOS Mode: {payOsMode.toUpperCase()})</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Trong môi trường thử nghiệm, bạn có thể bấm nút PayOS (sẽ mở trang mô phỏng PayOS) hoặc dùng nút giả lập thanh toán nhanh bên dưới để hoàn tất ngay.
            </p>
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isSimulating || paymentState !== "form"}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang giả lập thanh toán…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Giả lập thanh toán thành công (1 click)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4">
            <h3 className="font-bold text-foreground text-base">Thông tin đơn hàng</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giải chạy</span>
                <span className="font-medium text-foreground text-right max-w-[160px] truncate">
                  {registration?.eventName || event?.name}
                </span>
              </div>

              {registration?.distanceName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cự ly</span>
                  <span className="font-medium text-foreground">
                    {registration.distanceName}
                  </span>
                </div>
              )}

              {registration?.distanceKm ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khoảng cách</span>
                  <span className="font-medium text-foreground">
                    {registration.distanceKm} km
                  </span>
                </div>
              ) : null}

              {registration?.fullName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vận động viên</span>
                  <span className="font-medium text-foreground">
                    {registration.fullName}
                  </span>
                </div>
              )}

              {effectiveRegistrationId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã đăng ký</span>
                  <span className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                    {effectiveRegistrationId}
                  </span>
                </div>
              )}

              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Tổng thanh toán</span>
                <span className="text-2xl font-extrabold text-orange-600">
                  {formatPrice(amountToPay)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePayOSCheckout}
              disabled={paymentState !== "form" || isSimulating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="h-4 w-4" />
              Thanh toán với PayOS
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              Nhấn thanh toán đồng nghĩa với việc bạn đồng ý với Điều khoản & Quy chế giải chạy RaceDay.
            </p>
          </div>
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
