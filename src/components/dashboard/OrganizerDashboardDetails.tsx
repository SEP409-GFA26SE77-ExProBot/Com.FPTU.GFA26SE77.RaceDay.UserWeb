"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { exportOrganizerDashboard, getOrganizerDashboard } from "@/api/dashboard";
import { FINANCE_USE_MOCK } from "@/api/finance";
import { useDashboardResource } from "@/hooks/useDashboardResource";
import { PAGE_SHELL } from "@/lib/page-shell";
import { numberLabel, rangeError, recentRange, type DateRange } from "@/lib/dashboard";
import { DateFilter, Panel, RefreshButton, ResourceState, Updated } from "./DashboardUI";
import DashboardExport from "./DashboardExport";
import PendingTasks from "./PendingTasks";
import RevenuePanel from "./RevenuePanel";

function DetailHeader({ title, back = "/my-events" }: { title: string; back?: string }) {
  return <header className="space-y-3">
    <Link href={back} className="inline-flex min-h-11 items-center text-sm font-semibold text-orange-700 hover:underline focus-visible:outline-2 focus-visible:outline-orange-600">← Quay lại Dashboard</Link>
    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
  </header>;
}

export function OrganizerRevenueDetails() {
  const params = useSearchParams();
  const [range, setRange] = useState(() => {
    const query = { from: params.get("from") ?? "", to: params.get("to") ?? "" };
    return rangeError(query) ? recentRange() : query;
  });
  const [refresh, setRefresh] = useState(0);
  const query = `from=${range.from}&to=${range.to}`;
  function changeRange(next: DateRange) {
    setRange(next);
    window.history.replaceState(null, "", `/my-events/revenue?from=${next.from}&to=${next.to}`);
  }
  return <div className={`${PAGE_SHELL} space-y-5 py-6`}>
    <DetailHeader title="Chi tiết dòng tiền" back={`/my-events?tab=dashboard&${query}`} />
    <DateFilter value={range} onChange={changeRange} />
    <div className="flex flex-wrap items-start justify-between gap-3">
      <RefreshButton onClick={() => setRefresh((value) => value + 1)} />
      <DashboardExport key={query} range={range} download={(format) => exportOrganizerDashboard(range, format)} disabled={FINANCE_USE_MOCK} />
    </div>
    {FINANCE_USE_MOCK && <p className="text-sm text-muted-foreground">Tài chính đang dùng dữ liệu mô phỏng; chưa hỗ trợ xuất báo cáo.</p>}
    <RevenuePanel range={range} refresh={refresh} />
  </div>;
}

export function OrganizerTaskDetails() {
  const dashboard = useDashboardResource(getOrganizerDashboard);
  return <div className={`${PAGE_SHELL} space-y-5 py-6`}>
    <DetailHeader title="Việc cần xử lý" />
    <p className="text-sm text-muted-foreground">Toàn bộ giải có đăng ký hoặc khiếu nại đang chờ, ưu tiên giải có nhiều việc nhất. Không phụ thuộc bộ lọc ngày của dòng tiền.</p>
    <RefreshButton onClick={dashboard.reload} />
    <ResourceState loading={dashboard.loading} error={dashboard.error} retry={dashboard.reload} />
    {dashboard.data && <>
      <Panel title={`${numberLabel(dashboard.data.eventsWithPendingTasks.length)} giải có việc chờ`}>
        <PendingTasks events={dashboard.data.eventsWithPendingTasks} />
      </Panel>
      <Updated at={dashboard.data.generatedAtUtc} />
    </>}
  </div>;
}
