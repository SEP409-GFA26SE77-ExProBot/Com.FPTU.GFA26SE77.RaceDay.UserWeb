"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { syncPayment } from "@/api/payments";
import { getPackagePurchase } from "@/api/event-packages";
import { getApiErrorMessage } from "@/lib/error";

type Status = "syncing" | "success" | "error";

const MAX_POLLS = 12;
const POLL_INTERVAL = 3000;

export default function PackageReturnClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const purchaseId = searchParams.get("purchaseId") || "";
  const paymentIdParam = searchParams.get("paymentId") || "";

  const [status, setStatus] = useState<Status>("syncing");
  const [error, setError] = useState<string | null>(null);
  const pollCount = useRef(0);
  const doneRef = useRef(false);

  const resolve = useCallback(async () => {
    if (doneRef.current || !purchaseId) return;

    // Sync payment if we have paymentId
    if (paymentIdParam) {
      try {
        await syncPayment(paymentIdParam);
      } catch { /* ignore — poll purchase status instead */ }
    }

    // Poll purchase to get createdEventId
    const poll = async (): Promise<boolean> => {
      try {
        const purchase = await getPackagePurchase(purchaseId);
        if (purchase.createdEventId) {
          doneRef.current = true;
          setStatus("success");
          setTimeout(() => {
            router.push(`/organizer/events/${purchase.createdEventId}/profile`);
          }, 1200);
          return true;
        }
        if (purchase.status === "paid") {
          // Paid but event not created yet — keep polling
          return false;
        }
        if (purchase.status === "cancelled" || purchase.status === "expired") {
          doneRef.current = true;
          setError("Đơn mua gói đã hủy hoặc hết hạn.");
          setStatus("error");
          return true;
        }
      } catch (e) {
        if (pollCount.current >= MAX_POLLS) {
          doneRef.current = true;
          setError(getApiErrorMessage(e, "Không xác nhận được trạng thái thanh toán."));
          setStatus("error");
          return true;
        }
      }
      return false;
    };

    // Initial poll
    const done = await poll();
    if (done) return;

    // Repeated polls
    const interval = window.setInterval(async () => {
      pollCount.current += 1;
      if (pollCount.current > MAX_POLLS) {
        window.clearInterval(interval);
        if (!doneRef.current) {
          doneRef.current = true;
          setError("Chờ quá lâu. Vui lòng kiểm tra lại trong mục Giải của tôi.");
          setStatus("error");
        }
        return;
      }
      const resolved = await poll();
      if (resolved) window.clearInterval(interval);
    }, POLL_INTERVAL);

    return () => window.clearInterval(interval);
  }, [purchaseId, paymentIdParam, router]);

  useEffect(() => {
    if (!purchaseId) {
      setError("Thiếu mã đơn mua gói.");
      setStatus("error");
      return;
    }
    void resolve();
  }, [purchaseId, resolve]);

  if (status === "syncing") {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-orange-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">Đang xác nhận thanh toán…</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hệ thống đang tạo giải nháp cho bạn. Vui lòng chờ vài giây.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-foreground">Thanh toán thành công!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Giải nháp đã được tạo. Đang chuyển tới trang hồ sơ giải…
        </p>
        <Loader2 className="mt-3 h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error
  return (
    <div className="flex flex-col items-center text-center">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <h2 className="mt-4 text-xl font-bold text-foreground">Xác nhận thất bại</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/my-events"
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:border-orange-300"
        >
          <ArrowLeft className="h-4 w-4" /> Giải của tôi
        </Link>
        <Link
          href="/events/create"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Thử lại
        </Link>
      </div>
    </div>
  );
}
