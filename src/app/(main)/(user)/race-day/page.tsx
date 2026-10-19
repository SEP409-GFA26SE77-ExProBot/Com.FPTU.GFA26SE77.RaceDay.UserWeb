"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { Flag, LogIn, MapPin, Ticket } from "lucide-react";
import { getMyRegistrations, getEventById } from "@/api/events";
import { RegistrationDto, RaceEventDto } from "@/dto/event.dto";
import { formatDate, getRegistrationStatusLabel } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

type Row = RegistrationDto & { event?: RaceEventDto };

export default function RaceDayPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loggedIn = Boolean(Cookies.get("accessToken"));

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const regs = await getMyRegistrations();
        const confirmed = (Array.isArray(regs) ? regs : []).filter(
          (r) => r.status === "confirmed" || r.status === "pending_approval"
        );
        const withEvents: Row[] = await Promise.all(
          confirmed.map(async (r) => {
            try {
              const event = await getEventById(r.eventId);
              return { ...r, event };
            } catch {
              return { ...r };
            }
          })
        );
        if (!cancelled) {
          setRows(withEvents);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được đăng ký."));
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  if (loading) {
    return (
      <PageLoading
        title="Đang tải Race Day…"
        description="Lấy đăng ký thật từ API."
        icon={Flag}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <Link
          href="/login?from=/race-day"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL} py-7 space-y-6 max-w-3xl`}>
      <div>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
          Race Day
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Ngày đua của bạn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thông tin giải từ đăng ký API. Bản đồ live / SOS giả lập đã gỡ — chờ module race-day
          trên backend.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-3 text-sm text-muted-foreground">
          <Flag className="mx-auto h-10 w-10 opacity-50" />
          <p>Chưa có đăng ký phù hợp để hiển thị race day.</p>
          <Link href="/my-registrations" className="text-orange-600 font-semibold">
            Vé của tôi
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border bg-card p-5 space-y-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="font-bold text-lg">
                    {r.eventName || r.event?.name || "Giải chạy"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {r.distanceName || "—"}
                    {r.bibNumber ? ` · BIB ${r.bibNumber}` : ""} ·{" "}
                    {getRegistrationStatusLabel(r.status)}
                  </p>
                </div>
                <Link
                  href={`/my-registrations/${r.id}`}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  <Ticket className="h-3.5 w-3.5" />
                  Vé / QR
                </Link>
              </div>
              {r.event && (
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-orange-500" />
                    {r.event.location}
                  </span>
                  <span>{formatDate(r.event.date)}</span>
                  {r.event.startTime && <span>Giờ xuất phát: {r.event.startTime}</span>}
                </div>
              )}
              <Link
                href={`/events/${r.eventId}`}
                className="inline-flex text-xs font-semibold text-orange-600 hover:underline"
              >
                Chi tiết giải →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
