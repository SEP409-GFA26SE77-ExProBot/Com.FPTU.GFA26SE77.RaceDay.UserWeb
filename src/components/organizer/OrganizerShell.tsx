"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/api/auth";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  ChevronDown,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Settings2,
  Trophy,
  Users,
  X,
  ClipboardList,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/organizer", icon: LayoutDashboard },
  { label: "Events", href: "/organizer/events", icon: CalendarDays },
  { label: "Race Registration", href: "/organizer/registration", icon: ClipboardList },
  { label: "Participants", href: "/organizer/participants", icon: Users },
  { label: "Race Day", href: "/organizer/race-day", icon: QrCode },
  { label: "Results", href: "/organizer/results", icon: Trophy },
  { label: "Photos", href: "/organizer/photos", icon: Camera },
  { label: "Reports", href: "/organizer/reports", icon: BarChart3 },
];

export default function OrganizerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-slate-950">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-[#121827] text-white shadow-2xl shadow-slate-950/10 transition-transform duration-300 lg:translate-x-0 ${collapsed ? "lg:w-[88px]" : ""} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link href="/organizer" onClick={closeMobile} className="flex items-center gap-3 overflow-hidden">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-600 shadow-lg shadow-orange-500/25"><Flag className="h-5 w-5" /></span>
            <span className={`${collapsed ? "lg:hidden" : ""} whitespace-nowrap text-lg font-black tracking-tight`}>RaceDay</span>
          </Link>
          <button onClick={closeMobile} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Đóng menu"><X className="h-5 w-5" /></button>
        </div>
        <div className={`border-b border-white/10 px-5 py-5 ${collapsed ? "lg:px-3" : ""}`}>
          <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-400 ${collapsed ? "lg:hidden" : ""}`}>Organizer Portal</p>
          <p className={`truncate text-sm font-semibold text-white ${collapsed ? "lg:hidden" : ""}`}>Quản lý giải chạy</p>
          <div className={`mt-3 flex items-center gap-2 rounded-lg bg-white/[0.06] p-2 ${collapsed ? "lg:justify-center" : ""}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">VP</span>
            <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}><p className="truncate text-xs font-semibold">Vũ Thanh Phong</p><p className="truncate text-[11px] text-slate-400">Organizer</p></div>
            <ChevronDown className={`h-4 w-4 text-slate-500 ${collapsed ? "lg:hidden" : ""}`} />
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 ${collapsed ? "lg:hidden" : ""}`}>Workspace</p>
          {navigation.map((item) => {
            const active = item.href === "/organizer" ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return <Link key={item.href} href={item.href} onClick={closeMobile} title={collapsed ? item.label : undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${active ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-950/20" : "text-slate-400 hover:bg-white/[0.07] hover:text-white"} ${collapsed ? "lg:justify-center" : ""}`}><Icon className="h-[18px] w-[18px] shrink-0" /><span className={collapsed ? "lg:hidden" : ""}>{item.label}</span></Link>;
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link href="/profile" onClick={closeMobile} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/[0.07] hover:text-white ${collapsed ? "lg:justify-center" : ""}`}><Settings2 className="h-[18px] w-[18px] shrink-0" /><span className={collapsed ? "lg:hidden" : ""}>Settings</span></Link>
          <button onClick={() => logout()} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300 ${collapsed ? "lg:justify-center" : ""}`}><LogOut className="h-[18px] w-[18px] shrink-0" /><span className={collapsed ? "lg:hidden" : ""}>Đăng xuất</span></button>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={closeMobile} aria-label="Đóng menu" />}
      <div className={`min-h-screen transition-[padding] duration-300 lg:pl-[272px] ${collapsed ? "lg:pl-[88px]" : ""}`}>
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-[#f7f5f1]/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 lg:hidden" aria-label="Mở menu"><Menu className="h-5 w-5" /></button><button onClick={() => setCollapsed((value) => !value)} className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-orange-600 lg:block" aria-label="Thu gọn sidebar">{collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button><div className="hidden sm:block"><p className="text-xs font-medium text-slate-500">Wednesday, October 1, 2026</p><p className="text-sm font-bold text-slate-900">Chào buổi sáng, Phong</p></div></div>
          <div className="flex items-center gap-3"><span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">● System operational</span><button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:text-orange-600" aria-label="Thông báo"><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" /><Bell className="h-4 w-4" /></button></div>
        </header>
        <main className="mx-auto max-w-[1540px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}