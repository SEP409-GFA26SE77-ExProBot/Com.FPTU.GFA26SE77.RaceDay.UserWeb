"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/api/auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { getZodFieldErrors } from "@/lib/error";
import { toastError } from "@/lib/toast";
import { LoginSchema } from "@/dto/auth.dto";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPath = searchParams.get("from") || "/";
  const fromPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\") ? requestedPath : "/";

  const [form, setForm] = useState<{ username: string; password: string }>({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [mustChangePasswordHint, setMustChangePasswordHint] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = LoginSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      return;
    }
    setLoading(true);
    setFieldErrors({});
    try {
      const res = await login(parsed.data);
      if (res.mustChangePassword) {
        setMustChangePasswordHint(true);
        return;
      }
      router.push(fromPath);
    } catch (err) {
      toastError(err, "Tên đăng nhập/email hoặc mật khẩu không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {/* Card header */}
      <div className="auth-card-header">
        <h1 className="auth-title">Chào mừng trở lại</h1>
        <p className="auth-subtitle">Đăng nhập vào tài khoản RaceDay của bạn</p>
      </div>

      {/* Tabs */}
      <div className="auth-tabs">
        <Link href="/login" className="auth-tab auth-tab--active" id="tab-login">
          Đăng nhập
        </Link>
        <Link href="/register" className="auth-tab" id="tab-register">
          Đăng ký
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Error */}

        {/* Username / Email */}
        <div className="auth-field">
          <label htmlFor="login-username" className="auth-label">
            Tên đăng nhập
          </label>
          <input
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Nhập tên đăng nhập"
            value={form.username}
            onChange={handleChange}
            className={`auth-input${fieldErrors.username ? " auth-input--error" : ""}`}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? "login-username-error" : undefined}
          />
          {fieldErrors.username ? (
            <p id="login-username-error" className="auth-field-error">
              {fieldErrors.username}
            </p>
          ) : null}
        </div>

        {/* Password */}
        <div className="auth-field">
          <div className="auth-label-row">
            <label htmlFor="login-password" className="auth-label">
              Mật khẩu
            </label>
          </div>
          <div className="auth-input-wrapper">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu của bạn"
              value={form.password}
              onChange={handleChange}
              className={`auth-input auth-input--with-icon${
                fieldErrors.password ? " auth-input--error" : ""
              }`}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p id="login-password-error" className="auth-field-error">
              {fieldErrors.password}
            </p>
          ) : null}
          <Link href="/forgot-password" className="auth-forgot">
            Quên mật khẩu?
          </Link>
        </div>

        {/* Submit */}
        <button
          id="btn-login-submit"
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="auth-spinner" />
              Đang đăng nhập…
            </>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>

      <p className="auth-switch">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="auth-switch-link">
          Đăng ký ngay
        </Link>
      </p>

      {mustChangePasswordHint ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-orange-500/30 bg-zinc-900 p-5 text-left shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400">
              Kích hoạt thành công
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-white">
              Nên đổi mật khẩu mặc định
            </h2>
            <p className="mt-2 text-sm text-zinc-300">
              Tài khoản nhân sự đã kích hoạt (không phải đăng ký mới). Vì mật
              khẩu được cấp qua email, hãy đổi ngay trong Hồ sơ → Đổi mật khẩu.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-zinc-600 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
                onClick={() => {
                  setMustChangePasswordHint(false);
                  router.push(fromPath);
                }}
              >
                Để sau
              </button>
              <button
                type="button"
                className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white"
                onClick={() => {
                  setMustChangePasswordHint(false);
                  router.push("/profile/edit");
                }}
              >
                Đổi mật khẩu ngay
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-card flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="animate-spin text-orange-500 mr-2" size={24} />
          <span>Đang tải trang đăng nhập…</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
