"use client";
import { getAuthUser } from "@/stores/auth-store";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Ticket, LogIn, Pencil } from "lucide-react";
import { getMyProfile, updateAuthAvatar } from "@/api/auth";
import { getMyRegistrations } from "@/api/events";
import {
  genderToFormValue,
  profileDobToDateInput,
  type MyProfileDto,
} from "@/dto/auth.dto";
import { RegistrationDto } from "@/dto/event.dto";
import {
  formatPrice,
  getRegistrationStatusLabel,
  getRegistrationStatusColor,
} from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

function genderLabel(g: unknown): string {
  const v = genderToFormValue(g);
  if (v === "Male") return "Nam";
  if (v === "Female") return "Nữ";
  if (v === "Other") return "Khác";
  return "—";
}

export default function ProfilePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [me, setMe] = useState<MyProfileDto | null>(null);
  const [regs, setRegs] = useState<RegistrationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticatedUser = getAuthUser();
    const name = getAuthUser()?.username || null;
    setUsername(authenticatedUser ? name : null);

    if (!authenticatedUser) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [list, profile] = await Promise.all([
          getMyRegistrations().catch((e) => {
            throw e;
          }),
          getMyProfile().catch(() => null),
        ]);
        if (!cancelled) {
          setRegs(Array.isArray(list) ? list : []);
          setMe(profile);
          if (profile?.avatarUrl) updateAuthAvatar(profile.avatarUrl);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được đăng ký."));
          setRegs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <PageLoading
        title="Đang tải hồ sơ…"
        description="Lấy thông tin tài khoản và vé từ máy chủ."
        icon={User}
      />
    );
  }

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

  const recent = regs.slice(0, 3);

  return (
    <div className={`${PAGE_SHELL_FORM} py-7 space-y-6`}>
      <div className="rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-5 sm:p-6">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1.5">
          Tài khoản
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Hồ sơ của tôi</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Dữ liệu đăng nhập và đăng ký lấy từ RaceDay API.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {me?.avatarUrl ? (
              <span className="relative inline-flex h-14 w-14 overflow-hidden rounded-full border border-orange-500/30 bg-muted shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaDisplayUrl(me.avatarUrl)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-xl font-bold text-white">
                {(me?.fullName || username).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">
                {me?.fullName || username}
              </h2>
              <p className="text-sm text-muted-foreground">
                @{me?.username || username}
              </p>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-500/15"
          >
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa hồ sơ
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">
              Identity number
            </p>
            <p className="font-medium break-all">{me?.idNumber || "—"}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">
              Email
            </p>
            <p className="font-medium break-all">{me?.email || "—"}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">
              Số điện thoại
            </p>
            <p className="font-medium">{me?.phone || "—"}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">
              Giới tính
            </p>
            <p className="font-medium">{genderLabel(me?.gender)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">
              Ngày sinh
            </p>
            <p className="font-medium">
              {profileDobToDateInput(me?.dateOfBirth) || "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold flex items-center gap-2">
            <Ticket className="h-4 w-4 text-orange-500" />
            Vé / đăng ký gần đây
          </h3>
          <Link
            href="/my-registrations"
            className="text-xs font-semibold text-orange-600 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {recent.length === 0 ? (
          <div className="text-sm text-muted-foreground space-y-3">
            <p>Chưa có đăng ký nào trên hệ thống.</p>
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-orange-600 font-semibold"
            >
              <User className="h-3.5 w-3.5" />
              Xem giải đang mở
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recent.map((reg) => (
              <li
                key={reg.id}
                className="rounded-xl border border-border p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-sm">
                    {reg.eventName || "Giải chạy"}
                    {reg.bibNumber ? ` · BIB ${reg.bibNumber}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reg.distanceName || "—"} · {formatPrice(reg.distancePrice ?? 0)}
                  </p>
                  <span
                    className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getRegistrationStatusColor(reg.status)}`}
                  >
                    {getRegistrationStatusLabel(reg.status)}
                  </span>
                </div>
                <Link
                  href={`/my-registrations/${reg.id}`}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  Chi tiết
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
