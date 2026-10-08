"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/api/auth";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/error";
import { LoginDto } from "@/dto/auth.dto";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from") || "/";

  const [form, setForm] = useState<{ username: string; password: string }>({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login({ username: form.username.trim(), password: form.password });
      router.push(fromPath);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Tên đăng nhập/email hoặc mật khẩu không chính xác."
        )
      );
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
        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

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
            className="auth-input"
            disabled={loading}
          />
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
              className="auth-input auth-input--with-icon"
              disabled={loading}
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
