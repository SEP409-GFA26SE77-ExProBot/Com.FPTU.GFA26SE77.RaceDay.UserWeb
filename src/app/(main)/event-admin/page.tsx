"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";

/** Placeholder — điều hướng sang Organizer đã port */
export default function EventAdminPage() {
  return (
    <div className={`${PAGE_SHELL_FORM} py-16 text-center space-y-4`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
        <LayoutDashboard className="h-8 w-8 text-orange-600" />
      </div>
      <h1 className="text-2xl font-extrabold">Quản trị sự kiện</h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Khu vực admin riêng đang gom về Organizer. Dùng bảng điều khiển Organizer để duyệt
        đăng ký và quản lý giải.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href="/organizer"
          className="inline-flex rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Mở Organizer
        </Link>
        <Link
          href="/organizer/approvals"
          className="inline-flex rounded-full border px-5 py-2.5 text-sm font-semibold"
        >
          Duyệt đăng ký
        </Link>
      </div>
    </div>
  );
}
