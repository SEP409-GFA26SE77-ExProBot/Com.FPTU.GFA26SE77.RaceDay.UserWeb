"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { AlertTriangle, LogIn } from "lucide-react";
import { PAGE_SHELL } from "@/lib/page-shell";

/** BE chưa có dispute API — không dùng mock */
export default function DisputesPage() {
  const loggedIn = Boolean(Cookies.get("accessToken"));

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <Link
          href="/login?from=/disputes"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL} py-7 max-w-2xl space-y-6`}>
      <div>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
          Khiếu nại
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Khiếu nại của tôi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Module khiếu nại chưa có trên backend — không hiển thị dữ liệu giả.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
        <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="font-bold">Chưa có danh sách khiếu nại</h2>
        <p className="text-sm text-muted-foreground">
          Khi API sẵn sàng, các phiếu khiếu nại sẽ xuất hiện tại đây.
        </p>
        <Link href="/results" className="inline-flex text-sm font-semibold text-orange-600">
          Xem kết quả giải →
        </Link>
      </div>
    </div>
  );
}
