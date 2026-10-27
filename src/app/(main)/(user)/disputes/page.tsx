"use client";

import { getAuthUser } from "@/stores/auth-store";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  LogIn,
  RefreshCw,
} from "lucide-react";
import { getPhotoDetail, listMyPhotoDisputes } from "@/api/photos";
import type { PhotoDetailDto, PhotoDisputeDto } from "@/dto/photo.dto";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

type DisputeRow = PhotoDisputeDto & {
  photo?: PhotoDetailDto | null;
};

function statusLabel(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "open":
      return "Đang chờ xử lý";
    case "approved":
      return "Đã duyệt — photographer sẽ sửa";
    case "rejected":
      return "Đã từ chối";
    default:
      return status || "—";
  }
}

function statusClass(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "open":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export default function DisputesPage() {
  const loggedIn = Boolean(getAuthUser());
  const [items, setItems] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listMyPhotoDisputes();
      setItems(list.map((d) => ({ ...d, photo: null })));
      setError(null);

      void Promise.all(
        list.map(async (d) => {
          try {
            const photo = await getPhotoDetail(d.photoId);
            setItems((prev) =>
              prev.map((row) => (row.id === d.id ? { ...row, photo } : row))
            );
          } catch {
            /* thumbnail optional */
          }
        })
      );
    } catch (e) {
      setItems([]);
      setError(getApiErrorMessage(e, "Không tải được khiếu nại."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    void load();
  }, [loggedIn, load]);

  if (!loggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <Link
          href="/login?from=/disputes"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <PageLoading
        title="Đang tải khiếu nại…"
        description="Lấy danh sách từ Photo API."
        icon={AlertTriangle}
      />
    );
  }

  return (
    <div className={`${PAGE_SHELL} max-w-2xl space-y-6 py-7`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-500">
            Khiếu nại
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Khiếu nại ảnh của tôi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Phiếu báo sai BIB / ảnh gửi từ trang Tìm ảnh.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/photos"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-orange-400"
          >
            <Camera className="h-3.5 w-3.5" /> Tìm ảnh
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-orange-400"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      {!items.length && !error ? (
        <div className="space-y-3 rounded-2xl border border-dashed p-10 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="font-bold">Chưa có khiếu nại</h2>
          <p className="text-sm text-muted-foreground">
            Khi tìm ảnh theo BIB, bạn có thể báo ảnh sai — phiếu sẽ hiện tại đây.
          </p>
          <Link
            href="/photos"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600"
          >
            <Camera className="h-4 w-4" /> Tìm ảnh theo BIB →
          </Link>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((d) => {
            const src = d.photo?.url ? mediaDisplayUrl(d.photo.url) : "";
            return (
              <li
                key={d.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
              >
                <div className="flex gap-0 sm:gap-0">
                  <div className="relative hidden w-28 shrink-0 bg-muted sm:block">
                    {src ? (
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="112px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full min-h-[112px] items-center justify-center text-muted-foreground">
                        <Camera className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${statusClass(
                          d.status
                        )}`}
                      >
                        {statusLabel(d.status)}
                      </span>
                      <time className="text-[11px] text-muted-foreground">
                        {d.createdAtUtc
                          ? new Date(d.createdAtUtc).toLocaleString("vi-VN")
                          : "—"}
                      </time>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {d.reason || "—"}
                    </p>
                    {d.reviewNote ? (
                      <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        Phản hồi photographer: {d.reviewNote}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
