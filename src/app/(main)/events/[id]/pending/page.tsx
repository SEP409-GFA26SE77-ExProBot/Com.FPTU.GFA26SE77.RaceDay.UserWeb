"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Ticket,
  Eye,
} from "lucide-react";
import { getEventById, getRegistrationById } from "@/api/events";
import { syncPayment } from "@/api/payments";
import { RaceEventDto, RegistrationDto } from "@/dto/event.dto";
import { formatPrice, formatDate, formatDateTime } from "@/lib/format";
import {
  readConfirmationSession,
  resolveDistanceDisplay,
} from "@/lib/registration-display";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

type PaidMeta = {
  amount: number | null;
  paidAt?: string | null;
  orderCode?: number | null;
};

function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "pending" | "danger";
  children: ReactNode;
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : tone === "pending"
        ? "bg-amber-100 text-amber-900 border-amber-200"
        : "bg-red-100 text-red-800 border-red-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}
    >
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 text-sm font-semibold text-foreground sm:text-right">
        {value}
      </div>
    </div>
  );
}

function PendingInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = String(params.id ?? "");
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [regId, setRegId] = useState(searchParams.get("regId") || "");
  const [reg, setReg] = useState<RegistrationDto | null | undefined>(undefined);
  const [paidMeta, setPaidMeta] = useState<PaidMeta>({ amount: null });
  const paymentId = searchParams.get("paymentId");
  /** Nộp lại sau reject — không phải vừa thanh toán xong. */
  const fromResubmit = searchParams.get("resubmitted") === "1";
  const justPaid = Boolean(paymentId) && !fromResubmit;

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
            const payment = await syncPayment(paymentId);
            if (!cancelled) {
              setPaidMeta({
                amount:
                  typeof payment.amount === "number" ? payment.amount : null,
                paidAt: payment.paidAt || payment.updatedAt || null,
                orderCode: payment.orderCode ?? null,
              });
            }
          } catch {
            /* non-blocking */
          }
        }
        const api = await getRegistrationById(regId);
        if (cancelled) return;
        setReg(api);
        if (api.status === "confirmed" && api.bibNumber) {
          router.replace(`/events/${eventId}/confirmation?regId=${api.id}`);
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
      <div className={`${PAGE_SHELL_FORM} max-w-2xl py-10 space-y-5`}>
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold">Hồ sơ cần chỉnh sửa</h1>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {reg.rejectionReason || "BTC chưa duyệt hồ sơ đăng ký."}
          </p>
          <p className="text-xs text-muted-foreground">
            Đã thanh toán — sửa thông tin rồi nộp lại, không cần trả tiền lại.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/my-registrations/${reg.id}/resubmit`}
            className="flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            Chỉnh sửa & nộp lại
          </Link>
          <Link
            href={`/my-registrations/${reg.id}`}
            className="flex flex-1 items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    );
  }

  if (reg.status === "pending_payment") {
    return (
      <div className={`${PAGE_SHELL_FORM} max-w-2xl py-10 space-y-5 text-center`}>
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

  const distance = resolveDistanceDisplay(reg, event, {
    session: readConfirmationSession(),
    paidAmount: paidMeta.amount,
  });
  const distanceLabel =
    distance.name || (distance.km != null ? `${distance.km} km` : "—");
  const eventName = reg.eventName || event?.name || "—";
  const orderCodeDisplay =
    paidMeta.orderCode != null
      ? `#${paidMeta.orderCode}`
      : `#${reg.id.slice(0, 8).toUpperCase()}`;
  const createdAt = reg.createdAtUtc || reg.createdAt;
  const paidAt =
    paidMeta.paidAt || reg.updatedAtUtc || reg.updatedAt || createdAt;

  const heroTitle = fromResubmit
    ? "Đã nộp lại hồ sơ"
    : justPaid
      ? "Thanh toán thành công"
      : "Hồ sơ đang chờ duyệt";
  const heroDesc = fromResubmit
    ? "Hồ sơ đã gửi lại cho Ban tổ chức. Trang tự cập nhật khi được duyệt và có BIB/QR."
    : justPaid
      ? "Đơn đã ghi nhận. Ban tổ chức đang duyệt hồ sơ — trang tự cập nhật khi có BIB/QR."
      : "Ban tổ chức đang duyệt hồ sơ — trang tự cập nhật khi có BIB/QR.";

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-3xl py-8 sm:py-10 space-y-6`}>
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
          <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {heroTitle}
        </h1>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">
          {heroDesc}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {/* Liên hệ VĐV */}
        <div className="border-b border-border/60 px-5 py-5 sm:px-6">
          <p className="text-lg font-extrabold text-foreground">{reg.fullName}</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {reg.email}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{reg.phone}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/my-registrations/${reg.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-700"
            >
              <Eye className="h-3.5 w-3.5" />
              Xem lại thông tin
            </Link>
            <Link
              href={`/events/${eventId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-bold hover:bg-muted"
            >
              Chi tiết giải
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Chi tiết đơn */}
        <div className="px-5 py-2 sm:px-6">
          <InfoRow label="Mã đơn hàng" value={orderCodeDisplay} />
          <InfoRow label="Ngày tạo" value={formatDateTime(createdAt)} />
          <InfoRow label="Ngày thanh toán" value={formatDateTime(paidAt)} />
          <InfoRow label="Phương thức thanh toán" value="PayOS · Chuyển khoản QR" />
          <InfoRow
            label="Trạng thái thanh toán"
            value={<StatusPill tone="success">Đã thanh toán</StatusPill>}
          />
          <InfoRow
            label="Trạng thái đơn hàng"
            value={<StatusPill tone="pending">Chờ duyệt</StatusPill>}
          />
        </div>

        {/* Tóm tắt đơn hàng */}
        <div className="border-t border-border/60 px-5 py-5 sm:px-6">
          <h2 className="text-sm font-extrabold text-foreground">
            Tóm tắt đơn hàng
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 font-bold">#</th>
                  <th className="px-3 py-2.5 font-bold">Sự kiện</th>
                  <th className="px-3 py-2.5 text-right font-bold">Đơn giá</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/60">
                  <td className="px-3 py-3 tabular-nums text-muted-foreground">
                    1
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-foreground">{eventName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {distanceLabel}
                      {event?.date ? ` · ${formatDate(event.date)}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right font-extrabold text-orange-600">
                    {formatPrice(distance.price)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {justPaid ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              PayOS đã xác nhận thanh toán thành công
            </div>
          ) : fromResubmit ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900">
              <Clock className="h-4 w-4 shrink-0" />
              Đã thanh toán trước đó — hồ sơ đang chờ BTC duyệt lại
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href={`/my-registrations/${reg.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold"
        >
          <Ticket className="h-3.5 w-3.5" />
          Vé của tôi
        </Link>
        <Link
          href="/registered-events"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Giải đã đăng ký
        </Link>
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense
      fallback={
        <PageLoading
          title="Đang tải…"
          description="Chuẩn bị trang chờ duyệt."
          icon={Clock}
        />
      }
    >
      <PendingInner />
    </Suspense>
  );
}
