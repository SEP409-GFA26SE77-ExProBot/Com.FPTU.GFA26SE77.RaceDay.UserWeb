"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/api/auth";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getApiErrorMessage } from "@/lib/error";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
}

const INITIAL: RegisterForm = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  phone: "",
};

function passwordStrength(pw: string): { level: number; label: string } {
  if (!pw) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];
  return { level: score, label: labels[score] };
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>(INITIAL);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const strength = passwordStrength(form.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Vui lòng nhập họ và tên.";
    if (!form.username.trim() || form.username.trim().length < 3)
      return "Tên đăng nhập phải có ít nhất 3 ký tự.";
    if (!/^[a-zA-Z0-9._-]+$/.test(form.username.trim()))
      return "Tên đăng nhập chỉ gồm chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return "Vui lòng nhập địa chỉ email hợp lệ.";
    if (form.password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
    if (form.password !== form.confirmPassword) return "Mật khẩu xác nhận không khớp.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(
        () => router.push(`/verify-email?email=${encodeURIComponent(form.email.trim())}`),
        1500
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Đăng ký thất bại. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card auth-card--wide">
      {/* Success overlay */}
      {success && (
        <div className="auth-success-overlay">
          <CheckCircle2 size={52} className="auth-success-icon" />
          <p className="auth-success-title">Tạo tài khoản thành công!</p>
          <p className="auth-success-subtitle">Đang chuyển đến trang xác thực email…</p>
        </div>
      )}

      {/* Card header */}
      <div className="auth-card-header">
        <h1 className="auth-title">Tạo tài khoản</h1>
        <p className="auth-subtitle">Tham gia cộng đồng RaceDay ngay hôm nay</p>
      </div>

      {/* Tabs */}
      <div className="auth-tabs">
        <Link href="/login" className="auth-tab" id="tab-login">
          Đăng nhập
        </Link>
        <Link href="/register" className="auth-tab auth-tab--active" id="tab-register">
          Đăng ký
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && (
          <div className="auth-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 2-col grid on large screens */}
        <div className="auth-grid">
          {/* Full Name */}
          <div className="auth-field">
            <label htmlFor="reg-fullname" className="auth-label">
              Họ và tên
            </label>
            <input
              id="reg-fullname"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              value={form.fullName}
              onChange={handleChange}
              className="auth-input"
              disabled={loading}
            />
          </div>

          {/* Username */}
          <div className="auth-field">
            <label htmlFor="reg-username" className="auth-label">
              Tên đăng nhập
            </label>
            <input
              id="reg-username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="nguyenvana"
              value={form.username}
              onChange={handleChange}
              className="auth-input"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vana@example.com"
              value={form.email}
              onChange={handleChange}
              className="auth-input"
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div className="auth-field">
            <label htmlFor="reg-phone" className="auth-label">
              Số điện thoại <span className="auth-label-optional">(tùy chọn)</span>
            </label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+84 xxx xxx xxx"
              value={form.phone}
              onChange={handleChange}
              className="auth-input"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="reg-password" className="auth-label">
              Mật khẩu
            </label>
            <div className="auth-input-wrapper">
              <input
                id="reg-password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                value={form.password}
                onChange={handleChange}
                className="auth-input auth-input--with-icon"
                disabled={loading}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Strength meter */}
            {form.password && (
              <div className="auth-strength">
                <div className="auth-strength-bars">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`auth-strength-bar ${
                        strength.level >= n
                          ? `auth-strength-bar--${strength.level}`
                          : ""
                      }`}
                    />
                  ))}
                </div>
                <span className={`auth-strength-label auth-strength-label--${strength.level}`}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label htmlFor="reg-confirm-password" className="auth-label">
              Xác nhận mật khẩu
            </label>
            <div className="auth-input-wrapper">
              <input
                id="reg-confirm-password"
                name="confirmPassword"
                type={showConfirmPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu của bạn"
                value={form.confirmPassword}
                onChange={handleChange}
                className={`auth-input auth-input--with-icon ${
                  form.confirmPassword &&
                  form.password !== form.confirmPassword
                    ? "auth-input--error"
                    : form.confirmPassword &&
                      form.password === form.confirmPassword
                    ? "auth-input--success"
                    : ""
                }`}
                disabled={loading}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowConfirmPw((v) => !v)}
                aria-label={
                  showConfirmPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                }
                tabIndex={-1}
              >
                {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          id="btn-register-submit"
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="auth-spinner" />
              Đang tạo tài khoản…
            </>
          ) : (
            "Đăng ký tài khoản"
          )}
        </button>
      </form>

      <p className="auth-switch">
        Đã có tài khoản?{" "}
        <Link href="/login" className="auth-switch-link">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
