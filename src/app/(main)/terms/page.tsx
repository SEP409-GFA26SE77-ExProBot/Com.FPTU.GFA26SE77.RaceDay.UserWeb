import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className={`${PAGE_SHELL_FORM} max-w-3xl py-8`}>
      <div className="rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-5 sm:p-6 mb-6">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1.5">
          Pháp lý
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Điều khoản sử dụng</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Phiên bản demo RaceDay — áp dụng cho runner khi đăng ký giải và thanh toán.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-white p-5 sm:p-6 space-y-4 text-sm text-foreground/90 leading-relaxed">
        <p>1. Người dùng cam kết cung cấp thông tin đăng ký và khai báo y tế trung thực.</p>
        <p>2. Việc thanh toán qua PayOS sandbox trong prototype không phát sinh phí thật.</p>
        <p>3. Ban tổ chức có quyền từ chối hoặc hủy đăng ký nếu vi phạm quy định giải.</p>
        <p>
          4. Runner tự chịu rủi ro sức khỏe khi tham gia; xem thêm xác nhận miễn trừ trên form đăng
          ký.
        </p>
      </div>
      <Link href="/" className="inline-block mt-6 text-orange-600 font-semibold text-sm">
        Về trang chủ
      </Link>
    </div>
  );
}
