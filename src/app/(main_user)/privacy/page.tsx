import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className={`${PAGE_SHELL_FORM} max-w-3xl py-8`}>
      <div className="rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-5 sm:p-6 mb-6">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1.5">
          Pháp lý
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Chính sách bảo mật</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          RaceDay prototype — cách xử lý dữ liệu cá nhân của runner.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-white p-5 sm:p-6 space-y-4 text-sm leading-relaxed">
        <p>
          1. Chúng tôi thu thập họ tên, liên hệ, CCCD/hộ chiếu, chỉ số thể chất và khai báo y tế phục
          vụ đăng ký giải.
        </p>
        <p>2. Dữ liệu dùng cho vận hành sự kiện, check-in, kết quả và tìm ảnh theo BIB.</p>
        <p>
          3. Prototype lưu một phần dữ liệu trên trình duyệt (session/localStorage) — không phải môi
          trường production.
        </p>
        <p>4. Bạn có thể yêu cầu xem/sửa hồ sơ qua trang Hồ sơ.</p>
      </div>
      <Link href="/" className="inline-block mt-6 text-orange-600 font-semibold text-sm">
        Về trang chủ
      </Link>
    </div>
  );
}
