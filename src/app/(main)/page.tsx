"use client";

import Link from "next/link";
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
} from "lucide-react";
import { getFeaturedEvents, formatPrice, formatDate, getStatusLabel, getStatusColor } from "@/data/mock-events";

export default function Home() {
  const featuredEvents = getFeaturedEvents();

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
                background: `radial-gradient(circle, ${i % 2 === 0 ? '#f97316' : '#ef4444'}, transparent)`,
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
                24+ Events Open for Registration
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Your Next Race{" "}
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Starts Here
              </span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
              Discover and register for the best running events across Vietnam. 
              From city marathons to mountain trails — find your perfect race and 
              cross that finish line.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/events"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98]"
              >
                Browse Events
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white hover:border-white/25"
              >
                How It Works
              </Link>
            </div>

            {/* Stats mini row */}
            <div className="mt-12 flex flex-wrap gap-8 sm:gap-12">
              {[
                { value: "24+", label: "Events", icon: Flag },
                { value: "15K+", label: "Runners", icon: Users },
                { value: "12", label: "Cities", icon: MapPin },
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
                Featured
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Hot Events 🔥
              </h2>
              <p className="mt-2 text-muted-foreground max-w-lg">
                Registration is open — secure your spot before it&apos;s too late.
              </p>
            </div>
            <Link
              href="/events"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredEvents.map((event) => {
              const lowestPrice = Math.min(...event.distances.map((d) => d.price));
              const progressPercent = Math.round(
                (event.registeredCount / event.maxParticipants) * 100
              );

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group block rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/8 hover:-translate-y-1.5 hover:border-orange-500/30"
                >
                  {/* Banner */}
                  <div className="relative h-40 overflow-hidden">
                    <div
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                      style={{ background: event.bannerGradient }}
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl opacity-40 group-hover:scale-125 transition-all duration-500 select-none">
                        {event.bannerEmoji}
                      </span>
                    </div>
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${getStatusColor(event.status)}`}
                      >
                        {getStatusLabel(event.status)}
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 flex gap-1">
                      {event.distances.slice(0, 3).map((d) => (
                        <span
                          key={d.id}
                          className="rounded bg-white/85 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-gray-800"
                        >
                          {d.km}K
                        </span>
                      ))}
                      {event.distances.length > 3 && (
                        <span className="rounded bg-white/85 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-gray-800">
                          +{event.distances.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3.5 space-y-2.5">
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 text-orange-500" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-orange-500" />
                      <span className="truncate">{event.city}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progressPercent}%`,
                            background: progressPercent >= 80
                              ? "linear-gradient(90deg, #ef4444, #dc2626)"
                              : "linear-gradient(90deg, #f97316, #ea580c)",
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{progressPercent}% full</span>
                        <span className="font-bold text-orange-600">
                          {formatPrice(lowestPrice)}~
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mobile "View All" link */}
          <div className="mt-8 flex justify-center sm:hidden">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
            >
              View All Events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">
              Simple Process
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              How It Works
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Get from browsing to race day in just three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: Search,
                title: "Browse Events",
                description:
                  "Explore our curated collection of running events across Vietnam. Filter by distance, location, or date to find your perfect race.",
                color: "from-blue-500 to-cyan-500",
                shadow: "shadow-blue-500/20",
              },
              {
                step: 2,
                icon: CreditCard,
                title: "Register & Pay",
                description:
                  "Fill in your details, select your race category, and complete payment securely. Your spot is confirmed instantly.",
                color: "from-orange-500 to-red-500",
                shadow: "shadow-orange-500/20",
              },
              {
                step: 3,
                icon: Trophy,
                title: "Race Day!",
                description:
                  "Show your QR code at check-in, collect your bib and race kit, and conquer the finish line. You've got this!",
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

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Trusted by Runners Nationwide
            </h2>
            <p className="mt-3 text-gray-400 max-w-md mx-auto">
              Join thousands of runners who have discovered their passion through RaceDay.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "24+", label: "Running Events", icon: Flag, suffix: "" },
              { value: "15,000", label: "Registered Runners", icon: Users, suffix: "+" },
              { value: "12", label: "Cities Covered", icon: MapPin, suffix: "" },
              { value: "98", label: "Satisfaction Rate", icon: TrendingUp, suffix: "%" },
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
                Ready to Lace Up?
              </h2>
              <p className="mt-4 text-orange-100/80 max-w-xl mx-auto text-lg">
                Don&apos;t wait — your next personal best is just a registration away. 
                Find your race and start training today.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-orange-600 shadow-lg transition-all hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
                >
                  Find Your Race
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/50"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
