import Link from "next/link";
import { Flag, Ticket, Trophy, Mail, MapPin } from "lucide-react";
import { PAGE_SHELL } from "@/lib/page-shell";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className={PAGE_SHELL}>
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-500/25">
                <Flag className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                RaceDay
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Nền tảng hàng đầu để khám phá và đăng ký các sự kiện chạy bộ trên khắp Việt Nam.
              Từ Marathon đến chạy địa hình — tìm giải chạy tiếp theo của bạn.
            </p>
            {/* Useful links stay available at the end of every page. */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Flag, label: "Khám phá giải chạy", href: "/events" },
                { icon: Ticket, label: "Vé của tôi", href: "/my-registrations" },
                { icon: Trophy, label: "Kết quả thi đấu", href: "/results" },
              ].map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  className="flex size-11 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground transition-colors hover:border-orange-500/40 hover:text-orange-700 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-600"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Khám phá
            </h2>
            <ul className="space-y-2.5">
              {[
                { label: "Tất cả sự kiện", href: "/events" },
                { label: "Kết quả thi đấu", href: "/results" },
                { label: "Tìm ảnh theo BIB", href: "/photos" },
                { label: "Vé của tôi", href: "/my-registrations" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-orange-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Hỗ trợ
            </h2>
            <ul className="space-y-2.5">
              {[
                { label: "Câu hỏi thường gặp (FAQ)", href: "/#how-it-works" },
                { label: "Liên hệ chúng tôi", href: "mailto:support@raceday.vn" },
                { label: "Chính sách bảo mật", href: "/privacy" },
                { label: "Điều khoản dịch vụ", href: "/terms" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-orange-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Liên hệ
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <span>Đại học FPT, Lô E2a-7, Đường D1, Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-orange-500 shrink-0" />
                <a href="mailto:support@raceday.vn" className="inline-flex min-h-11 items-center break-all hover:text-orange-700">support@raceday.vn</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/60 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} RaceDay. Đồng hành cùng cộng đồng chạy bộ Việt Nam.
          </p>
        </div>
      </div>
    </footer>
  );
}
