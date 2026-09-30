"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Download, Camera, Ticket } from "lucide-react";
import {
  getRegistrationById,
  type RunnerRegistration,
} from "@/data/mock-registrations";
import { formatPrice, formatDate, getEventById } from "@/data/mock-events";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

export default function RegistrationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const qrRef = useRef<HTMLDivElement>(null);
  const [reg, setReg] = useState<RunnerRegistration | null | undefined>(undefined);

  useEffect(() => {
    setReg(getRegistrationById(id) ?? null);
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
        <p className="text-muted-foreground">Vé này không tồn tại hoặc không thuộc tài khoản của bạn.</p>
        <Link href="/my-registrations" className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
          Về danh sách vé
        </Link>
      </div>
    );
  }

  const event = getEventById(reg.event_id);
  const qrPayload = JSON.stringify({
    user_id: reg.user_id,
    bib: reg.bib,
    event_id: reg.event_id,
    distance: reg.distance,
  });

  const handleDownload = () => {
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
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 0, 0, 400, 400);
        const a = document.createElement("a");
        a.download = `raceday-bib-${reg.bib}.png`;
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
            background: event?.bannerGradient || "linear-gradient(135deg,#f97316,#ef4444)",
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
            <p className="text-white/80 text-xs uppercase tracking-wider font-medium">Vé đăng ký</p>
            <h1 className="text-xl font-bold text-white mt-0.5">{reg.eventTitle}</h1>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Số BIB</p>
              <p className="text-3xl font-extrabold">{reg.bib}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Hạng mục</p>
              <p className="font-bold">{reg.distanceLabel}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Ngày</p>
              <p className="font-medium">{event ? formatDate(event.date) : "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">Thanh toán</p>
              <p className="font-bold text-orange-600">{formatPrice(reg.price)}</p>
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
            {reg.shirt && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Áo</span>
                <span className="text-right text-xs">
                  {reg.shirt.type} · {reg.shirt.size} · {reg.shirt.color}
                </span>
              </div>
            )}
          </div>

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
              href={`/photos?bib=${reg.bib}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm font-bold text-white"
            >
              <Camera className="h-4 w-4" />
              Tìm ảnh
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
