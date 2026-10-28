"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "@/api/auth";
import { Role } from "@/interfaces/role";
import { mapAppRole } from "@/lib/role";
import { mediaDisplayUrl } from "@/lib/media-url";
import { DropdownMenu } from "radix-ui";
import { PAGE_SHELL } from "@/lib/page-shell";
import {
  Flag,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Calendar,
  Trophy,
  Camera,
  Award,
  CreditCard,
  Ticket,
  AlertTriangle,
  PlusCircle,
  LayoutDashboard,
  Wallet,
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
  { label: "Giải chạy", href: "/events", icon: Calendar },
  {
    label: "Tạo giải",
    href: "/events/create",
    icon: PlusCircle,
    authOnly: true,
  },
  { label: "Kết quả", href: "/results", icon: Trophy },
  { label: "Tìm ảnh", href: "/photos", icon: Camera },
];

function UserAvatarMark({
  username,
  avatarUrl,
  sizeClass = "h-7 w-7",
  textClass = "text-xs",
}: {
  username: string | null | undefined;
  avatarUrl: string | null;
  sizeClass?: string;
  textClass?: string;
}) {
  const src = avatarUrl ? mediaDisplayUrl(avatarUrl) : null;
  const letter = username ? username.charAt(0).toUpperCase() : "U";
  if (src) {
    return (
      <span
        className={`relative inline-flex ${sizeClass} overflow-hidden rounded-full border border-orange-500/30 bg-muted shadow-xs`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 ${textClass} font-bold text-white shadow-xs`}
    >
      {letter}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = Boolean(user);
  const username = user?.username;
  const role = user ? mapAppRole(user.roleName) : null;
  const avatarUrl = user?.avatarUrl || null;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenus = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-all">
      <div className={`${PAGE_SHELL} flex h-18 items-center justify-between gap-4`}>
        {/* Brand / Logo */}
        <Link
          href="/"
          aria-label="RaceDay — Trang chủ"
          className="group flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-md shadow-orange-500/25 transition-shadow group-hover:shadow-lg group-hover:shadow-orange-500/40">
            <Flag className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
              RaceDay
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Điều hướng chính" className="hidden lg:flex items-center gap-1">
          {visibleNavLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : link.href === "/events"
                  ? pathname === "/events" ||
                    /^\/events\/(?!create(?:\/|$))/.test(pathname)
                  : pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                onClick={closeMenus}
                className={`flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${
                  isActive
                    ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 font-semibold"
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
        <div className="hidden lg:flex items-center gap-3">
          {isLoggedIn ? (
            <DropdownMenu.Root open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <div className="relative">
              <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex min-h-11 items-center gap-2.5 rounded-full border border-border/80 bg-background/80 py-1.5 pl-2 pr-3 text-sm shadow-xs transition-colors hover:bg-muted/60 hover:border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                aria-expanded={userMenuOpen}
                aria-label={`Tài khoản ${username || "của tôi"}`}
              >
                <UserAvatarMark username={username} avatarUrl={avatarUrl} />
                <div className="flex flex-col items-start leading-tight">
                  <span className="font-medium text-foreground max-w-[120px] truncate">
                    {username}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              </DropdownMenu.Trigger>

              {/* User Dropdown Menu */}
              <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={10} asChild>
                <div className="z-[60] max-h-[var(--radix-dropdown-menu-content-available-height)] w-64 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl ring-1 ring-black/5 [&_a]:min-h-11 [&_a]:outline-none [&_a:focus]:bg-muted [&_button]:min-h-11">
                  <div className="px-3 py-2 border-b border-border/60">
                    <p className="text-xs text-muted-foreground">
                      Đã đăng nhập với
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {username}
                    </p>
                  </div>

                  <div className="py-1">
                    <DropdownMenu.Item asChild><Link
                      href="/profile"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                      onClick={closeMenus}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Hồ sơ của tôi
                    </Link></DropdownMenu.Item>

                    {isLoggedIn && (
                      <>
                        <DropdownMenu.Item asChild><Link
                          href="/my-registrations"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                          onClick={closeMenus}
                        >
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          Vé của tôi
                        </Link></DropdownMenu.Item>
                        <DropdownMenu.Item asChild><Link
                          href="/payments"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                          onClick={closeMenus}
                        >
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          Thanh toán
                        </Link></DropdownMenu.Item>
                        <DropdownMenu.Item asChild><Link
                          href="/certificates"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                          onClick={closeMenus}
                        >
                          <Award className="h-4 w-4 text-muted-foreground" />
                          Chứng nhận
                        </Link></DropdownMenu.Item>
                        <DropdownMenu.Item asChild><Link
                          href="/disputes"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                          onClick={closeMenus}
                        >
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                          Khiếu nại
                        </Link></DropdownMenu.Item>
                        <DropdownMenu.Item asChild><Link
                          href="/registered-events"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                          onClick={closeMenus}
                        >
                          <Flag className="h-4 w-4 text-muted-foreground" />
                          Giải đã đăng ký
                        </Link></DropdownMenu.Item>
                      </>
                    )}

                    {isLoggedIn && role === Role.ORGANIZER && (
                      <>
                        <DropdownMenu.Item asChild><Link
                          href="/my-events"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                          onClick={closeMenus}
                        >
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          Quản lý giải của tôi
                        </Link></DropdownMenu.Item>
                        <DropdownMenu.Item asChild><Link
                          href="/wallet"
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                          onClick={closeMenus}
                        >
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          Ví & giải ngân
                        </Link></DropdownMenu.Item>
                      </>
                    )}
                  </div>

                  <div className="pt-1 border-t border-border/60">
                    <DropdownMenu.Item asChild><button
                      type="button"
                      onClick={() => {
                        closeMenus();
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button></DropdownMenu.Item>
                  </div>
                </div>
              </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </div>
            </DropdownMenu.Root>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                onClick={closeMenus}
                className="inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-orange-600"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={closeMenus}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-orange-700 to-red-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              >
                Đăng ký ngay
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-2">
          {isLoggedIn && (
            <UserAvatarMark
              username={username}
              avatarUrl={avatarUrl}
              sizeClass="h-8 w-8"
            />
          )}
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-orange-600"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? "Đóng danh mục điều hướng" : "Mở danh mục điều hướng"}
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
        <div id="mobile-navigation" className="lg:hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-border/60 bg-background/95 px-4 pt-3 pb-6 backdrop-blur-xl space-y-4 animate-in slide-in-from-top-4 duration-200 [&_a]:min-h-11 [&_button]:min-h-11">
          {isLoggedIn && (
            <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatarMark
                  username={username}
                  avatarUrl={avatarUrl}
                  sizeClass="h-9 w-9"
                  textClass="text-sm"
                />
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-foreground">
                    {username}
                  </p>
                  <p className="text-xs text-muted-foreground">Đã đăng nhập</p>
                </div>
              </div>
            </div>
          )}

          <nav aria-label="Điều hướng trên di động" className="flex flex-col gap-1">
            {visibleNavLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : link.href === "/events"
                    ? pathname === "/events" ||
                      /^\/events\/(?!create(?:\/|$))/.test(pathname)
                    : pathname === link.href ||
                      pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeMenus}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              );
            })}

            {isLoggedIn && (
              <>
                <Link
                  href="/profile"
                  onClick={closeMenus}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/profile"
                      ? "bg-orange-500/10 text-orange-700 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  <User className="h-4 w-4" />
                  Hồ sơ của tôi
                </Link>
                <>
                  <Link
                    href="/my-registrations"
                    onClick={closeMenus}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/my-registrations")
                        ? "bg-orange-500/10 text-orange-700 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <Ticket className="h-4 w-4" />
                    Vé của tôi
                  </Link>
                  <Link
                    href="/payments"
                    onClick={closeMenus}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/payments")
                        ? "bg-orange-500/10 text-orange-700 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    Thanh toán
                  </Link>
                  <Link
                    href="/certificates"
                    onClick={closeMenus}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/certificates")
                        ? "bg-orange-500/10 text-orange-700 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <Award className="h-4 w-4" />
                    Chứng nhận
                  </Link>
                  <Link
                    href="/disputes"
                    onClick={closeMenus}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/disputes")
                        ? "bg-orange-500/10 text-orange-700 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    Khiếu nại
                  </Link>
                  <Link
                    href="/registered-events"
                    onClick={closeMenus}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/registered-events")
                        ? "bg-orange-500/10 text-orange-700 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    Giải đã đăng ký
                  </Link>
                </>
                {role === Role.ORGANIZER && (
                  <>
                    <Link
                      href="/my-events"
                      onClick={closeMenus}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/my-events")
                        ? "bg-orange-500/10 text-orange-700 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                    >
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      Quản lý giải của tôi
                    </Link>
                    <Link
                      href="/wallet"
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith("/wallet")
                        ? "bg-orange-500/10 text-orange-700 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    }`}
                      onClick={closeMenus}
                    >
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      Ví & giải ngân
                    </Link>
                  </>
                )}
              </>
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
