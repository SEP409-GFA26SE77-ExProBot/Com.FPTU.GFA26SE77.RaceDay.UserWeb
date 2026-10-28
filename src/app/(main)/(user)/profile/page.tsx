"use client";
import { getAuthUser } from "@/stores/auth-store";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Ticket, LogIn, Pencil, Flag, ArrowRight } from "lucide-react";
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
  formatDate,
  getRegistrationStatusLabel,
  getRegistrationStatusColor,
} from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import RunnerPageHeader from "@/components/runner/RunnerPageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const [loadAttempt, setLoadAttempt] = useState(0);

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
  }, [loadAttempt]);

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
    <div className={`${PAGE_SHELL_FORM} py-7 sm:py-8 space-y-6`}>
      <RunnerPageHeader title="Hồ sơ của tôi" description="Quản lý thông tin cá nhân và theo dõi hành trình chạy bộ của bạn." />

      {!error && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Đăng ký của bạn", value: regs.length, href: "/my-registrations" },
          { label: "Chờ thanh toán", value: regs.filter((reg) => reg.status === "pending_payment").length, href: "/my-registrations" },
          { label: "Đã xác nhận", value: regs.filter((reg) => reg.status === "confirmed" || reg.status === "finished").length, href: "/registered-events" },
        ].map(({ label, value, href }) => <Link key={label} href={href} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-orange-300 focus-visible:outline-2 focus-visible:outline-orange-600">
          <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p></div>
          <ArrowRight aria-hidden="true" className="size-4 text-orange-700" />
        </Link>)}
      </div>}

      <Card className="rounded-2xl p-5 space-y-6 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            {me?.avatarUrl ? (
              <span className="relative inline-flex h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-orange-500/30 bg-muted shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaDisplayUrl(me.avatarUrl)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-bold text-orange-800">
                {(me?.fullName || username).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 [overflow-wrap:anywhere]">
              <h2 className="text-xl font-bold">
                {me?.fullName || username}
              </h2>
              <p className="text-sm text-muted-foreground">
                @{me?.username || username}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="min-h-11 rounded-xl border-orange-200 bg-orange-50 px-4 text-orange-800 hover:bg-orange-100">
          <Link
            href="/profile/edit"
          >
            <Pencil className="h-3.5 w-3.5" />
            Chỉnh sửa hồ sơ
          </Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs uppercase text-muted-foreground font-semibold">
              CCCD / CMND / Hộ chiếu
            </p>
            <p className="font-medium [overflow-wrap:anywhere]">{me?.idNumber || "—"}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs uppercase text-muted-foreground font-semibold">
              Email
            </p>
            <p className="font-medium [overflow-wrap:anywhere]">{me?.email || "—"}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs uppercase text-muted-foreground font-semibold">
              Số điện thoại
            </p>
            <p className="font-medium">{me?.phone || "—"}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs uppercase text-muted-foreground font-semibold">
              Giới tính
            </p>
            <p className="font-medium">{genderLabel(me?.gender)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs uppercase text-muted-foreground font-semibold">
              Ngày sinh
            </p>
            <p className="font-medium">
              {me?.dateOfBirth ? formatDate(profileDobToDateInput(me.dateOfBirth)) : "—"}
            </p>
          </div>
        </div>
        {!me && <p className="text-sm text-amber-800">Chưa tải được thông tin hồ sơ. <button type="button" onClick={() => { setLoading(true); setLoadAttempt((attempt) => attempt + 1); }} className="min-h-11 font-semibold underline underline-offset-4">Thử lại</button></p>}
      </Card>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold flex items-center gap-2">
            <Ticket className="h-4 w-4 text-orange-500" />
            Đăng ký gần đây
          </h2>
          <Link
            href="/my-registrations"
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-orange-700 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p>{error}</p>
            <Button type="button" variant="outline" className="mt-3 min-h-11 bg-card" onClick={() => { setLoading(true); setLoadAttempt((attempt) => attempt + 1); }}>Thử lại</Button>
          </div>
        )}

        {!error && (recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground space-y-3">
            <p>Hành trình mới đang chờ bạn. Khám phá và đăng ký giải chạy đầu tiên.</p>
            <Link
              href="/events"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-white font-semibold hover:bg-orange-800"
            >
              <Flag aria-hidden="true" className="size-4" />
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
                <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  <p className="font-semibold text-sm">
                    {reg.eventName || "Giải chạy"}
                    {reg.bibNumber ? ` · BIB ${reg.bibNumber}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reg.distanceName || "—"} · {reg.distancePrice == null ? "Chưa có giá" : formatPrice(reg.distancePrice)}
                  </p>
                  <span
                    className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getRegistrationStatusColor(reg.status)}`}
                  >
                    {getRegistrationStatusLabel(reg.status)}
                  </span>
                </div>
                <Link
                  href={`/my-registrations/${reg.id}`}
                  className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Chi tiết
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </section>
    </div>
  );
}
