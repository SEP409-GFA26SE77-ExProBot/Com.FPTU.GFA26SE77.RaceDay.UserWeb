"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { ArrowLeft, CheckCircle2, LogIn, User } from "lucide-react";
import { findMockUser } from "@/data/mock-users";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

export default function ProfileEditPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    description: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const username = Cookies.get("username");
    const token = Cookies.get("access_token");
    setLoggedIn(Boolean(token));
    if (username) {
      const u = findMockUser(username);
      if (u) {
        setForm((f) => ({
          ...f,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone || "",
          description: u.description || "",
        }));
      }
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <PageLoading
        title="Đang tải hồ sơ…"
        description="Chuẩn bị form chỉnh sửa thông tin."
        icon={User}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-xl font-bold">Cần đăng nhập</h1>
        <Link href="/login?from=/profile/edit" className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="text-2xl font-bold">Đã lưu hồ sơ</h1>
        <p className="text-sm text-muted-foreground">Thông tin đã cập nhật (mock local).</p>
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Về hồ sơ
        </button>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.fullName.trim()) err.fullName = "Vui lòng nhập họ tên.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Email không hợp lệ.";
    if (form.phone && !/^(0\d{9}|\+84\d{9})$/.test(form.phone.replace(/[\s.-]/g, "")))
      err.phone = "Số điện thoại không hợp lệ.";
    if (form.password) {
      if (form.password.length < 8) err.password = "Mật khẩu mới tối thiểu 8 ký tự.";
      if (form.password !== form.confirmPassword) err.confirmPassword = "Xác nhận mật khẩu không khớp.";
    }
    setErrors(err);
    if (Object.keys(err).length) return;
    localStorage.setItem(
      "raceday_profile_edit",
      JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        description: form.description,
        updatedAt: new Date().toISOString(),
      })
    );
    setSaved(true);
  };

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-2xl py-7 space-y-6`}>
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Về hồ sơ
      </Link>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Sửa hồ sơ</h1>
        <p className="text-sm text-muted-foreground mt-1">Cập nhật thông tin cá nhân và đổi mật khẩu (tuỳ chọn).</p>
      </div>
      <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-6 space-y-4">
        {(
          [
            { key: "fullName", label: "Họ tên *", type: "text" },
            { key: "email", label: "Email *", type: "email" },
            { key: "phone", label: "Số điện thoại", type: "tel" },
          ] as const
        ).map((f) => (
          <div key={f.key}>
            <label className="text-xs font-semibold mb-1.5 block">{f.label}</label>
            <input
              type={f.type}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm ${errors[f.key] ? "border-red-400" : "border-border"}`}
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
            {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
          </div>
        ))}
        <div>
          <label className="text-xs font-semibold mb-1.5 block">Mô tả</label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
        <div className="border-t pt-4 space-y-4">
          <p className="text-sm font-bold">Đổi mật khẩu (tuỳ chọn)</p>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">Mật khẩu mới</label>
            <input
              type="password"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm ${errors.password ? "border-red-400" : "border-border"}`}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm ${errors.confirmPassword ? "border-red-400" : "border-border"}`}
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-bold text-white"
        >
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
}
