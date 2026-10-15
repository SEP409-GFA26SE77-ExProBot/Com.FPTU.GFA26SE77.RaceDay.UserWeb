"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/api/auth";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getApiErrorMessage, getZodFieldErrors } from "@/lib/error";
import { RegisterFormSchema } from "@/dto/auth.dto";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const strength = passwordStrength(form.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = RegisterFormSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      return;
    }
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const { confirmPassword: _confirmPassword, ...payload } = parsed.data;
      await register(payload);
      setSuccess(true);
      setTimeout(
        () =>
          router.push(
            `/verify-email?email=${encodeURIComponent(parsed.data.email)}`
          ),
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
              className={`auth-input${fieldErrors.fullName ? " auth-input--error" : ""}`}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? "reg-fullname-error" : undefined}
            />
            {fieldErrors.fullName ? (
              <p id="reg-fullname-error" className="auth-field-error">
                {fieldErrors.fullName}
              </p>
            ) : null}
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
              placeholder="Tên đăng nhập"
              value={form.username}
              onChange={handleChange}
              className={`auth-input${fieldErrors.username ? " auth-input--error" : ""}`}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? "reg-username-error" : undefined}
            />
            {fieldErrors.username ? (
              <p id="reg-username-error" className="auth-field-error">
                {fieldErrors.username}
              </p>
            ) : null}
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
              placeholder="mail@example.com"
              value={form.email}
              onChange={handleChange}
              className={`auth-input${fieldErrors.email ? " auth-input--error" : ""}`}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "reg-email-error" : undefined}
            />
            {fieldErrors.email ? (
              <p id="reg-email-error" className="auth-field-error">
                {fieldErrors.email}
              </p>
            ) : null}
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
              placeholder="+84xxxxxxxxx"
              value={form.phone}
              onChange={handleChange}
              className={`auth-input${fieldErrors.phone ? " auth-input--error" : ""}`}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "reg-phone-error" : undefined}
            />
            {fieldErrors.phone ? (
              <p id="reg-phone-error" className="auth-field-error">
                {fieldErrors.phone}
              </p>
            ) : null}
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
                className={`auth-input auth-input--with-icon${
                  fieldErrors.password ? " auth-input--error" : ""
                }`}
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "reg-password-error" : undefined}
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
            {fieldErrors.password ? (
              <p id="reg-password-error" className="auth-field-error">
                {fieldErrors.password}
              </p>
            ) : null}
            {/* Strength meter */}
            {form.password && (
              <div className="auth-strength">
                <div className="auth-strength-bars">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`auth-strength-bar ${strength.level >= n
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
                  fieldErrors.confirmPassword ||
                  (form.confirmPassword && form.password !== form.confirmPassword)
                    ? "auth-input--error"
                    : form.confirmPassword &&
                        form.password === form.confirmPassword
                      ? "auth-input--success"
                      : ""
                }`}
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={
                  fieldErrors.confirmPassword ? "reg-confirm-password-error" : undefined
                }
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
            {fieldErrors.confirmPassword ? (
              <p id="reg-confirm-password-error" className="auth-field-error">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
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
