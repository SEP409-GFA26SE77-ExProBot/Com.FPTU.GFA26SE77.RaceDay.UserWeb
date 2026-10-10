"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Clock, CheckCircle2, XCircle, ExternalLink, Ticket } from "lucide-react";
import { getEventById, getRegistrationById } from "@/api/events";
import { syncPayment } from "@/api/payments";
import { RaceEventDto, RegistrationDto } from "@/dto/event.dto";
import { formatPrice, formatDate } from "@/lib/format";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

function PendingInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = String(params.id ?? "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [regId, setRegId] = useState(searchParams.get("regId") || "");
  const [reg, setReg] = useState<RegistrationDto | null | undefined>(undefined);
  const paymentId = searchParams.get("paymentId");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await getEventById(eventId);
        if (!cancelled) setEvent(found);
      } catch {
        if (!cancelled) setEvent(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    const fromQuery = searchParams.get("regId");
    const fromSession =
      typeof window !== "undefined"
        ? (() => {
            try {
              const raw = sessionStorage.getItem("confirmation_data");
              return raw ? JSON.parse(raw).registrationId : "";
            } catch {
              return sessionStorage.getItem("last_registration_id") || "";
            }
          })()
        : "";
    setRegId(fromQuery || fromSession || "");
  }, [searchParams]);

  useEffect(() => {
    if (!regId) {
      setReg(null);
      return;
    }
    let cancelled = false;
    let didSync = false;

    const load = async () => {
      try {
        if (paymentId && !didSync) {
          didSync = true;
          try {
            await syncPayment(paymentId);
          } catch {
            /* non-blocking */
          }
        }
        const api = await getRegistrationById(regId);
        if (cancelled) return;
        setReg(api);
        if (api.status === "confirmed" && api.bibNumber) {
          router.replace(
            `/events/${eventId}/confirmation?regId=${api.id}`
          );
        }
      } catch {
        if (!cancelled) setReg(null);
      }
    };

    void load();
    const id = window.setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [regId, eventId, router, paymentId]);

  if (reg === undefined) {
    return (
      <PageLoading
        title="Đang kiểm tra trạng thái…"
        description="Đồng bộ thanh toán và chờ BTC duyệt hồ sơ."
        icon={Clock}
      />
    );
  }

  if (!reg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <h1 className="text-2xl font-bold">Không tìm thấy đơn đăng ký</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          Thiếu mã đăng ký hoặc đơn không thuộc tài khoản của bạn.
        </p>
        <Link
          href="/my-registrations"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Về vé của tôi
        </Link>
      </div>
    );
  }

  if (reg.status === "rejected") {
    return (
      <div className={`${PAGE_SHELL_FORM} max-w-lg py-10 space-y-5`}>
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold">Đơn bị từ chối</h1>
          <p className="text-sm text-muted-foreground">
            {reg.rejectionReason || "BTC không duyệt hồ sơ đăng ký."}
          </p>
        </div>
        <Link
          href={`/my-registrations/${reg.id}`}
          className="flex w-full items-center justify-center rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Xem chi tiết
        </Link>
      </div>
    );
  }

  if (reg.status === "pending_payment") {
    return (
      <div className={`${PAGE_SHELL_FORM} max-w-lg py-10 space-y-5 text-center`}>
        <Clock className="mx-auto h-10 w-10 text-sky-600" />
        <h1 className="text-2xl font-extrabold">Chưa hoàn tất thanh toán</h1>
        <p className="text-sm text-muted-foreground">
          Vui lòng thanh toán để gửi hồ sơ cho Ban tổ chức.
        </p>
        <Link
          href={`/events/${eventId}/payment?regId=${reg.id}`}
          className="inline-flex rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Thanh toán ngay
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-lg py-10 space-y-6`}>
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="h-10 w-10 text-amber-600 animate-pulse" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Đang chờ BTC duyệt</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Thanh toán đã ghi nhận. Ban tổ chức đang kiểm tra hồ sơ. Trang này tự cập nhật —
          khi được duyệt bạn sẽ chuyển sang vé BIB/QR.
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
        {event && (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Ngày đua</span>
            <span className="font-semibold">{formatDate(event.date)}</span>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">VĐV</span>
          <span className="font-semibold">{reg.fullName}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Đã thanh toán</span>
          <span className="font-extrabold text-orange-600">
            {formatPrice(reg.distancePrice ?? 0)}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-emerald-800 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          PayOS đã xác nhận thanh toán thành công
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href={`/my-registrations/${reg.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold"
        >
          <Ticket className="h-3.5 w-3.5" />
          Vé của tôi
        </Link>
        <Link
          href={`/events/${eventId}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Chi tiết giải <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense
      fallback={
        <PageLoading title="Đang tải…" description="Chuẩn bị trang chờ duyệt." icon={Clock} />
      }
    >
      <PendingInner />
    </Suspense>
  );
}
