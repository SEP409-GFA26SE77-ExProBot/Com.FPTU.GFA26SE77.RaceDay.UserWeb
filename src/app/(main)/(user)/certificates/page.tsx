"use client";
import { getAuthUser } from "@/stores/auth-store";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, LogIn } from "lucide-react";
import { getMyRegistrations } from "@/api/events";
import { RegistrationDto } from "@/dto/event.dto";
import { getRegistrationStatusLabel, formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

export default function CertificatesPage() {
  const [regs, setRegs] = useState<RegistrationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  }, [loggedIn]);

  if (loading) {
    return (
      <PageLoading
        title="Đang tải chứng nhận…"
        description="Lấy đăng ký confirmed từ API."
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
    <div className={`${PAGE_SHELL} py-7 space-y-6 max-w-3xl`}>
      <div>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
          Chứng nhận
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Chứng nhận của tôi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hiển thị đăng ký đã xác nhận từ API. Template chứng nhận chính thức chưa có endpoint
          riêng — dùng dữ liệu vé thật.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {regs.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground space-y-3">
          <Award className="mx-auto h-10 w-10 opacity-50" />
          <p>Chưa có đăng ký đã xác nhận để tạo chứng nhận.</p>
          <Link href="/my-registrations" className="text-orange-600 font-semibold">
            Xem vé của tôi
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {regs.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border bg-card p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-sm">{r.eventName || "Giải chạy"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.distanceName || "—"}
                  {r.bibNumber ? ` · BIB ${r.bibNumber}` : ""} ·{" "}
                  {getRegistrationStatusLabel(r.status)} ·{" "}
                  {formatPrice(r.distancePrice ?? 0)}
                </p>
              </div>
              <Link
                href={`/certificates/${r.id}`}
                className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Xem chứng nhận
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
