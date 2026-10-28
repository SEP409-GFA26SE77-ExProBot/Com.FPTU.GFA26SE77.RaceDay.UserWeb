"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, CreditCard, Flag, Ticket, User } from "lucide-react";
import { Card } from "@/components/ui/card";

const accountLinks = [
  { href: "/profile", label: "Hồ sơ", icon: User },
  { href: "/my-registrations", label: "Vé của tôi", icon: Ticket },
  { href: "/registered-events", label: "Giải đã đăng ký", icon: Flag },
  { href: "/payments", label: "Thanh toán", icon: CreditCard },
  { href: "/certificates", label: "Chứng nhận", icon: Award },
];

export default function RunnerPageHeader({ title, description, actions }: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Card className="mb-6 overflow-hidden rounded-2xl shadow-sm">
      <div className="flex flex-col gap-5 bg-gradient-to-br from-orange-50/80 via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-700">Không gian của bạn</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      <nav aria-label="Tài khoản cá nhân" className="flex flex-wrap gap-1 border-t border-border/70 p-2 sm:px-4">
        {accountLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${active ? "bg-orange-50 text-orange-800" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </Card>
  );
}
