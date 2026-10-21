"use client";
import { getAccessToken, isLoggedIn } from "@/lib/auth-cookie";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ExternalLink, Flag } from "lucide-react";
import { getEvents } from "@/api/events";
import { getMyRegistrations } from "@/api/events";
import { RaceEventListItemDto, RegistrationDto } from "@/dto/event.dto";
import {
  formatDate,
  getStatusLabel,
  getStatusColor,
  getRegistrationStatusLabel,
} from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

export default function ResultsHubPage() {
  const [events, setEvents] = useState<RaceEventListItemDto[]>([]);
  const [myRegs, setMyRegs] = useState<RegistrationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getEvents();
        if (!cancelled) setEvents(Array.isArray(list) ? list : []);
        if (getAccessToken()) {
          try {
            const regs = await getMyRegistrations();
            if (!cancelled) setMyRegs(Array.isArray(regs) ? regs : []);
          } catch {
            if (!cancelled) setMyRegs([]);
          }
        }
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được danh sách giải."));
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <PageLoading
        title="Đang tải kết quả…"
        description="Lấy danh sách giải từ máy chủ."
        icon={Trophy}
      />
    );
  }

  const confirmed = myRegs.filter(
    (r) => r.status === "confirmed" || r.bibNumber
  );

  return (
    <div className={`${PAGE_SHELL} py-7 space-y-8`}>
      <div>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
          Kết quả
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Kết quả giải chạy</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Chọn giải để xem bảng xếp hạng, thành tích và pace theo từng cự ly,
          hoặc tra cứu thứ hạng của bạn.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loggedIn && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Đăng ký của tôi</h2>
          {confirmed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có vé confirmed.{" "}
              <Link href="/my-registrations" className="text-orange-600 font-semibold">
                Xem vé
              </Link>
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {confirmed.map((r) => (
                <li key={r.id} className="rounded-2xl border bg-card p-4 space-y-2">
                  <p className="font-bold text-sm">{r.eventName || "Giải chạy"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.distanceName || "—"}
                    {r.bibNumber ? ` · BIB ${r.bibNumber}` : ""} ·{" "}
                    {getRegistrationStatusLabel(r.status)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/results/${r.eventId}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                    >
                      Xem bảng xếp hạng <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Link
                      href={`/my-registrations/${r.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:underline"
                    >
                      Vé / QR
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Flag className="h-4 w-4 text-orange-500" />
          Chọn giải xem kết quả
        </h2>
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Chưa có giải để hiển thị kết quả.
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="rounded-2xl border bg-card p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold">{ev.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ev.location} · {formatDate(ev.date)}
                  </p>
                  <span
                    className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(ev.status)}`}
                  >
                    {getStatusLabel(ev.status)}
                  </span>
                </div>
                <Link
                  href={`/results/${ev.id}`}
                  className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white"
                >
                  Xem bảng xếp hạng
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
