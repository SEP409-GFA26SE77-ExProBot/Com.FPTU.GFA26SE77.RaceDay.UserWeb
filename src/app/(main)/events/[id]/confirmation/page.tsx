"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  Calendar,
  MapPin,
  Hash,
  Ticket,
  AlertCircle,
  Loader2,
  FileCheck,
} from "lucide-react";
import { getEventById, getRegistrationById } from "@/api/events";
import { syncPayment } from "@/api/payments";
import { RaceEventDto, RegistrationDto } from "@/dto/event.dto";
import { formatPrice, formatDate } from "@/lib/format";

function ConfirmationContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const eventId = String(params.id);
  const regId = searchParams.get("regId") || searchParams.get("id");
  const paymentId = searchParams.get("paymentId");
  const qrRef = useRef<HTMLDivElement>(null);

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [registration, setRegistration] = useState<RegistrationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadConfirmation() {
      setLoading(true);

      // If redirected from PayOS with paymentId, call sync
      if (paymentId) {
        try {
          await syncPayment(paymentId);
        } catch {
          // Non-blocking
        }
      }

      // Load event info
      try {
        const ev = await getEventById(eventId);
        if (isMounted) setEvent(ev);
      } catch {
        // Handled gracefully
      }

      // Load registration info
      const targetRegId =
        regId ||
        (() => {
          try {
            const stored = sessionStorage.getItem("confirmation_data");
            return stored ? JSON.parse(stored).registrationId : null;
          } catch {
            return null;
          }
        })();

      if (targetRegId) {
        try {
          const reg = await getRegistrationById(targetRegId);
          if (isMounted) setRegistration(reg);
        } catch {
          // Fallback to sessionStorage
          try {
            const stored = sessionStorage.getItem("confirmation_data");
            if (stored && isMounted) {
              const parsed = JSON.parse(stored);
              setRegistration({
                id: parsed.registrationId || targetRegId,
                userId: "",
                eventId: parsed.eventId || eventId,
                distanceId: "",
                status: "pending_approval",
                fullName: parsed.fullName || "Runner",
                email: parsed.email || "",
                phone: "",
                eventName: parsed.eventTitle,
                distanceName: parsed.distanceLabel,
                distanceKm: parsed.distanceKm,
                distancePrice: parsed.price,
                createdAt: parsed.registeredAt || new Date().toISOString(),
              });
            }
          } catch {
            // Ignored
          }
        }
      }

      if (isMounted) setLoading(false);
    }

    loadConfirmation();

    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [eventId, regId, paymentId]);

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 0, 0, 400, 400);
        const link = document.createElement("a");
        link.download = `raceday-bib-${registration?.bibNumber || registration?.id || "qr"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // QR Payload: use official BE qrPayload, or build verifiable QR payload
  const qrPayload =
    registration?.qrPayload ||
    JSON.stringify({
      registrationId: registration?.id,
      eventId: eventId,
      fullName: registration?.fullName,
      bib: registration?.bibNumber || "PENDING",
      status: registration?.status || "paid",
    });

  const isConfirmed = registration?.status === "confirmed";
  const isPendingApproval = registration?.status === "pending_approval" || !isConfirmed;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Đang xác thực thông tin đăng ký…</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
      {/* Confetti animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                backgroundColor: [
                  "#f97316",
                  "#ef4444",
                  "#eab308",
                  "#22c55e",
                  "#3b82f6",
                  "#a855f7",
                  "#ec4899",
                ][Math.floor(Math.random() * 7)],
              }}
            />
          ))}
        </div>
      )}

      {/* Success header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500/10 mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Đăng ký & Thanh toán thành công! 🎉
        </h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          {isPendingApproval
            ? "Đơn đăng ký của bạn đã được ghi nhận và chuyển tới Ban tổ chức để kiểm tra hồ sơ."
            : "Vé tham gia của bạn đã được xác nhận. Hãy lưu mã QR để làm thủ tục check-in nhận race kit."}
        </p>
      </div>

      {/* Status Alert Banner */}
      {isPendingApproval && (
        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-300">
              Trạng thái: Chờ Ban tổ chức duyệt hồ sơ (Pending Approval)
            </p>
            <p className="text-muted-foreground mt-0.5">
              Sau khi Ban tổ chức xác nhận hồ sơ y tế và thông tin vận động viên, số BIB chính thức và thông báo xác nhận sẽ được gửi tới email của bạn.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Ticket Card */}
      <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Ticket header */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                Vé Tham Gia Giải Chạy
              </p>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {registration?.eventName || event?.name || "RaceDay Event"}
              </h2>
            </div>
            <FileCheck className="h-9 w-9 text-white/30" />
          </div>
        </div>

        {/* Dashed divider simulating ticket tear */}
        <div className="relative">
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
          <div className="border-t-2 border-dashed border-border mx-6" />
        </div>

        <div className="p-6 space-y-6">
          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Số BIB
              </p>
              <div className="flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-orange-500" />
                <span className="text-xl font-extrabold text-foreground">
                  {registration?.bibNumber || "Chờ cấp"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Cự ly thi đấu
              </p>
              <div className="flex items-center gap-1.5">
                <Ticket className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-bold text-foreground">
                  {registration?.distanceName || `${registration?.distanceKm || ""} km`}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Ngày thi đấu
              </p>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-bold text-foreground">
                  {event ? formatDate(event.date) : "TBD"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Địa điểm
              </p>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-bold text-foreground truncate">
                  {event?.location || "Việt Nam"}
                </span>
              </div>
            </div>
          </div>

          {/* Runner info */}
          <div className="rounded-xl bg-muted/40 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vận động viên</span>
              <span className="font-semibold text-foreground">
                {registration?.fullName || "Runner"}
              </span>
            </div>

            {registration?.email && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{registration.email}</span>
              </div>
            )}

            {registration?.distancePrice !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số tiền đã thanh toán</span>
                <span className="font-bold text-orange-600">
                  {formatPrice(registration.distancePrice)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mã đơn đăng ký</span>
              <span className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                {registration?.id || regId}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Mã QR xác nhận Check-in
            </p>
            <div
              ref={qrRef}
              className="rounded-2xl border-2 border-border bg-white p-5 shadow-inner"
            >
              <QRCodeSVG
                value={qrPayload}
                size={200}
                level="H"
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                includeMargin={false}
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-center max-w-sm">
              Xuất trình mã QR này tại quầy nhận Race Kit vào ngày sự kiện.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4" />
              Tải mã QR
            </button>
            <Link
              href="/events"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 transition-all"
            >
              Khám phá thêm giải chạy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Đang xác thực thông tin đăng ký…</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
