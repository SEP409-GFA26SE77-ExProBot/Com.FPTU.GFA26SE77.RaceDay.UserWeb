import Link from "next/link";
import { Flag, MapPin } from "lucide-react";
import { requireServerUser } from "@/lib/require-server-user";
import StaffAccountMenu from "@/components/staff/StaffAccountMenu";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireServerUser(["RACE-STAFF"]);
  return (
    <div className="min-h-screen bg-[#f7f5f1] text-foreground">
      <a href="#staff-main" className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-3">Đi tới nội dung</a>
      <header className="border-b border-border bg-[#121827] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/staff" className="flex min-h-11 items-center gap-3 font-bold">
            <Flag className="h-7 w-7 text-orange-400" />
            <span>RaceDay <span className="ml-2 text-xs font-normal text-slate-300">Nhân sự giải chạy</span></span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/staff" className="inline-flex min-h-11 items-center gap-2"><MapPin className="h-4 w-4" />Phân công</Link>
            <StaffAccountMenu name={user.fullName || user.username} />
          </div>
        </div>
      </header>
      <main id="staff-main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
