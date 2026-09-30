"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, Loader2, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { findMockUser } from "@/data/mock-users";

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
    await new Promise((r) => setTimeout(r, 900));
    // Không tiết lộ email có tồn tại hay không (security UX)
    void findMockUser(email);
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-overlay" />
      <div className="auth-content">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Flag size={28} />
          </div>
          <span className="auth-brand-name">RaceDay</span>
        </div>

        <div className="auth-card">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h1 className="auth-title">Đã gửi hướng dẫn</h1>
              <p className="auth-subtitle">
                Nếu email <strong>{email}</strong> đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật
                khẩu trong vài phút (demo — không gửi mail thật).
              </p>
              <Link href="/login" className="auth-submit-btn inline-flex justify-center no-underline">
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <div className="auth-card-header">
                <h1 className="auth-title">Quên mật khẩu</h1>
                <p className="auth-subtitle">Nhập email để nhận liên kết đặt lại mật khẩu</p>
              </div>
              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                {error && (
                  <div className="auth-error" role="alert">
                    {error}
                  </div>
                )}
                <div className="auth-field">
                  <label htmlFor="forgot-email" className="auth-label">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-70" />
                    <input
                      id="forgot-email"
                      type="email"
                      className="auth-input pl-10"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
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
                    "Gửi liên kết đặt lại"
                  )}
                </button>
              </form>
              <p className="auth-switch">
                <Link href="/login" className="auth-switch-link inline-flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại đăng nhập
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
