"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";

/** Placeholder — quản lý giải qua Giải của tôi → chi tiết event */
export default function EventAdminPage() {
  return (
    <div className={`${PAGE_SHELL_FORM} py-16 text-center space-y-4`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
        <LayoutDashboard className="h-8 w-8 text-orange-600" />
      </div>
      <h1 className="text-2xl font-extrabold">Quản trị sự kiện</h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Mở giải đã duyệt từ trang Giải của tôi để quản lý và duyệt đăng ký theo từng
        sự kiện.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/my-events"
          className="inline-flex rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Giải của tôi
        </Link>
      </div>
    </div>
  );
}
