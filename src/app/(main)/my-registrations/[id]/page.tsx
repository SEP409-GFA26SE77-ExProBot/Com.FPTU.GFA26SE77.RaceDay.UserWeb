"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Download,
  Camera,
  Ticket,
  Clock,
  XCircle,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { getRegistrationById, getEventById } from "@/api/events";
import { RegistrationDto, RaceEventDto } from "@/dto/event.dto";
import {
  formatPrice,
  formatDate,
  getRegistrationStatusLabel,
} from "@/lib/format";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

export default function RegistrationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const qrRef = useRef<HTMLDivElement>(null);
  const [reg, setReg] = useState<RegistrationDto | null | undefined>(undefined);
  const [event, setEvent] = useState<RaceEventDto | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const api = await getRegistrationById(id);
        if (cancelled) return;
        setReg(api);
        try {
          const ev = await getEventById(api.eventId);
          if (!cancelled) setEvent(ev);
        } catch {
          /* optional */
        }
      } catch {
        if (!cancelled) setReg(null);
      }
    };

    void load();
    timer = window.setInterval(() => {
      void load();
    }, 4000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [id]);

  if (reg === undefined) {
    return (
      <PageLoading
        title="Đang tải vé…"
        description="Chuẩn bị BIB và mã QR check-in."
        icon={Ticket}
      />
    );
  }

  if (!reg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <h1 className="text-2xl font-bold">Không tìm thấy vé</h1>
        <p className="text-muted-foreground">
          Vé này không tồn tại hoặc không thuộc tài khoản của bạn.
        </p>
        <Link
          href="/my-registrations"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Về danh sách vé
        </Link>
      </div>
    );
  }

  if (reg.status === "pending_payment") {
    return (
      <div className={`${PAGE_SHELL_FORM} max-w-lg py-10 space-y-5`}>
        <Link
          href="/my-registrations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Về danh sách vé
        </Link>
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/10">
            <CreditCard className="h-10 w-10 text-sky-600" />
          </div>
          <h1 className="text-2xl font-extrabold">Chờ thanh toán</h1>
          <p className="text-sm text-muted-foreground">
            Đơn đã tạo. Hoàn tất thanh toán để gửi hồ sơ cho BTC duyệt.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Giải</span>
            <span className="font-semibold text-right">
              {reg.eventName || event?.name || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Hạng mục</span>
            <span className="font-semibold">{reg.distanceName || "—"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Số tiền</span>
            <span className="font-extrabold text-orange-600">
              {formatPrice(reg.distancePrice ?? 0)}
            </span>
          </div>
        </div>
        <Link
          href={`/events/${reg.eventId}/payment?regId=${reg.id}`}
          className="flex w-full items-center justify-center rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Thanh toán ngay
        </Link>
      </div>
    );
  }

  if (reg.status === "pending_approval") {
    return (
      <div className={`${PAGE_SHELL_FORM} max-w-lg py-10 space-y-5`}>
        <Link
          href="/my-registrations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Về danh sách vé
        </Link>
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold">Đang chờ BTC duyệt</h1>
          <p className="text-sm text-muted-foreground">
            Đã thanh toán PayOS. BIB và QR sẽ xuất hiện sau khi Organizer duyệt.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Giải</span>
            <span className="font-semibold text-right">
              {reg.eventName || event?.name || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Hạng mục</span>
            <span className="font-semibold">{reg.distanceName || "—"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Đã thanh toán</span>
            <span className="font-extrabold text-orange-600">
              {formatPrice(reg.distancePrice ?? 0)}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href={`/events/${reg.eventId}/pending?regId=${reg.id}`}
            className="flex-1 inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Trang chờ duyệt
          </Link>
          <Link
            href={`/events/${reg.eventId}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold"
          >
            Chi tiết giải <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (reg.status === "rejected") {
    return (
      <div className={`${PAGE_SHELL_FORM} max-w-lg py-10 space-y-5`}>
        <Link
          href="/my-registrations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Về danh sách vé
        </Link>
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold">Đăng ký bị từ chối</h1>
          <p className="text-sm text-muted-foreground">
            BTC không duyệt đơn. Xem lý do bên dưới.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Giải</span>
            <span className="font-semibold text-right">
              {reg.eventName || event?.name || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Hạng mục</span>
            <span className="font-semibold">{reg.distanceName || "—"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Ngày đua</span>
            <span className="font-semibold">{event ? formatDate(event.date) : "—"}</span>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-100 p-3">
            <p className="text-xs font-bold text-red-800 mb-1">Lý do từ chối</p>
            <p className="text-sm text-red-900/90">
              {reg.rejectionReason || "Không có mô tả."}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href={`/events/${reg.eventId}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold"
          >
            Chi tiết giải <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/payments"
            className="flex-1 inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Lịch sử thanh toán
          </Link>
        </div>
      </div>
    );
  }

  const qrPayload =
    typeof reg.qrPayload === "string" && reg.qrPayload
      ? reg.qrPayload
      : JSON.stringify({
          registrationId: reg.id,
          eventId: reg.eventId,
          bib: reg.bibNumber,
          fullName: reg.fullName,
        });

  const handleDownload = () => {
    if (!qrRef.current || !reg.bibNumber) return;
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
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 0, 0, 400, 400);
        const a = document.createElement("a");
        a.download = `raceday-bib-${reg.bibNumber}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-3xl py-7 space-y-6`}>
      <Link
        href="/my-registrations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Về danh sách vé
      </Link>

      <div className="rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
        <div
          className="px-6 py-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#f97316,#ef4444)",
          }}
        >
          {event?.bannerImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.bannerImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
          )}
          <div className="relative">
            <p className="text-white/80 text-xs uppercase tracking-wider font-medium">
              Vé đăng ký · {getRegistrationStatusLabel(reg.status)}
            </p>
            <h1 className="text-xl font-bold text-white mt-0.5">
              {reg.eventName || event?.name || "RaceDay"}
            </h1>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Số BIB</p>
              <p className="text-3xl font-extrabold">{reg.bibNumber ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Hạng mục</p>
              <p className="font-bold">{reg.distanceName || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Ngày</p>
              <p className="font-medium">{event ? formatDate(event.date) : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Thanh toán</p>
              <p className="font-bold text-orange-600">
                {formatPrice(reg.distancePrice ?? 0)}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/40 p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">VĐV</span>
              <span className="font-semibold">{reg.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SĐT</span>
              <span>{reg.phone || "—"}</span>
            </div>
            {(reg.shirtType || reg.shirtSize) && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Áo</span>
                <span className="text-right text-xs">
                  {[reg.shirtType, reg.shirtSize, reg.shirtColor].filter(Boolean).join(" · ")}
                </span>
              </div>
            )}
          </div>

          {reg.bibNumber && (
            <>
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-semibold">Mã QR check-in</p>
                <div ref={qrRef} className="rounded-2xl border-2 bg-white p-4">
                  <QRCodeSVG value={qrPayload} size={200} level="H" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  <Download className="h-4 w-4" />
                  Tải mã QR
                </button>
                <Link
                  href={`/photos?bib=${reg.bibNumber}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm font-bold text-white"
                >
                  <Camera className="h-4 w-4" />
                  Tìm ảnh
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
