"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";

/** BE chưa có dispute API — không dùng mock */
export default function DisputeCreatePage() {
  const params = useParams();
  const eventId = String(params.eventId);

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-lg py-12 text-center space-y-4`}>
      <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
      <h1 className="text-2xl font-extrabold">Khiếu nại kết quả</h1>
      <p className="text-sm text-muted-foreground">
        Chức năng khiếu nại chưa có API trên backend. Không dùng dữ liệu giả.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href={`/results/${eventId}`}
          className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Về trang giải
        </Link>
        <Link
          href="/disputes"
          className="inline-flex rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Danh sách khiếu nại
        </Link>
      </div>
    </div>
  );
}
