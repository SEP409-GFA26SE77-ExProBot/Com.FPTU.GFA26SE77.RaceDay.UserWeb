"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import {
  ArrowRight,
  Flag,
  Search,
  CreditCard,
  Trophy,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getEvents, getMyRegistrations } from "@/api/events";
import { RaceEventListItemDto } from "@/dto/event.dto";
import EventCard from "@/components/events/EventCard";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import { PAGE_SHELL } from "@/lib/page-shell";

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<RaceEventListItemDto[]>([]);
  const [myRegByEventId, setMyRegByEventId] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      try {
        const events = await getEvents();
        if (isMounted) {
          // Prioritize open events or first 4
          const openEvents = events.filter(
            (e) => e.status?.toLowerCase() === "registration-open" || e.status?.toLowerCase() === "published"
          );
          setFeaturedEvents(openEvents.length >= 4 ? openEvents.slice(0, 4) : events.slice(0, 4));
        }
      } catch {
        if (isMounted) setFeaturedEvents([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!Cookies.get("accessToken")) {
      setMyRegByEventId(new Map());
      return;
    }
    (async () => {
      try {
        const regs = await getMyRegistrations();
        if (cancelled) return;
        const map = new Map<string, string>();
        const rank = (s: string) => {
          if (s === "confirmed" || s === "finished") return 3;
          if (s === "pending_approval") return 2;
          if (s === "pending_payment") return 1;
          return 0;
        };
        for (const r of Array.isArray(regs) ? regs : []) {
          if (r.status === "rejected" || r.status === "cancelled") continue;
          const id = String(r.eventId);
          const prev = map.get(id);
          if (!prev || rank(r.status) > rank(prev)) map.set(id, r.status);
        }
        setMyRegByEventId(map);
      } catch {
        if (!cancelled) setMyRegByEventId(new Map());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,68,68,0.10),transparent_50%)]" />

        {/* Floating particles */}
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

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 mb-6">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                Nền tảng giải chạy marathon hàng đầu Việt Nam
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Hành Trình Chinh Phục{" "}
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Đường Đua Mới
              </span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
              Khám phá và đăng ký các giải chạy marathon, trail đỉnh cao khắp Việt Nam. 
              Thủ tục check-in thông minh qua mã QR, quản lý số BIB và thanh toán PayOS tức thì.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/events"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98]"
              >
                Khám phá giải chạy
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:border-white/25"
              >
                Quy trình tham gia
              </Link>
            </div>

            {/* Stats mini row */}
            <div className="mt-12 flex flex-wrap gap-8 sm:gap-12">
              {[
                { value: "50+", label: "Giải chạy toàn quốc", icon: Flag },
                { value: "20K+", label: "Vận động viên", icon: Users },
                { value: "100%", label: "Tự động hóa PayOS", icon: Trophy },
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

      {/* Featured Events */}
      <section className="py-16 sm:py-20 bg-background">
        <div className={PAGE_SHELL}>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
                Nổi bật
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Giải Chạy Đang Mở Đăng Ký 🔥
              </h2>
              <p className="mt-2 text-muted-foreground max-w-lg">
                Đăng ký sớm để chọn cự ly yêu thích và nhận race kit đặc quyền.
              </p>
            </div>
            <Link
              href="/events"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Xem tất cả
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <Sparkles className="h-10 w-10 text-orange-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Chưa có giải chạy nổi bật</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Hiện tại chưa có sự kiện nào. Hãy quay lại sau để cập nhật các giải chạy mới nhất.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  myRegistrationStatus={
                    myRegByEventId.get(String(event.id)) ?? null
                  }
                />
              ))}
            </div>
          )}

          {/* Mobile "View All" link */}
          <div className="mt-8 flex justify-center sm:hidden">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
            >
              Xem tất cả giải chạy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-muted/30">
        <div className={PAGE_SHELL}>
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
              Quy trình tham gia
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              3 Bước Dễ Dàng Để Sẵn Sàng Chạy
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Từ lúc đăng ký đến ngày thi đấu chỉ với vài cú nhấp chuột.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: Search,
                title: "Tìm kiếm giải chạy",
                description:
                  "Chọn cự ly yêu thích (5K, 10K, 21K, 42K) và địa điểm thi đấu phù hợp từ danh sách giải chạy trên toàn quốc.",
                color: "from-blue-500 to-cyan-500",
                shadow: "shadow-blue-500/20",
              },
              {
                step: 2,
                icon: CreditCard,
                title: "Đăng ký & Thanh toán PayOS",
                description:
                  "Điền thông tin VĐV, cỡ áo thi đấu và quét mã VietQR PayOS an toàn, kích hoạt ngay lập tức.",
                color: "from-orange-500 to-red-500",
                shadow: "shadow-orange-500/20",
              },
              {
                step: 3,
                icon: Trophy,
                title: "Nhận BIB & Tỏa sáng",
                description:
                  "Nhận mã QR vé điện tử, quét check-in nhận race kit và tự tin chinh phục vạch đích vào ngày thi đấu.",
                color: "from-emerald-500 to-teal-500",
                shadow: "shadow-emerald-500/20",
              },
            ].map(({ step, icon: Icon, title, description, color, shadow }) => (
              <div
                key={step}
                className="group relative rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Step number */}
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg ${shadow} mb-5`}
                >
                  <Icon className="h-5.5 w-5.5" />
                </div>

                <div className="absolute top-5 right-6 text-5xl font-extrabold text-muted/60 select-none">
                  {step}
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_60%)]" />

        <div className={`relative ${PAGE_SHELL}`}>
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Đồng Hành Cùng Cộng Đồng VĐV
            </h2>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">
              Hàng ngàn chân chạy phong trào và chuyên nghiệp tin tưởng lựa chọn RaceDay.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "50+", label: "Giải chạy chất lượng", icon: Flag, suffix: "" },
              { value: "20,000", label: "VĐV đăng ký", icon: Users, suffix: "+" },
              { value: "25", label: "Tỉnh thành", icon: MapPin, suffix: "" },
              { value: "99.8", label: "Giao dịch thành công", icon: TrendingUp, suffix: "%" },
            ].map(({ value, label, icon: Icon, suffix }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center transition-all hover:bg-white/8 hover:border-white/15"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 mb-4">
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

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-10 sm:p-14 shadow-2xl shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Sẵn Sàng Thắt Dây Giày & Chinh Phục?
              </h2>
              <p className="mt-4 text-orange-100/80 max-w-xl mx-auto text-lg">
                Đừng trì hoãn mục tiêu của bạn. Hãy ghi danh ngay hôm nay và bắt đầu hành trình phá vỡ kỷ lục cá nhân.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-orange-600 shadow-lg transition-all hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
                >
                  Tìm giải chạy ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/50"
                >
                  Tạo tài khoản VĐV
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
