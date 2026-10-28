"use client";
import { getAuthUser } from "@/stores/auth-store";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Flag,
  Search,
  CreditCard,
  Trophy,
  Camera,
  Ticket,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/error";
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
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadEvents() {
      try {
        const events = await getEvents();
        if (isMounted) {
          setError(null);
          // Prioritize open events or first 4
          const openEvents = events.filter(
            (e) => e.status?.toLowerCase() === "registration-open" || e.status?.toLowerCase() === "published"
          );
          setFeaturedEvents(openEvents.length >= 4 ? openEvents.slice(0, 4) : events.slice(0, 4));
        }
      } catch (e) {
        if (isMounted) {
          setFeaturedEvents([]);
          setError(getApiErrorMessage(e, "Chưa thể tải các giải chạy. Vui lòng thử lại."));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadEvents();
    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    let cancelled = false;
    if (!getAuthUser()) {
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
        <Image src="/race-auth-bg.jpg" alt="" fill preload sizes="100vw" className="object-cover object-[65%_center]" />
        <div className="absolute inset-0 bg-gray-950/65 lg:bg-gradient-to-r lg:from-gray-950 lg:via-gray-950/90 lg:to-gray-950/20" />
        <div className={`relative ${PAGE_SHELL} py-16 sm:py-24 lg:py-28`}>
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 mb-6">
              <Flag aria-hidden="true" className="size-4 shrink-0 text-orange-300" />
              <span className="text-xs font-semibold text-orange-200 tracking-wide">
                Mỗi bước chạy, một hành trình mới
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] text-balance">
              Đường đua tiếp theo. <br className="hidden sm:block" />{" "}
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Dấu ấn của bạn.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-200 sm:text-lg">
              Từ 5K đầu tiên đến marathon đầy thử thách. Khám phá giải chạy khắp Việt Nam, đăng ký và chuẩn bị cho ngày thi đấu cùng RaceDay.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild className="h-12 rounded-xl bg-gradient-to-r from-orange-700 to-red-700 px-6 text-base font-semibold text-white shadow-lg hover:opacity-90">
              <Link
                href="/events"
              >
                Khám phá giải chạy
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              </Button>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300"
              >
                Quy trình tham gia
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3 border-t border-white/15 pt-6">
              {[
                { label: "5K", href: "/events?tag=fun5" },
                { label: "10K", href: "/events?tag=d10" },
                { label: "Half marathon", href: "/events?tag=half" },
                { label: "Marathon", href: "/events?tag=full" },
              ].map((stat) => (
                <Link key={stat.label} href={stat.href} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-gray-100 transition-colors hover:border-orange-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-orange-300">
                  {stat.label}<ChevronRight aria-hidden="true" className="size-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-12 sm:py-16">
        <div className={PAGE_SHELL}>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
                Nổi bật
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Tìm giải chạy, bắt đầu hành trình
              </h2>
              <p className="mt-2 text-muted-foreground max-w-lg">
                Đăng ký sớm để chọn cự ly yêu thích và nhận race kit đặc quyền.
              </p>
            </div>
            <Link
              href="/events"
              className="hidden min-h-11 items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:inline-flex"
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
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-sm text-red-800">{error}</p>
              <Button type="button" variant="outline" onClick={() => { setLoading(true); setLoadAttempt((attempt) => attempt + 1); }} className="mt-4 min-h-11 bg-card">Thử lại</Button>
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
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-800 transition-colors"
            >
              Xem tất cả giải chạy
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-24 border-y border-border/60 bg-card py-12 sm:py-16">
        <div className={PAGE_SHELL}>
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
              Quy trình tham gia
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Sẵn sàng xuất phát với 3 bước
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
                title: "Đăng ký & thanh toán",
                description:
                  "Điền thông tin VĐV, chọn cự ly và hoàn tất thanh toán theo hướng dẫn. Theo dõi trạng thái duyệt tại Vé của tôi.",
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
                className="relative rounded-2xl border border-border/70 bg-background p-6 sm:p-7"
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

      {/* Runner shortcuts */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_60%)]" />

        <div className={`relative ${PAGE_SHELL}`}>
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Mọi thứ cho hành trình của bạn
            </h2>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">
              Chuẩn bị trước ngày đua và lưu giữ những cột mốc đáng nhớ sau vạch đích.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Vé & mã QR", description: "Sẵn sàng cho ngày thi đấu", href: "/my-registrations", icon: Ticket },
              { label: "Kết quả thi đấu", description: "Theo dõi thành tích của bạn", href: "/results", icon: Trophy },
              { label: "Ảnh trên đường chạy", description: "Tìm khoảnh khắc theo BIB", href: "/photos", icon: Camera },
              { label: "Hồ sơ cá nhân", description: "Cập nhật thông tin của bạn", href: "/profile", icon: User },
            ].map(({ label, description, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="rounded-2xl border border-white/15 bg-white/5 p-5 text-center transition-colors hover:bg-white/10 hover:border-orange-400/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 sm:p-6"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15 mb-4">
                  <Icon className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-base font-bold text-white">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">{description}</p>
              </Link>
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
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-orange-700 shadow-lg transition-all hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
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
