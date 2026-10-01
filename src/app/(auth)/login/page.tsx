"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/api/auth";
import { MOCK_USERS } from "@/data/mock-users";
import { Eye, EyeOff, Loader2, Flag, AlertCircle, Sparkles } from "lucide-react";
import type { AxiosError } from "axios";
import Cookies from "js-cookie";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from") || "/";

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleQuickLogin = (username: string, pass: string) => {
    setForm({ username, password: pass });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login({ username: form.username, password: form.password });
      router.push(Cookies.get("role") === "ORGANIZER" ? "/organizer" : fromPath);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg =
        (err as Error).message ||
        axiosErr.response?.data?.message ||
        "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h1 className="auth-title">Chào mừng trở lại</h1>
        <p className="auth-subtitle">Đăng nhập vào tài khoản RaceDay</p>
      </div>

      <div className="auth-tabs">
        <Link href="/login" className="auth-tab auth-tab--active" id="tab-login">
          Đăng nhập
        </Link>
        <Link href="/register" className="auth-tab" id="tab-register">
          Đăng ký
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

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

        <div className="auth-field">
          <div className="auth-label-row">
            <label htmlFor="login-password" className="auth-label">
              Mật khẩu
            </label>
            <Link href="/forgot-password" className="auth-forgot">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="auth-input-wrapper">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
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
        </div>

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

      <div className="auth-demo-section">
        <div className="auth-demo-header">
          <Sparkles size={14} className="text-orange-400" />
          <span>Tài khoản demo nhanh</span>
        </div>
        <div className="auth-demo-grid">
          {MOCK_USERS.map((user) => (
            <button
              key={user.username}
              type="button"
              onClick={() => handleQuickLogin(user.username, user.password)}
              className="auth-demo-chip"
              title={`Điền thông tin ${user.fullName} (${user.role})`}
            >
              <span className="auth-demo-role">{user.role}</span>
              <span className="auth-demo-user">{user.username}</span>
            </button>
          ))}
        </div>
      </div>

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
    <div className="auth-page">
      {/* Background */}
      <div className="auth-bg" />
      <div className="auth-overlay" />

      {/* Animated particles */}
      <div className="auth-particles" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>

      {/* Content */}
      <div className="auth-content">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Flag size={28} />
          </div>
          <span className="auth-brand-name">RaceDay</span>
        </div>

        <Suspense fallback={<div className="auth-card p-8 text-center text-muted-foreground">Đang tải...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}


