"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";
import { forgotPassword } from "@/api/auth";
import { getApiErrorMessage } from "@/lib/error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Vui lòng nhập email hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Không gửi được yêu cầu."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {sent ? (
        <div className="text-center space-y-4 py-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h1 className="auth-title">Đã gửi OTP</h1>
          <p className="auth-subtitle">
            Nếu email <strong>{email}</strong> đã đăng ký, bạn sẽ nhận mã OTP đặt lại mật
            khẩu trong vài phút.
          </p>
          <Link
            href={`/reset-password?email=${encodeURIComponent(email)}`}
            className="auth-submit-btn inline-flex justify-center no-underline"
          >
            Nhập OTP đặt lại mật khẩu
          </Link>
          <Link
            href="/login"
            className="auth-switch-link inline-flex items-center gap-1 justify-center"
          >
            <ArrowLeft size={14} /> Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <>
          <div className="auth-card-header">
            <h1 className="auth-title">Quên mật khẩu</h1>
            <p className="auth-subtitle">Nhập email để nhận OTP đặt lại mật khẩu</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="auth-field">
              <label htmlFor="forgot-email" className="auth-label">
                Email
              </label>
              <div className="auth-input-wrapper">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
                  style={{ position: "absolute", left: "0.75rem" }}
                />
                <input
                  id="forgot-email"
                  type="email"
                  className="auth-input"
                  style={{ paddingLeft: "2.5rem" }}
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="auth-spinner" />
                  Đang gửi…
                </>
              ) : (
                "Gửi OTP"
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
