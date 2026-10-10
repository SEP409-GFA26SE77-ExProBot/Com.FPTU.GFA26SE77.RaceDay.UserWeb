"use client";

import Link from "next/link";
import { QrCode, Construction } from "lucide-react";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";

/** Placeholder — OLD FE cũng chưa có màn scan-qr đầy đủ */
export default function ScanQrPage() {
  return (
    <div className={`${PAGE_SHELL_FORM} py-16 text-center space-y-4`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
        <QrCode className="h-8 w-8 text-orange-600" />
      </div>
      <Construction className="mx-auto h-6 w-6 text-muted-foreground" />
      <h1 className="text-2xl font-extrabold">Quét QR Check-in</h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Màn hình scanner cho Staff/Coordinator đang được hoàn thiện. Tạm thời dùng khu vực
        Organizer / race-day prototype nếu cần demo.
      </p>
      <Link
        href="/"
        className="inline-flex rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
