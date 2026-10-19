"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, Ticket } from "lucide-react";
import { getEventById, getMyRegistrations } from "@/api/events";
import { RaceEventDto, RegistrationDto } from "@/dto/event.dto";
import {
  formatDate,
  formatPrice,
  getStatusLabel,
  getStatusColor,
  getRegistrationStatusLabel,
} from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import Cookies from "js-cookie";

export default function EventResultsPage() {
  const params = useParams();
  const eventId = String(params.eventId);
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [myRegs, setMyRegs] = useState<RegistrationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const ev = await getEventById(eventId);
        if (!cancelled) setEvent(ev);
        if (Cookies.get("accessToken")) {
          try {
            const regs = await getMyRegistrations();
            if (!cancelled) {
              setMyRegs(
                (Array.isArray(regs) ? regs : []).filter((r) => r.eventId === eventId)
              );
            }
          } catch {
            if (!cancelled) setMyRegs([]);
          }
        }
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được giải."));
          setEvent(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (loading) {
    return (
      <PageLoading
        title="Đang tải giải…"
        description="Lấy chi tiết sự kiện từ API."
        icon={Trophy}
      />
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <h1 className="text-2xl font-bold">Không tìm thấy giải</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/results" className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
          Về kết quả
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL} py-7 space-y-6`}>
      <Link
        href="/results"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Về danh sách
      </Link>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-wider text-white/80 font-semibold">
            Kết quả / giải
          </p>
          <h1 className="text-2xl font-extrabold mt-1">{event.name}</h1>
          <p className="text-sm text-white/85 mt-1">
            {event.location} · {formatDate(event.date)}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(event.status)}`}
          >
            {getStatusLabel(event.status)}
          </span>

          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-2">
            <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="font-bold">Bảng xếp hạng chưa có trên API</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Module kết quả / finish time chưa được expose. Trang này chỉ hiển thị thông tin
              giải và đăng ký thật của bạn.
            </p>
          </div>

          {myRegs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Ticket className="h-4 w-4 text-orange-500" />
                Đăng ký của bạn tại giải này
              </h3>
              {myRegs.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border p-4 flex flex-wrap justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {r.distanceName || "—"}
                      {r.bibNumber ? ` · BIB ${r.bibNumber}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getRegistrationStatusLabel(r.status)} ·{" "}
                      {formatPrice(r.distancePrice ?? 0)}
                    </p>
                  </div>
                  <Link
                    href={`/my-registrations/${r.id}`}
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    Xem vé
                  </Link>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/events/${event.id}`}
            className="inline-flex rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Trang chi tiết giải
          </Link>
        </div>
      </div>
    </div>
  );
}
