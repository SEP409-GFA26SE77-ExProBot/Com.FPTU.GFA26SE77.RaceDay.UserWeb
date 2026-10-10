"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { resetPassword } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/error";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("OTP phải gồm 6 chữ số.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword: password,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 1600);
    } catch (err) {
      setError(getApiErrorMessage(err, "Đặt lại mật khẩu thất bại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {done ? (
        <div className="text-center space-y-4 py-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="auth-title">Đã đổi mật khẩu</h1>
          <p className="auth-subtitle">Đang chuyển tới đăng nhập…</p>
        </div>
      ) : (
        <>
          <div className="auth-card-header">
            <h1 className="auth-title">Đặt lại mật khẩu</h1>
            <p className="auth-subtitle">Nhập OTP và mật khẩu mới</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-email">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-otp">
                OTP
              </label>
              <input
                id="reset-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="auth-input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-password">
                Mật khẩu mới
              </label>
              <input
                id="reset-password"
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-confirm">
                Xác nhận mật khẩu
              </label>
              <input
                id="reset-confirm"
                type="password"
                className="auth-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  Đang lưu…
                </>
              ) : (
                "Đặt lại mật khẩu"
              )}
            </button>
          </form>
          <p className="auth-switch">
            <Link href="/login" className="auth-switch-link inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Quay lại đăng nhập
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-card flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="animate-spin text-orange-500 mr-2" size={24} />
          <span>Đang tải…</span>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
