import type { Metadata } from "next";
import Link from "next/link";
import { Flag, ArrowLeft } from "lucide-react";
import "./auth.css";

export const metadata: Metadata = {
  description:
    "Đăng nhập hoặc tạo tài khoản RaceDay để tham gia sự kiện chạy bộ, theo dõi đăng ký và nhiều tính năng khác.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      {/* Home button to redirect to '/' */}
      <Link href="/" className="auth-home-btn" id="btn-auth-home" title="Về trang chủ">
        <ArrowLeft size={16} />
        <span>Về trang chủ</span>
      </Link>

      {/* Background */}
      <div className="auth-bg" />
      <div className="auth-overlay" />

      {/* Animated particles */}
      <div className="auth-particles" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>

      {/* Content wrapper */}
      <div className="auth-content">
        {/* Brand Title */}
        <Link href="/" className="auth-brand" title="Trang chủ RaceDay">
          <div className="auth-brand-icon">
            <Flag size={28} />
          </div>
          <span className="auth-brand-name">RaceDay</span>
        </Link>

        {children}
      </div>
    </div>
  );
}
