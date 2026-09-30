"use client";

import Link from "next/link";
import {
  ArrowRight,
  Flag,
  Search,
  CreditCard,
  Trophy,
  MapPin,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { getFeaturedEvents } from "@/data/mock-events";
import FeaturedEventsCarousel from "@/components/events/FeaturedEventsCarousel";
import { PAGE_SHELL } from "@/lib/page-shell";

export default function Home() {
  const featuredEvents = getFeaturedEvents();

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,68,68,0.10),transparent_50%)]" />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-20"
              style={{
                width: `${20 + i * 15}px`,
                height: `${20 + i * 15}px`,
                background: `radial-gradient(circle, ${i % 2 === 0 ? "#f97316" : "#ef4444"}, transparent)`,
                top: `${15 + i * 14}%`,
                left: `${10 + i * 16}%`,
                animation: `float ${3 + i}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className={`relative ${PAGE_SHELL} py-14 sm:py-16 lg:py-20`}>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 mb-5">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                24+ giải đang mở đăng ký
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Giải chạy tiếp theo của bạn{" "}
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                bắt đầu tại đây
              </span>
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
              Khám phá và đăng ký các giải chạy trên khắp Việt Nam — từ marathon đô thị đến
              trail núi. Tìm cung đường phù hợp và về đích cùng RaceDay.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/events"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98]"
              >
                Xem giải chạy
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:border-white/25"
              >
                Cách hoạt động
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-8 sm:gap-12">
              {[
                { value: "24+", label: "Giải chạy", icon: Flag },
                { value: "15K+", label: "VĐV", icon: Users },
                { value: "12", label: "Tỉnh / thành", icon: MapPin },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                    <stat.icon className="h-4.5 w-4.5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 bg-gradient-to-b from-orange-50/40 via-background to-background">
        <div className={`${PAGE_SHELL} mb-5 sm:mb-6`}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1.5">
                Nổi bật
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Giải đang hot
              </h2>
              <p className="mt-1.5 text-muted-foreground max-w-lg text-sm sm:text-base">
                Vuốt hoặc để tự chạy — giữ slot trước khi hết chỗ.
              </p>
            </div>
            <Link
              href="/events"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
            >
              Xem tất cả
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <FeaturedEventsCarousel events={featuredEvents} />

        <div className={`mt-5 flex justify-center sm:hidden ${PAGE_SHELL}`}>
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
          >
            Xem tất cả giải
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="py-10 sm:py-14 bg-muted/40">
        <div className={PAGE_SHELL}>
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
              Quy trình đơn giản
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Cách hoạt động
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
              Từ khám phá giải đến ngày đua chỉ với ba bước.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                step: 1,
                icon: Search,
                title: "Tìm giải chạy",
                description:
                  "Duyệt các giải trên toàn quốc. Lọc theo cự ly, địa điểm hoặc ngày để chọn cung đường phù hợp.",
                color: "from-blue-500 to-cyan-500",
                shadow: "shadow-blue-500/20",
              },
              {
                step: 2,
                icon: CreditCard,
                title: "Đăng ký & thanh toán",
                description:
                  "Điền thông tin, khai báo y tế, chọn hạng mục và thanh toán PayOS. Slot được xác nhận ngay.",
                color: "from-orange-500 to-red-500",
                shadow: "shadow-orange-500/20",
              },
              {
                step: 3,
                icon: Trophy,
                title: "Ngày đua!",
                description:
                  "Mang mã QR check-in, nhận BIB và race kit, rồi chinh phục vạch đích.",
                color: "from-emerald-500 to-teal-500",
                shadow: "shadow-emerald-500/20",
              },
            ].map(({ step, icon: Icon, title, description, color, shadow }) => (
              <div
                key={step}
                className="group relative rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg ${shadow} mb-4`}
                >
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <div className="absolute top-5 right-6 text-5xl font-extrabold text-muted/60 select-none">
                  {step}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_60%)]" />
        <div className={`relative ${PAGE_SHELL}`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Được tin dùng bởi cộng đồng runner Việt
            </h2>
            <p className="mt-2 text-gray-400 max-w-md mx-auto text-sm sm:text-base">
              Hàng nghìn VĐV đã tìm và đăng ký giải chạy qua RaceDay.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              { value: "24+", label: "Giải chạy", icon: Flag, suffix: "" },
              { value: "15.000", label: "VĐV đã đăng ký", icon: Users, suffix: "+" },
              { value: "12", label: "Tỉnh / thành", icon: MapPin, suffix: "" },
              { value: "98", label: "Mức hài lòng", icon: TrendingUp, suffix: "%" },
            ].map(({ value, label, icon: Icon, suffix }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-center transition-all hover:bg-white/8 hover:border-white/15"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 mb-3">
                  <Icon className="h-5 w-5 text-orange-400" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white">
                  {value}
                  <span className="text-orange-400">{suffix}</span>
                </p>
                <p className="mt-1 text-sm text-gray-500 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className={`${PAGE_SHELL} max-w-4xl text-center`}>
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-8 sm:p-11 shadow-2xl shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Sẵn sàng buộc dây giày?
              </h2>
              <p className="mt-3 text-orange-100/80 max-w-xl mx-auto text-base sm:text-lg">
                Đừng chờ — thành tích tiếp theo chỉ cách một lần đăng ký. Tìm giải và bắt đầu
                tập luyện ngay hôm nay.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-orange-600 shadow-lg transition-all hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
                >
                  Tìm giải của bạn
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/50"
                >
                  Tạo tài khoản
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
