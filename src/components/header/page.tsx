"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { logout } from "@/api/auth";
import { Role } from "@/interfaces/role";
import {
  Flag,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Calendar,
  Trophy,
  QrCode,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";

interface NavLink {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: string[]; // If undefined, visible to all
  authOnly?: boolean;
  guestOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Sự kiện", href: "/events", icon: Calendar },
  { label: "Kết quả", href: "/results", icon: Trophy },
  {
    label: "Đăng ký sự kiện",
    href: "/register-event",
  }
];

let cachedAuthRaw = "";
let cachedAuthState = {
  isLoggedIn: false,
  username: null as string | null,
  role: null as string | null,
};

function getAuthSnapshot() {
  const token = Cookies.get("access_token") || "";
  const username = Cookies.get("username") || "Racer";
  const rawRole = Cookies.get("role") || "";
  const role = rawRole ? rawRole.toUpperCase() : "";
  const raw = `${token}:${username}:${role}`;
  if (raw !== cachedAuthRaw) {
    cachedAuthRaw = raw;
    cachedAuthState = {
      isLoggedIn: Boolean(token),
      username: token ? username : null,
      role: token && role ? role : null,
    };
  }
  return cachedAuthState;
}

const SERVER_AUTH_SNAPSHOT = {
  isLoggedIn: false,
  username: null,
  role: null,
};

function subscribeAuth(callback: () => void) {
  window.addEventListener("focus", callback);
  return () => window.removeEventListener("focus", callback);
}

export default function Header() {
  const pathname = usePathname();
  const { isLoggedIn, username, role } = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    () => SERVER_AUTH_SNAPSHOT
  );

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const closeMenus = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  // Handle clicking outside user dropdown
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logout();
  };

  // Filter links based on user role and authentication status
  const visibleNavLinks = NAV_LINKS.filter((item) => {
    if (item.guestOnly && isLoggedIn) return false;
    if (item.authOnly && !isLoggedIn) return false;
    if (item.roles) {
      if (!isLoggedIn || !role) return false;
      return item.roles.includes(role);
    }
    return true;
  });

  const getRoleBadgeColor = (userRole: string | null) => {
    switch (userRole) {
      case Role.ADMIN:
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case Role.COORDINATOR:
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case Role.STAFF:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case Role.RUNNER:
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-500/25 transition-shadow group-hover:shadow-lg group-hover:shadow-orange-500/40">
            <Flag className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              RaceDay
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleNavLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenus}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Profile Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-full border border-border/80 bg-background/80 py-1.5 pl-2 pr-3 text-sm shadow-xs transition-all hover:bg-muted/60 hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                aria-expanded={userMenuOpen}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-xs font-bold text-white shadow-xs">
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-medium text-foreground max-w-[120px] truncate">
                    {username}
                  </span>
                </div>
                {role && (
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${getRoleBadgeColor(
                      role
                    )}`}
                  >
                    {role}
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95">
                  <div className="px-3 py-2 border-b border-border/60">
                    <p className="text-xs text-muted-foreground">Đã đăng nhập với</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {username}
                    </p>
                    {role && (
                      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground uppercase">
                        Vai trò: {role}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                      onClick={closeMenus}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Hồ sơ của tôi
                    </Link>

                    {role === Role.RUNNER && (
                      <Link
                        href="/register-event"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        onClick={closeMenus}
                      >
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        Tham gia giải chạy
                      </Link>
                    )}

                    {(role === Role.ADMIN || role === Role.COORDINATOR) && (
                      <Link
                        href="/event-admin"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        onClick={closeMenus}
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Bảng điều khiển sự kiện
                      </Link>
                    )}

                    {(role === Role.COORDINATOR || role === Role.STAFF) && (
                      <Link
                        href="/scan-qr"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        onClick={closeMenus}
                      >
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                        Quét QR Check-in
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => {
                        closeMenus();
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                onClick={closeMenus}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground hover:bg-muted/70"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={closeMenus}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all duration-200 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98]"
              >
                Đăng ký ngay
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {isLoggedIn && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-xs font-bold text-white shadow-xs">
              {username ? username.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-expanded={mobileMenuOpen}
            aria-label="Mở danh mục điều hướng"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          {isLoggedIn && (
            <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-sm font-bold text-white shadow-xs">
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {username}
                  </p>
                  <p className="text-xs text-muted-foreground">Đã đăng nhập</p>
                </div>
              </div>
              {role && (
                <span
                  className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase ${getRoleBadgeColor(
                    role
                  )}`}
                >
                  {role}
                </span>
              )}
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {visibleNavLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenus}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              );
            })}

            {isLoggedIn && (
              <Link
                href="/profile"
                onClick={closeMenus}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/profile"
                    ? "bg-orange-500/10 text-orange-600 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                <User className="h-4 w-4" />
                Hồ sơ của tôi
              </Link>
            )}
          </nav>

          <div className="pt-2 border-t border-border/60">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  closeMenus();
                  handleLogout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="flex w-full items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenus}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-transform hover:scale-[1.01]"
                >
                  Đăng ký ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
