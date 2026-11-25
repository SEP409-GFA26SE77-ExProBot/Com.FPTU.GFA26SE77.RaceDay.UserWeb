import type { DashboardCount } from "@/dto/dashboard.dto";
import { dashboardStatusLabel, groupedDashboardStatuses } from "@/lib/dashboard-labels";
import { Distribution } from "./DashboardUI";

export default function StatusBreakdown({ items, kind }: {
  items: DashboardCount[];
  kind: "event" | "registration" | "race";
}) {
  const all = items.map((item) => ({ label: dashboardStatusLabel(item.status), count: item.count }));
  const visible = kind === "race" ? all.filter((item) => item.count > 0) : groupedDashboardStatuses(items, kind);
  const attention = kind === "event" ? items.filter((item) => ["rejected", "suspended", "cancelled"].includes(item.status) && item.count > 0) : [];
  return (
    <div className="space-y-4">
      {visible.length ? <Distribution items={visible} /> : <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>}
      {attention.length > 0 && <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
        Cần chú ý: {attention.map((item) => `${dashboardStatusLabel(item.status)}: ${item.count}`).join(" · ")}
      </p>}
      <details className="rounded-lg border border-border p-3">
        <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary">Xem tất cả trạng thái</summary>
        <div className="mt-3"><Distribution items={all} /></div>
      </details>
    </div>
  );
}
