"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, Printer } from "lucide-react";
import { getRegistrationById, getEventById } from "@/api/events";
import { RegistrationDto, RaceEventDto } from "@/dto/event.dto";
import { formatDate, formatPrice, getRegistrationStatusLabel } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

export default function CertificateDetailPage() {
  const params = useParams();
  const regId = String(params.regId);
  const [reg, setReg] = useState<RegistrationDto | null>(null);
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getRegistrationById(regId);
        if (cancelled) return;
        setReg(r);
        try {
          const ev = await getEventById(r.eventId);
          if (!cancelled) setEvent(ev);
        } catch {
          /* optional */
        }
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được đăng ký."));
          setReg(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [regId]);

  if (loading) {
    return (
      <PageLoading
        title="Đang tải chứng nhận…"
        description="Lấy dữ liệu đăng ký từ API."
        icon={Award}
      />
    );
  }

  if (error || !reg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <h1 className="text-2xl font-bold">Không tìm thấy</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link
          href="/certificates"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Về danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-2xl py-7 space-y-6`}>
      <Link
        href="/certificates"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Về chứng nhận
      </Link>

      <div className="rounded-2xl border-2 border-orange-500/30 bg-white shadow-lg overflow-hidden print:shadow-none">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 text-white text-center">
          <p className="text-xs uppercase tracking-widest font-semibold opacity-90">
            Chứng nhận RaceDay
          </p>
          <h1 className="text-xl font-extrabold mt-1">Chứng nhận tham gia</h1>
        </div>
        <div className="p-8 space-y-4 text-center">
          <p className="text-sm text-muted-foreground">Chứng nhận rằng</p>
          <p className="text-2xl font-extrabold text-foreground">{reg.fullName}</p>
          <p className="text-sm text-muted-foreground">đã đăng ký tham gia</p>
          <p className="text-lg font-bold">
            {reg.eventName || event?.name || "Giải chạy RaceDay"}
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm text-left max-w-sm mx-auto pt-2">
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">BIB</p>
              <p className="font-bold">{reg.bibNumber || "—"}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                Cự ly
              </p>
              <p className="font-bold">{reg.distanceName || "—"}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                Ngày giải
              </p>
              <p className="font-bold">{event ? formatDate(event.date) : "—"}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                Trạng thái
              </p>
              <p className="font-bold">{getRegistrationStatusLabel(reg.status)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Thanh toán: {formatPrice(reg.distancePrice ?? 0)} · Mã ĐK: {reg.id}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          <Printer className="h-4 w-4" />
          In / PDF
        </button>
        <Link
          href={`/my-registrations/${reg.id}`}
          className="inline-flex rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Xem vé & QR
        </Link>
      </div>
    </div>
  );
}
