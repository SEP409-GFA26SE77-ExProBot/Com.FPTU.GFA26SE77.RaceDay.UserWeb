"use client";

import { PAGE_SHELL_FORM } from "@/lib/page-shell";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { User, Ticket, Camera, LogIn } from "lucide-react";
import { findMockUser } from "@/data/mock-users";

interface SavedTicket {
  bib: number;
  eventTitle: string;
  distanceLabel: string;
  fullName: string;
  event_id: number;
}

export default function ProfilePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [ticket, setTicket] = useState<SavedTicket | null>(null);

  useEffect(() => {
    setUsername(Cookies.get("username") || null);
    const raw = sessionStorage.getItem("confirmation_data");
    if (raw) {
      try {
        setTicket(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const user = username ? findMockUser(username) : null;

  if (!username) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <p className="text-muted-foreground">Đăng nhập để xem hồ sơ và vé đăng ký.</p>
        <Link
          href="/login?from=/profile"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL_FORM} py-7 space-y-6`}>
      <div className="rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-5 sm:p-6">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1.5">Tài khoản</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Hồ sơ của tôi</h1>
        <p className="mt-1 text-muted-foreground text-sm">Thông tin tài khoản VĐV (mock tiếng Việt).</p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-xl font-bold text-white">
            {(user?.fullName || username).charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.fullName || username}</h2>
            <p className="text-sm text-muted-foreground">@{username}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Email</p>
            <p className="font-medium">{user?.email || "—"}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Điện thoại</p>
            <p className="font-medium">{user?.phone || "—"}</p>
          </div>
          <div className="sm:col-span-2 rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">Mô tả</p>
            <p className="font-medium">{user?.description || "—"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold flex items-center gap-2">
            <Ticket className="h-4 w-4 text-orange-500" />
            Vé / đăng ký
          </h3>
          <Link href="/profile/edit" className="text-xs font-semibold text-orange-600 hover:underline">
            Sửa hồ sơ
          </Link>
        </div>
        <Link
          href="/my-registrations"
          className="inline-flex text-sm font-semibold text-orange-600 hover:underline"
        >
          Xem tất cả vé của tôi →
        </Link>
        {ticket ? (
          <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
            <p className="font-bold text-lg">BIB {ticket.bib}</p>
            <p>{ticket.eventTitle}</p>
            <p className="text-muted-foreground">{ticket.distanceLabel} · {ticket.fullName}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/events/${ticket.event_id}/confirmation`}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Xem QR phiên này
              </Link>
              <Link
                href={`/photos?bib=${ticket.bib}`}
                className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Camera className="h-3 w-3" />
                Tìm ảnh
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground space-y-3">
            <p>Chưa có vé trong phiên này. Xem danh sách vé đã lưu hoặc đăng ký giải mới.</p>
            <Link href="/events" className="inline-flex items-center gap-1 text-orange-600 font-semibold">
              <User className="h-3.5 w-3.5" />
              Xem giải đang mở
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
