"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Download,
  ArrowRight,
  Calendar,
  MapPin,
  Hash,
  Ticket,
} from "lucide-react";
import { getEventById, formatPrice, formatDate } from "@/data/mock-events";

interface ConfirmationData {
  user_id: number;
  bib: number;
  event_id: number;
  distance: number;
  fullName: string;
  email: string;
  eventTitle: string;
  distanceLabel: string;
  price: number;
  registeredAt: string;
}

export default function ConfirmationPage() {
  const params = useParams();
  const eventId = Number(params.id);
  const event = getEventById(eventId);
  const qrRef = useRef<HTMLDivElement>(null);

  const [confirmData, setConfirmData] = useState<ConfirmationData | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("confirmation_data");
    if (stored) {
      setConfirmData(JSON.parse(stored));
    } else {
      // Fallback mock data
      setConfirmData({
        user_id: 1,
        bib: 1234,
        event_id: eventId,
        distance: 5,
        fullName: "Runner",
        email: "runner@example.com",
        eventTitle: event?.title || "Running Event",
        distanceLabel: "5K Fun Run",
        price: 350000,
        registeredAt: new Date().toISOString(),
      });
    }

    // Hide confetti after 5s
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [eventId, event?.title]);

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
        link.download = `raceday-bib-${confirmData?.bib || "qr"}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // QR Code JSON payload
  const qrPayload = confirmData
    ? JSON.stringify({
        user_id: confirmData.user_id,
        bib: confirmData.bib,
        event_id: confirmData.event_id,
        distance: confirmData.distance,
      })
    : "";

  if (!confirmData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
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
          Registration Confirmed! 🎉
        </h1>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Your spot has been reserved. Show your QR code at the event check-in counter.
        </p>
      </div>

      {/* Confirmation card */}
      <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Ticket header */}
        <div
          className="px-6 py-5"
          style={{ background: event?.bannerGradient || "linear-gradient(135deg, #f97316, #ef4444)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                Registration Ticket
              </p>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {confirmData.eventTitle}
              </h2>
            </div>
            <span className="text-4xl opacity-30 select-none">
              {event?.bannerEmoji || "🏃"}
            </span>
          </div>
        </div>

        {/* Dashed divider to simulate a ticket tear */}
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
                BIB Number
              </p>
              <div className="flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-orange-500" />
                <span className="text-2xl font-extrabold text-foreground">
                  {confirmData.bib}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Category
              </p>
              <div className="flex items-center gap-1.5">
                <Ticket className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-bold text-foreground">
                  {confirmData.distanceLabel}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Date
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
                Location
              </p>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-bold text-foreground truncate">
                  {event?.city || "Vietnam"}
                </span>
              </div>
            </div>
          </div>

          {/* Runner info */}
          <div className="rounded-xl bg-muted/40 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Runner</span>
              <span className="font-semibold text-foreground">
                {confirmData.fullName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{confirmData.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-bold text-orange-600">
                {formatPrice(confirmData.price)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Registration ID</span>
              <span className="font-mono text-xs text-muted-foreground">
                RD-{confirmData.event_id}-{confirmData.bib}-{confirmData.user_id}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Check-in QR Code
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
            <p className="text-[11px] text-muted-foreground text-center max-w-xs">
              Scan this QR at the event check-in counter. Contains:{" "}
              <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono break-all">
                {qrPayload}
              </code>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4" />
              Download QR Code
            </button>
            <Link
              href="/events"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/35 transition-all"
            >
              Browse More Events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
