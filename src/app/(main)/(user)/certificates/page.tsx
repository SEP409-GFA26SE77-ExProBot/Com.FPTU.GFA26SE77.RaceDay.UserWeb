"use client";
import { getAuthUser } from "@/stores/auth-store";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, LogIn } from "lucide-react";
import { getMyRegistrations } from "@/api/events";
import { RegistrationDto } from "@/dto/event.dto";
import { getRegistrationStatusLabel, formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import RunnerPageHeader from "@/components/runner/RunnerPageHeader";
import { Button } from "@/components/ui/button";

export default function CertificatesPage() {
  const [regs, setRegs] = useState<RegistrationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const loggedIn = Boolean(getAuthUser());

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await getMyRegistrations();
        if (!cancelled) {
          setRegs(
            (Array.isArray(list) ? list : []).filter(
              (r) => r.status === "confirmed" || Boolean(r.bibNumber)
            )
          );
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được đăng ký."));
          setRegs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, loadAttempt]);

  if (loading) {
    return (
      <PageLoading
        title="Đang tải chứng nhận…"
        description="Đang tìm các đăng ký đã xác nhận của bạn."
        icon={Award}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <Link
          href="/login?from=/certificates"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL_FORM} py-7 sm:py-8 space-y-6`}>
      <RunnerPageHeader title="Chứng nhận của tôi" description="Xem bản chứng nhận tham gia từ thông tin đăng ký đã xác nhận. Đây chưa phải chứng nhận thành tích chính thức của BTC." />

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{error}</p>
          <Button type="button" variant="outline" className="mt-3 min-h-11 bg-card" onClick={() => { setLoading(true); setLoadAttempt((attempt) => attempt + 1); }}>Thử lại</Button>
        </div>
      )}

      {!error && (regs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground space-y-3">
          <Award className="mx-auto h-10 w-10 opacity-50" />
          <p>Chưa có đăng ký đã xác nhận để tạo chứng nhận.</p>
          <Link href="/my-registrations" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 py-2 text-orange-700 font-semibold hover:bg-muted">
            Xem vé của tôi
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {regs.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm sm:p-6"
            >
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="font-bold text-sm">{r.eventName || "Giải chạy"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.distanceName || "—"}
                  {r.bibNumber ? ` · BIB ${r.bibNumber}` : ""} ·{" "}
                  {getRegistrationStatusLabel(r.status)} ·{" "}
                  {r.distancePrice == null ? "Chưa có giá" : formatPrice(r.distancePrice)}
                </p>
              </div>
              <Link
                href={`/certificates/${r.id}`}
                className="inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Xem chứng nhận
              </Link>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
