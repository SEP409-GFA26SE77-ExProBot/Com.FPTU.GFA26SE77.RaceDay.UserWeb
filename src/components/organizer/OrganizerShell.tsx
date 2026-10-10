"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { logout } from "@/api/auth";
import { getEventById } from "@/api/events";
import { mapAppRole } from "@/lib/role";
import { Role } from "@/interfaces/role";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  Flag,
  LayoutDashboard,
  Map,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Ticket,
  User,
  X,
} from "lucide-react";

function eventIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/organizer\/events\/([^/]+)/);
  if (!match) return null;
  const id = match[1];
  if (!id || id === "register") return null;
  return id;
}

/** Chỉ nav theo event đang mở — không lộ URL portal /organizer/approvals, … */
function eventWorkspaceNav(eventId: string) {
  return [
    {
      label: "Tổng quan",
      href: `/organizer/events/${eventId}`,
      icon: LayoutDashboard,
    },
    {
      label: "Duyệt đăng ký",
      href: `/organizer/events/${eventId}?tab=approvals`,
      icon: ClipboardCheck,
      tab: "approvals" as const,
    },
    {
      label: "Thiết lập bản đồ",
      href: `/organizer/events/${eventId}/setup-map`,
      icon: Map,
      matchPath: `/organizer/events/${eventId}/setup-map`,
    },
    {
      label: "Giả lập đua",
      href: `/organizer/events/${eventId}/race-simulation`,
      icon: Flag,
      matchPath: `/organizer/events/${eventId}/race-simulation`,
    },
  ];
}

function useLoggedInUser() {
  // Cookie chỉ có trên client — đọc sau mount để tránh hydration mismatch (U vs T)
  const [user, setUser] = useState({
    username: "User",
    role: Role.RUNNER as string,
    initial: "U",
  });

  useEffect(() => {
    const username = Cookies.get("username") || "User";
    const rawRole = Cookies.get("role") || "";
    const role = mapAppRole(rawRole || Role.RUNNER);
    setUser({
      username,
      role,
      initial: username.charAt(0).toUpperCase() || "U",
    });
  }, []);

  return user;
}

export default function OrganizerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [eventName, setEventName] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { username, role, initial } = useLoggedInUser();
  const eventId = useMemo(() => eventIdFromPath(pathname), [pathname]);
  const navigation = useMemo(
    () => (eventId ? eventWorkspaceNav(eventId) : []),
    [eventId]
  );
  const activeTab = searchParams.get("tab");
  const isMapWorkspace =
    !!eventId &&
    (/\/setup-map\/?$/.test(pathname) || /\/race-simulation\/?$/.test(pathname));

  const closeMobile = () => setMobileOpen(false);
  const closeUserMenu = () => setUserMenuOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!eventId) {
      setEventName(null);
      return;
    }
    let cancelled = false;
    setEventName(null);
    getEventById(eventId)
      .then((event) => {
        if (!cancelled) setEventName(event.name || null);
      })
      .catch(() => {
        if (!cancelled) setEventName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#121827] text-white shadow-2xl shadow-slate-950/10 transition-[width,transform] duration-300 lg:translate-x-0 ${
          collapsed ? "w-[272px] lg:w-[72px]" : "w-[272px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex h-20 items-center border-b border-white/10 ${
            collapsed ? "justify-between px-5 lg:justify-center lg:px-0" : "justify-between px-5"
          }`}
        >
          <Link
            href="/"
            onClick={closeMobile}
            className={`flex items-center overflow-hidden ${
              collapsed ? "gap-0 lg:justify-center" : "gap-3"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-600 shadow-lg shadow-orange-500/25">
              <Flag className="h-5 w-5" />
            </span>
            <span
              className={`${collapsed ? "lg:hidden" : ""} whitespace-nowrap text-lg font-black tracking-tight`}
            >
              RaceDay
            </span>
          </Link>
          <button
            onClick={closeMobile}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav
          className={`flex-1 space-y-1 overflow-y-auto py-5 ${
            collapsed ? "px-3 lg:px-2" : "px-3"
          }`}
        >
          <p
            className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            Không gian làm việc
          </p>
          {navigation.map((item) => {
            const isApprovals = "tab" in item && item.tab === "approvals";
            const matchPath =
              "matchPath" in item && typeof item.matchPath === "string"
                ? item.matchPath
                : null;
            const onEventHome =
              Boolean(eventId) &&
              (pathname === `/organizer/events/${eventId}` ||
                pathname === `/organizer/events/${eventId}/`);

            let active = false;
            if (matchPath) {
              // Setup map / Race simulation — exact prefix của sub-route
              active = pathname === matchPath || pathname.startsWith(`${matchPath}/`);
            } else if (isApprovals) {
              active = onEventHome && activeTab === "approvals";
            } else {
              // Tổng quan — chỉ đúng trang event, không ăn nhầm /setup-map|/race-simulation
              active = onEventHome && activeTab !== "approvals";
            }
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-950/20"
                    : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
                } ${
                  collapsed
                    ? "gap-3 px-3 py-3 lg:justify-center lg:px-0 lg:py-3"
                    : "gap-3 px-3 py-3"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className={`mt-auto border-t border-white/10 py-3 ${
            collapsed ? "px-3 lg:px-2" : "px-3"
          }`}
        >
          <Link
            href="/my-events"
            onClick={closeMobile}
            title={collapsed ? "Quay về quản lý giải" : undefined}
            className={`flex items-center rounded-xl text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white ${
              collapsed
                ? "gap-3 px-3 py-3 lg:justify-center lg:px-0"
                : "gap-3 px-3 py-3"
            }`}
          >
            <ArrowLeft className="h-[18px] w-[18px] shrink-0 text-orange-400" />
            <span className={collapsed ? "lg:hidden" : ""}>
              Quay về quản lý giải
            </span>
          </Link>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={closeMobile}
          aria-label="Đóng menu"
        />
      )}
      <div
        className={`min-h-screen transition-[padding] duration-300 ${
          collapsed ? "lg:pl-[72px]" : "lg:pl-[272px]"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-[#f7f5f1]/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCollapsed((value) => !value)}
              className="hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:text-orange-600 lg:block"
              aria-label="Thu gọn sidebar"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
            <div className="min-w-0 max-w-[min(100%,32rem)] overflow-hidden rounded-xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-white to-white px-3 py-1.5 shadow-sm shadow-orange-500/5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                Quản lý giải
              </p>
              <p className="truncate text-sm font-bold tracking-tight text-slate-900">
                {eventName || "Chọn giải để quản lý"}
              </p>
            </div>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-sm shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-expanded={userMenuOpen}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-xs font-bold text-white shadow-xs">
                {initial}
              </div>
              <span className="hidden max-w-[120px] truncate font-medium text-slate-900 sm:inline">
                {username}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-xs text-slate-500">Đã đăng nhập với</p>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {username}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                    onClick={closeUserMenu}
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    Hồ sơ của tôi
                  </Link>

                  {role === Role.RUNNER && (
                    <>
                      <Link
                        href="/my-registrations"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                        onClick={closeUserMenu}
                      >
                        <Ticket className="h-4 w-4 text-slate-400" />
                        Vé của tôi
                      </Link>
                      <Link
                        href="/payments"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                        onClick={closeUserMenu}
                      >
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        Thanh toán
                      </Link>
                      <Link
                        href="/certificates"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                        onClick={closeUserMenu}
                      >
                        <Award className="h-4 w-4 text-slate-400" />
                        Chứng nhận
                      </Link>
                      <Link
                        href="/disputes"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                        onClick={closeUserMenu}
                      >
                        <AlertTriangle className="h-4 w-4 text-slate-400" />
                        Khiếu nại
                      </Link>
                      <Link
                        href="/registered-events"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                        onClick={closeUserMenu}
                      >
                        <Flag className="h-4 w-4 text-slate-400" />
                        Giải đã đăng ký
                      </Link>
                    </>
                  )}

                  <Link
                    href="/my-events"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                    onClick={closeUserMenu}
                  >
                    <LayoutDashboard className="h-4 w-4 text-slate-400" />
                    Quản lý giải của tôi
                  </Link>

                  {(role === Role.ADMIN || role === Role.COORDINATOR) && (
                    <Link
                      href="/event-admin"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                      onClick={closeUserMenu}
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-400" />
                      Bảng điều khiển sự kiện
                    </Link>
                  )}

                  {(role === Role.COORDINATOR ||
                    role === Role.STAFF ||
                    role === Role.ADMIN) && (
                    <Link
                      href="/scan-qr"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                      onClick={closeUserMenu}
                    >
                      <QrCode className="h-4 w-4 text-slate-400" />
                      Quét QR Check-in
                    </Link>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      closeUserMenu();
                      void logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
        <main
          className={`mx-auto max-w-[1540px] ${
            isMapWorkspace
              ? "px-5 pb-4 pt-3 sm:px-8 sm:pb-5 sm:pt-4"
              : "p-5 sm:p-8"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
