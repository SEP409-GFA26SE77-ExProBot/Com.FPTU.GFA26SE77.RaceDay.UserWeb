import type { Metadata } from "next";
import "./auth.css";

export const metadata: Metadata = {
  title: {
    default: "Đăng nhập – RaceDay",
    template: "%s – RaceDay",
  },
  description:
    "Đăng nhập hoặc tạo tài khoản RaceDay để quản lý giải chạy, theo dõi đăng ký và nhiều hơn nữa.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
