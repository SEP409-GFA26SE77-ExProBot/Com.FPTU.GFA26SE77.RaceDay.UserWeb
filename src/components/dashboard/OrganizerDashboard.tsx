"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { exportOrganizerDashboard, getOrganizerDashboard } from "@/api/dashboard";
import { FINANCE_USE_MOCK, getOrganizerWallet } from "@/api/finance";
import { useDashboardResource } from "@/hooks/useDashboardResource";
import { dateLabel, moneyLabel, numberLabel, rangeError, recentRange, type DateRange } from "@/lib/dashboard";
import { groupedDashboardStatuses } from "@/lib/dashboard-labels";
import { DateFilter, Metric, Panel, RefreshButton, ResourceState, Updated } from "./DashboardUI";
import RevenuePanel from "./RevenuePanel";
import DashboardExport from "./DashboardExport";
import PendingTasks from "./PendingTasks";

const detailLink = "inline-flex min-h-11 items-center text-sm font-semibold text-orange-700 hover:underline focus-visible:outline-2 focus-visible:outline-orange-600";
const statusColors = ["bg-orange-500", "bg-amber-500", "bg-sky-600", "bg-violet-500", "bg-emerald-600", "bg-rose-600"];

export default function OrganizerDashboard() {
  const params = useSearchParams();
  const dashboard = useDashboardResource(getOrganizerDashboard);
  const wallet = useDashboardResource(getOrganizerWallet);
  const [range, setRange] = useState(() => {
    const query = { from: params.get("from") ?? "", to: params.get("to") ?? "" };
    return rangeError(query) ? recentRange() : query;
  });
  const [refresh, setRefresh] = useState(0);
  const data = dashboard.data;
  const statuses = groupedDashboardStatuses(data?.eventsByStatus ?? [], "event");
  const total = statuses.reduce((sum, item) => sum + item.count, 0);
  function changeRange(next: DateRange) {
    setRange(next);
    const query = new URLSearchParams(params.toString());
    query.set("from", next.from);
    query.set("to", next.to);
    window.history.replaceState(null, "", `/my-events?${query.toString()}`);
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-border bg-card p-3">
        <DateFilter compact value={range} onChange={changeRange} />
        <div className="flex flex-wrap items-start gap-2">
          <RefreshButton onClick={() => { dashboard.reload(); wallet.reload(); setRefresh((value) => value + 1); }} />
          <DashboardExport compact key={range.from + range.to} range={range} download={(format) => exportOrganizerDashboard(range, format)} disabled={!data || dashboard.loading || FINANCE_USE_MOCK} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Dòng tiền: {dateLabel(range.from)} – {dateLabel(range.to)} (UTC+7). Các chỉ số và ví là số liệu hiện tại.{FINANCE_USE_MOCK && " Tài chính đang mô phỏng; chưa hỗ trợ xuất báo cáo."}</p>
      <ResourceState loading={dashboard.loading} error={dashboard.error} retry={dashboard.reload} />
      {data && <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Tổng giải", value: data.totalEvents, href: "/my-events?tab=events&filter=all" },
            { label: "Giải mở đăng ký", value: data.eventsByStatus.find((item) => item.status === "registration-open")?.count ?? 0, href: "/my-events?tab=events&filter=registration-open" },
            { label: "Đăng ký chờ duyệt", value: data.pendingRegistrations, href: "/my-events/tasks" },
            { label: "Khiếu nại chờ xử lý", value: data.pendingComplaints, href: "/organizer/disputes" },
          ].map((item) => <Link key={item.label} href={item.href} scroll={false} className="rounded-2xl transition-colors hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-orange-600"><Metric compact label={item.label} value={item.value} /></Link>)}
        </div>
        {data.totalEvents === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Bắt đầu giải chạy đầu tiên bằng nút <Link href="/events/create" className={detailLink}>Tạo giải mới</Link>.</p>}
      </>}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <RevenuePanel compact range={range} refresh={refresh} />
        <Panel compact title="Việc cần xử lý" action={<Link href="/my-events/tasks" className={detailLink}>Xem tất cả →</Link>}>
          {data ? <PendingTasks events={data.eventsWithPendingTasks} limit={5} /> : <p className="text-sm text-muted-foreground">{dashboard.loading ? "Đang tải công việc…" : "Chưa tải được công việc."}</p>}
        </Panel>
        <Panel compact title="Ví ban tổ chức" action={<Link href="/wallet" className={detailLink}>Mở ví →</Link>}>
          <ResourceState loading={wallet.loading} error={wallet.error} retry={wallet.reload} />
          {wallet.data && <dl className="grid grid-cols-3 gap-3">
            {[
              { label: "Có thể rút", value: wallet.data.availableBalance },
              { label: "Giữ ký quỹ", value: wallet.data.pendingEscrow },
              { label: "Đã rút", value: wallet.data.withdrawnTotal },
            ].map((item) => <div key={item.label} className="min-w-0"><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className="mt-1 break-words text-base font-bold tabular-nums sm:text-xl">{moneyLabel(item.value, wallet.data!.currency)}</dd></div>)}
          </dl>}
        </Panel>
        <Panel compact title="Trạng thái các giải" action={<Link href="/my-events?tab=events&filter=all" scroll={false} className={detailLink}>Xem danh sách →</Link>}>
          {statuses.length ? <>
            <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">{statuses.map((item, index) => <div key={item.label} className={statusColors[index % statusColors.length]} style={{ width: `${item.count / total * 100}%` }} />)}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">{statuses.map((item, index) => <div key={item.label} className="flex min-w-0 items-start justify-between gap-2"><dt className="flex min-w-0 items-start gap-1.5"><span aria-hidden="true" className={`mt-1 h-2 w-2 shrink-0 rounded-full ${statusColors[index % statusColors.length]}`} />{item.label}</dt><dd className="font-bold tabular-nums">{numberLabel(item.count)}</dd></div>)}</dl>
          </> : <p className="text-sm text-muted-foreground">{data ? "Chưa có giải nào." : "Chưa tải được trạng thái."}</p>}
        </Panel>
      </div>
      {data && <Updated at={data.generatedAtUtc} />}
    </div>
  );
}
