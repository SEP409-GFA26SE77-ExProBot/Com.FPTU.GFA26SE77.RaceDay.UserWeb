"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OtpInput } from "./OtpInput";
import { verifyEmail, resendVerificationOtp } from "@/api/auth";
import {
  Mail,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Edit3,
  Check,
  Sparkles,
} from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toast";

interface VerifyEmailCardProps {
  initialEmail?: string;
  onSuccess?: () => void;
  onBack?: () => void;
  redirectOnSuccess?: string;
  cooldownSeconds?: number;
  isModal?: boolean;
}

export const VerifyEmailCard: React.FC<VerifyEmailCardProps> = ({
  initialEmail = "",
  onSuccess,
  onBack,
  redirectOnSuccess = "/login",
  cooldownSeconds = 60,
  isModal = false,
}) => {
  const router = useRouter();
  const [email, setEmail] = useState<string>(initialEmail);
  const [editingEmail, setEditingEmail] = useState<boolean>(!initialEmail);
  const [tempEmail, setTempEmail] = useState<string>(initialEmail);

  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(cooldownSeconds);

  // Sync if initialEmail changes
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      setTempEmail(initialEmail);
      setEditingEmail(false);
    }
  }, [initialEmail]);

  // Countdown timer for resend
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = useCallback(
    async (codeToVerify?: string) => {
      const code = codeToVerify || otp;
      if (!email.trim()) {
        toastError("Vui lòng cung cấp địa chỉ email hợp lệ.");
        return;
      }
      if (code.length !== 6) {
        toastError("Vui lòng nhập đầy đủ 6 chữ số mã xác thực.");
        return;
      }

      setLoading(true);

      try {
        await verifyEmail({ email: email.trim(), otp: code });
        setIsSuccess(true);
        if (onSuccess) {
          onSuccess();
        } else if (redirectOnSuccess) {
          setTimeout(() => {
            router.push(redirectOnSuccess);
          }, 1800);
        }
      } catch (err) {
        toastError(
          err,
          "Xác thực thất bại. Mã có thể không chính xác hoặc đã hết hạn."
        );
      } finally {
        setLoading(false);
      }
    },
    [email, otp, onSuccess, redirectOnSuccess, router]
  );

  const handleOtpComplete = (completedOtp: string) => {
    setOtp(completedOtp);
    handleVerify(completedOtp);
  };

  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toastError("Vui lòng nhập địa chỉ email hợp lệ để nhận mã.");
      return;
    }

    setResending(true);

    try {
      await resendVerificationOtp(email.trim());
      toastSuccess(`Mã xác thực gồm 6 chữ số mới đã được gửi tới ${email}`);
      setTimeLeft(cooldownSeconds);
      setOtp("");
    } catch (err) {
      toastError(
        err,
        "Gửi lại mã xác thực thất bại. Vui lòng thử lại sau giây lát."
      );
    } finally {
      setResending(false);
    }
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempEmail)) {
      toastError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }
    setEmail(tempEmail.trim());
    setEditingEmail(false);
    setTimeLeft(cooldownSeconds);
    setOtp("");
    toastSuccess(`Đã cập nhật email nhận mã thành ${tempEmail.trim()}`);
  };

  return (
    <div className={`auth-card verify-card ${isModal ? "verify-card--modal" : ""}`}>
      {/* Success celebration overlay */}
      {isSuccess && (
        <div className="auth-success-overlay">
          <div className="verify-success-icon-wrap">
            <CheckCircle2 size={56} className="auth-success-icon" />
            <Sparkles size={24} className="verify-sparkle-icon" />
          </div>
          <h2 className="auth-success-title">Đã xác thực email!</h2>
          <p className="auth-success-subtitle">
            Tài khoản của bạn đã được kích hoạt thành công. Đang chuyển hướng…
          </p>
        </div>
      )}

      {/* Card Header with Glowing Mail Icon */}
      <div className="verify-header">
        <div className="verify-icon-bubble">
          <Mail size={28} className="verify-icon-svg" />
          <span className="verify-icon-badge">
            <ShieldCheck size={14} />
          </span>
        </div>
        <h1 className="auth-title">Xác thực email của bạn</h1>
        <p className="auth-subtitle">
          Nhập mã xác nhận gồm 6 chữ số đã được gửi tới hòm thư của bạn
        </p>
      </div>

      {/* Recipient Email Display / Edit Box */}
      <div className="verify-email-box">
        {editingEmail ? (
          <form onSubmit={handleSaveEmail} className="verify-email-edit-form">
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              placeholder="name@example.com"
              className="auth-input verify-email-input"
              autoFocus
            />
            <button
              type="submit"
              className="verify-save-email-btn"
              title="Lưu Email"
            >
              <Check size={16} />
              <span>Cập nhật</span>
            </button>
          </form>
        ) : (
          <div className="verify-email-badge">
            <Mail size={15} className="verify-badge-icon" />
            <span className="verify-email-address" title={email || "Chưa có email"}>
              {email || "Chưa có email"}
            </span>
            <button
              type="button"
              onClick={() => {
                setTempEmail(email);
                setEditingEmail(true);
              }}
              className="verify-edit-email-btn"
              title="Đổi địa chỉ email"
            >
              <Edit3 size={14} />
              <span>Đổi</span>
            </button>
          </div>
        )}
      </div>

      {/* 6-Digit OTP Input Box */}
      <div className="verify-otp-section">
        <div className="verify-otp-label-row">
          <label className="auth-label">Mã bảo mật 6 chữ số</label>
          {otp.length > 0 && (
            <button
              type="button"
              onClick={() => setOtp("")}
              className="verify-clear-btn"
              disabled={loading}
            >
              Xóa mã
            </button>
          )}
        </div>

        <OtpInput
          length={6}
          value={otp}
          onChange={(newVal) => {
            setOtp(newVal);
          }}
          onComplete={handleOtpComplete}
          disabled={loading || isSuccess}
          isError={false}
          isSuccess={isSuccess}
          autoFocus={!editingEmail}
        />

        <p className="verify-hint">
          Dán mã từ clipboard hoặc nhập từng số. Mã có hiệu lực trong 10 phút.
        </p>
      </div>

      {/* Verify Button */}
      <button
        id="btn-verify-otp-submit"
        type="button"
        onClick={() => handleVerify()}
        className="auth-submit-btn verify-submit-btn"
        disabled={loading || otp.length !== 6 || isSuccess}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="auth-spinner" />
            Đang xác thực…
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Xác thực Email
          </>
        )}
      </button>

      {/* Resend Code Footer & Timer */}
      <div className="verify-resend-row">
        <span className="verify-resend-text">Chưa nhận được mã?</span>
        {timeLeft > 0 ? (
          <span className="verify-countdown">
            <span className="verify-countdown-pulse" />
            Gửi lại sau <strong>{timeLeft}s</strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || loading}
            className="verify-resend-btn"
          >
            {resending ? (
              <>
                <Loader2 size={14} className="auth-spinner" />
                Đang gửi…
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Gửi lại mã
              </>
            )}
          </button>
        )}
      </div>

      {/* Back / Navigation links */}
      <div className="verify-footer-links">
        {onBack ? (
          <button type="button" onClick={onBack} className="verify-back-btn">
            <ArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
        ) : (
          <div className="verify-nav-links">
            <Link href="/login" className="auth-switch-link verify-nav-item">
              Quay lại Đăng nhập
            </Link>
            <span className="verify-nav-dot">•</span>
            <Link href="/register" className="auth-switch-link verify-nav-item">
              Tạo tài khoản mới
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
