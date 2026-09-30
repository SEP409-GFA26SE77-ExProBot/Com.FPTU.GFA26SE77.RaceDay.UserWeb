"use client";

import { PAGE_SHELL_FORM } from "@/lib/page-shell";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Lock,
  Loader2,
  CheckCircle2,
  Wallet,
  XCircle,
  Ban,
} from "lucide-react";
import { getEventById, formatPrice } from "@/data/mock-events";
import { addRegistration } from "@/data/mock-registrations";
import Cookies from "js-cookie";

type PaymentState = "form" | "processing" | "success" | "failed" | "cancelled";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const event = getEventById(eventId);

  const [paymentState, setPaymentState] = useState<PaymentState>("form");
  const [missingReg, setMissingReg] = useState(false);
  const [regData, setRegData] = useState<{
    fullName: string;
    phone?: string;
    email?: string;
    eventTitle: string;
    distance: { id: number; label: string; km: number; price: number };
    shirt?: { type: string; size: string; color: string } | null;
  } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("registration_data");
    if (stored) {
      setRegData(JSON.parse(stored));
      setMissingReg(false);
    } else {
      setMissingReg(true);
    }
  }, []);

  const finishSuccess = () => {
    if (!regData?.distance) return;
    const userId = Number(Cookies.get("user_id") || Math.floor(Math.random() * 10000) + 1);
    const bib = Math.floor(Math.random() * 9000) + 1000;
    const confirmationData = {
      user_id: userId,
      bib,
      event_id: eventId,
      distance: regData.distance.km,
      fullName: regData.fullName || "VĐV",
      email: regData.email || "",
      phone: regData.phone || "",
      eventTitle: regData.eventTitle || event?.title || "",
      distanceLabel: regData.distance.label || "",
      price: regData.distance.price || 0,
      shirt: regData.shirt ?? null,
      registeredAt: new Date().toISOString(),
      paymentMethod: "PayOS",
    };
    sessionStorage.setItem("confirmation_data", JSON.stringify(confirmationData));

    const saved = addRegistration({
      user_id: userId,
      bib,
      event_id: eventId,
      eventTitle: confirmationData.eventTitle,
      distance: confirmationData.distance,
      distanceLabel: confirmationData.distanceLabel,
      fullName: confirmationData.fullName,
      email: confirmationData.email,
      phone: confirmationData.phone,
      price: confirmationData.price,
      shirt: confirmationData.shirt,
      registeredAt: confirmationData.registeredAt,
      paymentMethod: "PayOS",
      status: "confirmed",
    });
    sessionStorage.setItem("last_registration_id", saved.id);

    setPaymentState("success");
    setTimeout(() => {
      router.push(`/events/${eventId}/confirmation`);
    }, 1500);
  };

  const handlePay = (outcome: "success" | "failed" | "cancelled" = "success") => {
    if (!regData?.distance) return;
    setPaymentState("processing");
    setTimeout(() => {
      if (outcome === "success") finishSuccess();
      else setPaymentState(outcome);
    }, 2200);
  };

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy giải</h1>
        <Link href="/events" className="text-orange-600 font-semibold">
          Về danh sách giải
        </Link>
      </div>
    );
  }

  if (missingReg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <h1 className="text-2xl font-bold">Thiếu thông tin đăng ký</h1>
        <p className="text-muted-foreground max-w-md">
          Bạn cần hoàn tất form đăng ký và khai báo y tế trước khi thanh toán.
        </p>
        <Link
          href={`/events/${eventId}/register`}
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Điền form đăng ký
        </Link>
      </div>
    );
  }

  if (paymentState === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="relative mb-8">
          <div className="h-24 w-24 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Wallet className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Đang xử lý thanh toán PayOS…</h2>
        <p className="text-muted-foreground max-w-sm">Sandbox demo — vui lòng không đóng trang.</p>
      </div>
    );
  }

  if (paymentState === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Thanh toán thành công!</h2>
        <p className="text-muted-foreground">Đang chuyển tới vé BIB / QR…</p>
        <Loader2 className="mt-4 h-5 w-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (paymentState === "failed" || paymentState === "cancelled") {
    const isFail = paymentState === "failed";
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 gap-4">
        <div className="h-24 w-24 rounded-full bg-red-500/10 flex items-center justify-center">
          {isFail ? (
            <XCircle className="h-14 w-14 text-red-500" />
          ) : (
            <Ban className="h-14 w-14 text-amber-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold">
          {isFail ? "Thanh toán thất bại" : "Bạn đã hủy thanh toán"}
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {isFail
            ? "Giao dịch PayOS sandbox không thành công (timeout / từ chối). Bạn có thể thử lại."
            : "Giao dịch đã bị hủy trên cổng PayOS. Slot chưa được giữ."}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => setPaymentState("form")}
            className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Thử lại
          </button>
          <Link
            href={`/events/${eventId}/register`}
            className="rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Sửa form đăng ký
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-3xl py-7`}>
      <div className="mb-6">
        <Link
          href={`/events/${event.id}/register`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại form đăng ký
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Thanh toán đăng ký</h1>
        <p className="mt-1 text-muted-foreground">
          Thanh toán qua cổng PayOS (sandbox). Sau khi thành công, hệ thống cấp BIB và mã QR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-bold">Phương thức thanh toán</h2>
            </div>
            <button type="button" className="w-full rounded-xl border-2 border-orange-500 bg-orange-500/5 p-4 text-left">
              <p className="font-bold">PayOS</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cổng thanh toán nội địa (sandbox — không trừ tiền thật)
              </p>
            </button>
            <div className="flex items-center gap-4 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span>Bảo mật</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-emerald-500" />
                <span>Sandbox PayOS</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-2">
            <p className="text-xs text-amber-800 font-medium">
              <strong>Demo:</strong> chọn kết quả giao dịch để test happy path và edge case.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePay("success")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                Thành công
              </button>
              <button
                type="button"
                onClick={() => handlePay("failed")}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                Thất bại
              </button>
              <button
                type="button"
                onClick={() => handlePay("cancelled")}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4">
            <h3 className="font-bold text-base">Đơn hàng</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Giải</span>
                <span className="font-medium text-right max-w-[160px] truncate">
                  {regData?.eventTitle || event.title}
                </span>
              </div>
              {regData?.distance && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hạng mục</span>
                  <span className="font-medium">{regData.distance.label}</span>
                </div>
              )}
              {regData?.fullName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VĐV</span>
                  <span className="font-medium">{regData.fullName}</span>
                </div>
              )}
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="font-bold">Tổng</span>
                <span className="text-2xl font-extrabold text-orange-600">
                  {formatPrice(regData?.distance?.price || 0)}
                </span>
              </div>
            </div>

            <button
              onClick={() => handlePay("success")}
              disabled={!regData?.distance}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              Thanh toán PayOS
            </button>
            <p className="text-[10px] text-muted-foreground text-center">
              Bằng việc thanh toán, bạn đồng ý{" "}
              <Link href="/terms" className="text-orange-600 underline">
                Điều khoản
              </Link>{" "}
              và{" "}
              <Link href="/privacy" className="text-orange-600 underline">
                Bảo mật
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
