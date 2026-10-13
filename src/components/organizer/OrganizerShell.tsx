"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { logout } from "@/api/auth";
import { getEventById } from "@/api/events";
import { getPackagePurchase } from "@/api/event-packages";
import { mapAppRole } from "@/lib/role";
import { Role } from "@/interfaces/role";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Flag,
  FolderOpen,
  LayoutDashboard,
  Map,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  History,
  Ticket,
  User,
  Users,
  Wallet,
  X,
  Route,
  ScrollText,
  ClipboardList,
  Building2,
  PackagePlus,
  Boxes,
} from "lucide-react";

function eventIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/organizer\/events\/([^/]+)/);
  if (!match) return null;
  const id = match[1];
  if (!id || id === "register") return null;
  return id;
}

type NavLeaf = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  matchPath?: string;
  tab?: "approvals";
};

type NavGroup = {
  heading: string;
  items: NavLeaf[];
};

function eventWorkspaceGroups(eventId: string): NavGroup[] {
  const base = `/organizer/events/${eventId}`;
  return [
    {
      heading: "Vận hành",
      items: [
        {
          label: "Tổng quan",
          href: base,
          icon: LayoutDashboard,
        },
        {
          label: "Xét mở chính thức",
          href: `${base}/profile/open-registration`,
          icon: ClipboardList,
          matchPath: `${base}/profile/open-registration`,
        },
        {
          label: "Duyệt đăng ký",
          href: `${base}?tab=approvals`,
          icon: ClipboardCheck,
          tab: "approvals",
        },
        {
          label: "Thiết lập bản đồ",
          href: `${base}/setup-map`,
          icon: Map,
          matchPath: `${base}/setup-map`,
        },
        {
          label: "Giả lập đua",
          href: `${base}/race-simulation`,
          icon: Flag,
          matchPath: `${base}/race-simulation`,
        },
        {
          label: "Quản lý nhân sự",
          href: `${base}/staff`,
          icon: Users,
          matchPath: `${base}/staff`,
        },
      ],
    },
    {
      heading: "Tài chính",
      items: [
        {
          label: "Ví & giải ngân",
          href: `${base}/wallet`,
          icon: Wallet,
          matchPath: `${base}/wallet`,
        },
        {
          label: "Lịch sử giải ngân",
          href: `${base}/payout-history`,
          icon: History,
          matchPath: `${base}/payout-history`,
        },
      ],
    },
    {
      heading: "Chi tiết giải",
      items: [
        {
          label: "Thông tin cơ bản",
          href: `${base}/profile/basic`,
          icon: Building2,
          matchPath: `${base}/profile/basic`,
        },
        {
          label: "Cự ly & giá vé",
          href: `${base}/profile/distances`,
          icon: Route,
          matchPath: `${base}/profile/distances`,
        },
        {
          label: "Giấy phép & tài liệu",
          href: `${base}/profile/documents`,
          icon: FolderOpen,
          matchPath: `${base}/profile/documents`,
        },
        {
          label: "Quản lý nội dung",
          href: `${base}/profile/content`,
          icon: ScrollText,
          matchPath: `${base}/profile/content`,
        },
        {
          label: "Vật phẩm tiếp tế",
          href: `${base}/profile/supplies`,
          icon: Boxes,
          matchPath: `${base}/profile/supplies`,
        },
        {
          label: "Bổ sung",
          href: `${base}/profile/addition`,
          icon: PackagePlus,
          matchPath: `${base}/profile/addition`,
        },
      ],
    },
  ];
}

function useLoggedInUser() {
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

function leafActive(
  item: NavLeaf,
  pathname: string,
  eventId: string | null,
  activeTab: string | null
) {
  const isApprovals = item.tab === "approvals";
  const matchPath = item.matchPath ?? null;
  const onEventHome =
    Boolean(eventId) &&
    (pathname === `/organizer/events/${eventId}` ||
      pathname === `/organizer/events/${eventId}/`);

  if (matchPath) {
    return pathname === matchPath || pathname.startsWith(`${matchPath}/`);
  }
  if (isApprovals) {
    return onEventHome && activeTab === "approvals";
  }
  return onEventHome && activeTab !== "approvals";
}

export default function OrganizerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [eventName, setEventName] = useState<string | null>(null);
  const [packageExpiresAtUtc, setPackageExpiresAtUtc] = useState<string | null>(
    null
  );
  const [packageTitle, setPackageTitle] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Vận hành": true,
    "Tài chính": true,
    "Chi tiết giải": true,
  });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { username, role, initial } = useLoggedInUser();
  const eventId = useMemo(() => eventIdFromPath(pathname), [pathname]);
  const groups = useMemo(
    () => (eventId ? eventWorkspaceGroups(eventId) : []),
    [eventId]
  );
  const activeTab = searchParams.get("tab");

  const isMapWorkspace =
    !!eventId &&
    (/\/(setup-map|race-simulation|staff|wallet|payout-history|profile)(\/|$)/.test(
      pathname
    ));

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
      setPackageExpiresAtUtc(null);
      setPackageTitle(null);
      return;
    }
    let cancelled = false;
    setEventName(null);
    setPackageExpiresAtUtc(null);
    setPackageTitle(null);
    (async () => {
      try {
        const event = await getEventById(eventId);
        if (cancelled) return;
        setEventName(event.name || null);
        setPackageExpiresAtUtc(event.packageExpiresAtUtc || null);

        if (event.packagePurchaseId) {
          try {
            const purchase = await getPackagePurchase(event.packagePurchaseId);
            if (cancelled) return;
            const months = purchase.durationMonths;
            const cap = purchase.participantCap;
            setPackageTitle(
              `Gói ${months} tháng · ${cap.toLocaleString("vi-VN")} VĐV`
            );
          } catch {
            // Fallback: chỉ biết quy mô từ event
            if (event.totalRunners) {
              setPackageTitle(
                `Gói · ${event.totalRunners.toLocaleString("vi-VN")} VĐV`
              );
            }
          }
        } else if (event.totalRunners) {
          setPackageTitle(
            `Quy mô ${event.totalRunners.toLocaleString("vi-VN")} VĐV`
          );
        }
      } catch {
        if (!cancelled) {
          setEventName(null);
          setPackageExpiresAtUtc(null);
          setPackageTitle(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const packageLabel = useMemo(() => {
    const parts: string[] = [];
    if (packageTitle) parts.push(packageTitle);

    if (packageExpiresAtUtc) {
      const end = new Date(packageExpiresAtUtc);
      if (!Number.isNaN(end.getTime())) {
        const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const today = new Date();
        const todayDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const diffDays = Math.ceil(
          (endDay.getTime() - todayDay.getTime()) / (24 * 60 * 60 * 1000)
        );
        const endLabel = end.toLocaleDateString("vi-VN");
        if (diffDays < 0) {
          parts.push(`đã hết hạn ${endLabel}`);
        } else if (diffDays === 0) {
          parts.push(`hết hạn hôm nay (${endLabel})`);
        } else {
          parts.push(`còn ${diffDays} ngày · kết thúc ${endLabel}`);
        }
      }
    }

    return parts.length ? parts.join(" · ") : null;
  }, [packageExpiresAtUtc, packageTitle]);

  const linkClass = (active: boolean) =>
    `group flex items-center rounded-xl text-sm font-medium transition-colors ${active
      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-950/20"
      : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
    } ${collapsed
      ? "gap-3 px-3 py-3 lg:justify-center lg:px-0 lg:py-3"
      : "gap-3 px-3 py-2.5"
    }`;

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#121827] text-white shadow-2xl shadow-slate-950/10 transition-[width,transform] duration-300 lg:translate-x-0 ${collapsed ? "w-[272px] lg:w-[72px]" : "w-[272px]"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex h-20 items-center border-b border-white/10 ${collapsed ? "justify-between px-5 lg:justify-center lg:px-0" : "justify-between px-5"
            }`}
        >
          <Link
            href="/"
            onClick={closeMobile}
            className={`flex items-center overflow-hidden ${collapsed ? "gap-0 lg:justify-center" : "gap-3"
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
          className={`flex-1 space-y-4 overflow-y-auto py-5 ${collapsed ? "px-3 lg:px-2" : "px-3"
            }`}
        >
          {groups.map((group) => {
            const isOpen = openGroups[group.heading] !== false;
            const groupExpanded = isOpen || collapsed;
            return (
              <div key={group.heading} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      setOpenGroups((prev) => ({
                        ...prev,
                        [group.heading]: true,
                      }));
                    } else {
                      setOpenGroups((prev) => ({
                        ...prev,
                        [group.heading]: !isOpen,
                      }));
                    }
                  }}
                  className={`flex w-full items-center gap-1 px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-300 ${collapsed ? "lg:justify-center lg:px-0" : ""
                    }`}
                  title={isOpen ? `Thu gọn ${group.heading}` : `Mở ${group.heading}`}
                >
                  <span className={collapsed ? "lg:hidden" : ""}>
                    {group.heading}
                  </span>
                  <span className={collapsed ? "lg:hidden" : ""}>
                    {isOpen ? (
                      <ChevronDown className="h-3 w-3 opacity-80" />
                    ) : (
                      <ChevronRight className="h-3 w-3 opacity-80" />
                    )}
                  </span>
                </button>
                {groupExpanded &&
                  group.items.map((leaf) => {
                    const active = leafActive(
                      leaf,
                      pathname,
                      eventId,
                      activeTab
                    );
                    const Icon = leaf.icon;
                    return (
                      <Link
                        key={leaf.href}
                        href={leaf.href}
                        onClick={closeMobile}
                        title={collapsed ? leaf.label : undefined}
                        className={linkClass(active)}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className={collapsed ? "lg:hidden" : ""}>
                          {leaf.label}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        <div
          className={`mt-auto border-t border-white/10 py-3 ${collapsed ? "px-3 lg:px-2" : "px-3"
            }`}
        >
          <Link
            href="/my-events"
            onClick={closeMobile}
            title={collapsed ? "Quay về quản lý giải" : undefined}
            className={`flex items-center rounded-xl text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white ${collapsed
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
        className={`min-h-screen transition-[padding] duration-300 ${collapsed ? "lg:pl-[72px]" : "lg:pl-[272px]"
          }`}
      >
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-[#f7f5f1]/90 px-5 backdrop-blur-md sm:px-8">
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
            <div className="min-w-0 max-w-[min(100%,44rem)] overflow-hidden rounded-xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-white to-white px-3 py-1.5 shadow-sm shadow-orange-500/5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                Quản lý giải
              </p>
              <p className="flex min-w-0 items-baseline gap-2 truncate text-sm">
                <span className="shrink-0 font-bold tracking-tight text-slate-900">
                  {eventName || "Chọn giải để quản lý"}
                </span>
                {packageLabel && (
                  <span
                    className={`min-w-0 truncate text-[11px] font-medium ${packageLabel.includes("hết hạn")
                        ? "text-red-600"
                        : "text-slate-500"
                      }`}
                    title={packageLabel}
                  >
                    · {packageLabel}
                  </span>
                )}
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
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
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
          className={`mx-auto max-w-[1540px] ${isMapWorkspace
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
