"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStaffCheckInCode, type StaffCheckInCode } from "@/api/staff-check-in";
import { getApiErrorMessage } from "@/lib/error";

const LIFETIME_SECONDS = 60;

/** Mã QR check-in cho Staff/Photographer: hiệu lực 60 giây, đếm ngược rồi tự làm mới. */
export default function StaffCheckInQrDialog({
  eventId,
  open,
  onOpenChange,
}: {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR check-in nhân sự</DialogTitle>
          <DialogDescription>
            Staff và Photographer bật Check-in trên app RaceDay Staff rồi quét mã này. Mã tự đổi
            sau mỗi {LIFETIME_SECONDS} giây.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while the dialog is open, so timers stop when it closes. */}
        {open ? <RotatingCode eventId={eventId} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function RotatingCode({ eventId }: { eventId: string }) {
  const [code, setCode] = useState<StaffCheckInCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  /** serverNow − clientNow, so the countdown follows the server clock. */
  const [clockOffset, setClockOffset] = useState(0);

  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const sentAt = Date.now();
    getStaffCheckInCode(eventId).then(
      (next) => {
        if (!active) return;
        const receivedAt = Date.now();
        setClockOffset(Date.parse(next.serverNowUtc) - (sentAt + receivedAt) / 2);
        setNow(receivedAt);
        setCode(next);
        setError(null);
        setLoading(false);
      },
      (err: unknown) => {
        if (!active) return;
        setCode(null);
        setError(getApiErrorMessage(err, "Không tạo được mã QR check-in."));
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [eventId, refreshKey]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // Fetch the next code as soon as the current one expires.
  useEffect(() => {
    if (!code) return;
    const wait = Date.parse(code.expiresAtUtc) - (Date.now() + clockOffset);
    const id = setTimeout(refresh, Math.max(0, wait) + 150);
    return () => clearTimeout(id);
  }, [code, clockOffset, refresh]);

  // Keep retrying while an error is shown (e.g. network blip, or check-in not open yet).
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(refresh, 5000);
    return () => clearTimeout(id);
  }, [error, refresh]);

  const remaining = code
    ? Math.max(0, Math.ceil((Date.parse(code.expiresAtUtc) - (now + clockOffset)) / 1000))
    : 0;
  const expired = code !== null && remaining === 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-border bg-white p-3">
        {code ? (
          <QRCodeSVG
            value={code.payload}
            size={252}
            level="M"
            marginSize={0}
            className={expired ? "opacity-20" : undefined}
            aria-label="Mã QR check-in nhân sự"
          />
        ) : null}
        {loading && (!code || expired) ? (
          <Loader2 className="absolute h-8 w-8 animate-spin text-orange-500" aria-label="Đang tạo mã" />
        ) : null}
      </div>

      {code ? (
        <div className="w-full space-y-1.5" aria-live="polite">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-muted-foreground">
              {expired ? "Đang đổi mã mới…" : "Mã hết hạn sau"}
            </span>
            <span
              className={`tabular-nums ${remaining <= 10 ? "text-red-600" : "text-orange-600"}`}
            >
              {remaining}s
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                remaining <= 10 ? "bg-red-500" : "bg-orange-500"
              }`}
              style={{ width: `${(remaining / LIFETIME_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        disabled={loading}
        onClick={refresh}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold transition-colors duration-150 hover:bg-muted-foreground/10 active:scale-95 disabled:opacity-50"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Làm mới ngay
      </button>
    </div>
  );
}
