"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { ArrowLeft, CheckCircle2, LogIn, KeyRound } from "lucide-react";
import { changePassword } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

export default function ProfileEditPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get("access_token");
    setLoggedIn(Boolean(token));
    setUsername(Cookies.get("username") || "");
    setReady(true);
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.currentPassword) e.currentPassword = "Nhập mật khẩu hiện tại";
    if (form.newPassword.length < 8)
      e.newPassword = "Mật khẩu mới tối thiểu 8 ký tự";
    if (form.newPassword !== form.confirmPassword)
      e.confirmPassword = "Xác nhận mật khẩu không khớp";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSaved(true);
    } catch (err) {
      setApiError(getApiErrorMessage(err, "Đổi mật khẩu thất bại."));
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <PageLoading
        title="Đang tải…"
        description="Chuẩn bị form đổi mật khẩu."
        icon={KeyRound}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-xl font-bold">Cần đăng nhập</h1>
        <Link
          href="/login?from=/profile/edit"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="text-2xl font-bold">Đã đổi mật khẩu</h1>
        <p className="text-sm text-muted-foreground">
          Mật khẩu mới đã được cập nhật trên máy chủ.
        </p>
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

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-lg py-7 space-y-6`}>
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Về hồ sơ
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Đổi mật khẩu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tài khoản <span className="font-semibold text-foreground">{username}</span>.
          Cập nhật hồ sơ cá nhân (họ tên/SĐT) chưa có API public — chỉ đổi mật khẩu qua IAM.
        </p>
      </div>

      {apiError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-5 space-y-4" noValidate>
        {(
          [
            {
              key: "currentPassword",
              label: "Mật khẩu hiện tại",
              autoComplete: "current-password",
            },
            {
              key: "newPassword",
              label: "Mật khẩu mới",
              autoComplete: "new-password",
            },
            {
              key: "confirmPassword",
              label: "Xác nhận mật khẩu mới",
              autoComplete: "new-password",
            },
          ] as const
        ).map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-semibold mb-1.5">{f.label}</label>
            <input
              type="password"
              autoComplete={f.autoComplete}
              value={form[f.key]}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, [f.key]: e.target.value }));
                setErrors((prev) => {
                  const n = { ...prev };
                  delete n[f.key];
                  return n;
                });
              }}
              className="w-full rounded-xl border border-border bg-background py-2.5 px-4 text-sm outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              disabled={saving}
            />
            {errors[f.key] && (
              <p className="mt-1 text-xs text-red-500">{errors[f.key]}</p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Đang lưu…" : "Cập nhật mật khẩu"}
        </button>
      </form>
    </div>
  );
}
