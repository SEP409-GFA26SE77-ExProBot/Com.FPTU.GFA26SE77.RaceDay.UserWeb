"use client";

import Link from "next/link";
import { useCallback, useId, useState, type ReactNode } from "react";
import { Tabs } from "radix-ui";
import { exportOrganizerDashboard, getEventDashboard, getRegistrationTrend, getRevenueTrend } from "@/api/dashboard";
import { FINANCE_USE_MOCK } from "@/api/finance";
import { useDashboardResource } from "@/hooks/useDashboardResource";
import { dateLabel, moneyLabel, numberLabel, recentRange } from "@/lib/dashboard";
import { documentLabel, groupedDashboardStatuses } from "@/lib/dashboard-labels";
import { DateFilter, Metric, Panel, RefreshButton, ResourceState, TrendChart, Updated } from "./DashboardUI";
import CashFlowBreakdown from "./CashFlowBreakdown";
import DashboardExport from "./DashboardExport";

const detailLink = "inline-flex min-h-11 items-center text-sm font-semibold text-orange-700 hover:underline focus-visible:outline-2 focus-visible:outline-orange-600";

export default function EventDashboard({ eventId, distanceAction }: {
  eventId: string;
  distanceAction?: (distanceId: string) => ReactNode;
}) {
  const distanceSelectId = useId();
  const currencySelectId = useId();
  const [range, setRange] = useState(() => recentRange());
  const [distanceId, setDistanceId] = useState("");
  const [currency, setCurrency] = useState("");
  const load = useCallback(() => getEventDashboard(eventId), [eventId]);
  const loadTrend = useCallback(() => getRegistrationTrend(eventId, range), [eventId, range]);
  const loadRevenue = useCallback(() => getRevenueTrend(range, eventId), [eventId, range]);
  const dashboard = useDashboardResource(load);
  const trend = useDashboardResource(loadTrend);
  const revenue = useDashboardResource(loadRevenue);
  const data = dashboard.data;
  const base = `/organizer/events/${eventId}`;
  const selectedDistance = trend.data?.distances.find((distance) => distance.distanceId === distanceId);
  const days = selectedDistance?.days ?? trend.data?.days ?? [];
  const series = revenue.data?.series.find((item) => item.currency === currency) ?? revenue.data?.series[0];
  const pending = data?.registrationsByStatus.find((item) => item.status === "pending_approval")?.count ?? 0;
  const prep = data?.preparation;
  const tasks = prep ? [
    { title: "Thêm cự ly", show: prep.totalDistances === 0, value: "Giải chưa có cự ly.", href: base + "/profile/distances" },
    { title: "Cấu hình BIB", show: prep.distancesWithBib < prep.totalDistances, value: `${prep.distancesWithBib}/${prep.totalDistances} cự ly có dải BIB`, href: base + "/profile/bib" },
    { title: "Tuyến đường & checkpoint", show: prep.coursesReady < prep.totalDistances || prep.coursesWithCheckpoints < prep.totalDistances, value: `${prep.coursesReady}/${prep.totalDistances} tuyến sẵn sàng · ${prep.coursesWithCheckpoints} tuyến có checkpoint`, href: base + "/setup-map" },
    { title: "Phân công nhân sự", show: prep.activeStaff === 0 || prep.assignedStaff < prep.activeStaff, value: prep.activeStaff === 0 ? "Chưa có nhân sự hoạt động." : `${prep.assignedStaff}/${prep.activeStaff} nhân sự hoạt động đã được phân trạm`, href: base + "/staff" },
    { title: "Bổ sung tài liệu", show: prep.missingDocumentKeys.length > 0, value: prep.missingDocumentKeys.map(documentLabel).join(", "), href: base + "/profile/documents" },
  ].filter((item) => item.show) : [];

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-border bg-card p-3">
        <DateFilter compact value={range} onChange={setRange} />
        <div className="flex flex-wrap items-start gap-2">
          <RefreshButton onClick={() => { dashboard.reload(); trend.reload(); revenue.reload(); }} />
          <DashboardExport compact key={eventId + range.from + range.to + (selectedDistance?.distanceId ?? "")} range={range}
            download={(format) => exportOrganizerDashboard(range, format, eventId, selectedDistance?.distanceId)}
            disabled={!data || dashboard.loading || !trend.data || trend.loading || FINANCE_USE_MOCK} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Xu hướng và dòng tiền: {dateLabel(range.from)} – {dateLabel(range.to)} (UTC+7). Chỉ số, sức chứa và công việc là số liệu hiện tại.{FINANCE_USE_MOCK && " Tài chính đang mô phỏng; chưa hỗ trợ xuất báo cáo."}</p>
      <ResourceState loading={dashboard.loading} error={dashboard.error} retry={dashboard.reload} />
      {data && <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Đăng ký đã xác nhận", value: data.checkInSummary.eligible, note: "Gồm cả VĐV đã hoàn thành", href: base + "?tab=approvals" },
          { label: "Đăng ký chờ duyệt", value: pending, note: "Mở danh sách để xử lý", href: base + "?tab=approvals" },
          { label: "Đã điểm danh", value: `${numberLabel(data.checkInSummary.checkedIn)} / ${numberLabel(data.checkInSummary.eligible)}`, note: "Trên đăng ký đã xác nhận", href: base + "?tab=approvals" },
          { label: "Khiếu nại chờ xử lý", value: data.pendingComplaints, note: "Chỉ khiếu nại của giải này", href: `/organizer/disputes?eventId=${eventId}` },
        ].map((item) => <Link key={item.label} href={item.href} className="min-w-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-orange-600"><Metric compact label={item.label} value={item.value} note={item.note} /></Link>)}
      </div>}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Panel compact title="Dòng tiền vé" action={<Link href={base + "/wallet"} className={detailLink}>Ví & giải ngân →</Link>}>
          <ResourceState loading={revenue.loading} error={revenue.error} retry={revenue.reload} />
          {revenue.data && <>
            {revenue.data.series.length > 1 && <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <label htmlFor={currencySelectId}>Tiền tệ</label>
              <select id={currencySelectId} value={series?.currency ?? ""} onChange={(event) => setCurrency(event.target.value)} className="min-h-11 rounded-lg border border-border bg-card px-3 focus-visible:outline-2 focus-visible:outline-orange-600">
                {revenue.data.series.map((item) => <option key={item.currency} value={item.currency}>{item.currency}</option>)}
              </select>
            </div>}
            {series ? <CashFlowBreakdown key={series.currency + range.from + range.to} series={series} /> : <p className="text-sm text-muted-foreground">Chưa có phát sinh trong khoảng ngày này.</p>}
          </>}
        </Panel>

        <Panel compact title="Xu hướng theo ngày">
          <Tabs.Root defaultValue="registrations">
            <Tabs.List aria-label="Loại biểu đồ" className="mb-3 flex flex-wrap gap-2">
              {[{ value: "registrations", label: "Đăng ký" }, { value: "revenue", label: "Dòng tiền" }].map((item) => <Tabs.Trigger key={item.value} value={item.value} className="min-h-11 rounded-xl px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-orange-600 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">{item.label}</Tabs.Trigger>)}
            </Tabs.List>
            <Tabs.Content value="registrations" className="min-w-0 space-y-3 focus-visible:outline-2 focus-visible:outline-orange-600">
              <ResourceState loading={trend.loading} error={trend.error} retry={trend.reload} />
              {trend.data && <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <label htmlFor={distanceSelectId}>Cự ly</label>
                  <select id={distanceSelectId} value={selectedDistance?.distanceId ?? ""} onChange={(event) => setDistanceId(event.target.value)} className="min-h-11 min-w-0 max-w-full flex-1 rounded-lg border border-border bg-card px-3 focus-visible:outline-2 focus-visible:outline-orange-600">
                    <option value="">Tất cả cự ly</option>
                    {trend.data.distances.map((distance) => <option key={distance.distanceId} value={distance.distanceId}>{distance.name}</option>)}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">{numberLabel(selectedDistance ? days.reduce((total, day) => total + day.count, 0) : trend.data.totalRegistrations)} đơn mới, gồm cả chưa thanh toán/đã hủy.</p>
                <TrendChart compact showTable dates={days.map((day) => day.date)} series={[{ label: selectedDistance?.name ?? "Tất cả cự ly", values: days.map((day) => day.count) }]} />
              </>}
            </Tabs.Content>
            <Tabs.Content value="revenue" className="min-w-0 space-y-3 focus-visible:outline-2 focus-visible:outline-orange-600">
              <ResourceState loading={revenue.loading} error={revenue.error} retry={revenue.reload} />
              {series && <>
                <p className="text-xs text-muted-foreground">Toàn giải · {series.currency} · Theo ngày thu/hoàn thành công. Đã hoàn biểu diễn số tiền hoàn, không mang dấu âm trên biểu đồ.</p>
                <TrendChart compact showTable dates={series.days.map((day) => day.date)} series={[{ label: "Đã thu", values: series.days.map((day) => day.collected) }, { label: "Đã hoàn", values: series.days.map((day) => day.refunded) }]} format={(value) => moneyLabel(value, series.currency)} />
              </>}
              {revenue.data && !series && <p className="text-sm text-muted-foreground">Chưa có phát sinh trong khoảng ngày này.</p>}
            </Tabs.Content>
          </Tabs.Root>
          <p className="mt-3 text-xs text-muted-foreground">Bộ lọc cự ly chỉ áp dụng cho đăng ký và phần đăng ký trong tệp xuất: {selectedDistance?.name ?? "Tất cả cự ly"}. Dòng tiền luôn tính toàn giải.</p>
        </Panel>

        {data && <>
          <Panel compact title="Cự ly & sức chứa" action={<Link href={base + "/profile/distances"} className={detailLink}>Chi tiết & giá vé →</Link>}>
            {data.distances.length ? <div className="max-h-64 overflow-auto rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-orange-600" tabIndex={0} role="region" aria-label="Sức chứa các cự ly">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Cự ly, số chỗ giữ, sức chứa và đăng ký đã xác nhận</caption>
                <thead className="sticky top-0 bg-card text-xs text-muted-foreground"><tr>
                  <th scope="col" className="p-3">Cự ly</th><th scope="col" className="p-3 text-right">Giữ / sức chứa</th><th scope="col" className="p-3 text-right">Xác nhận</th>
                </tr></thead>
                <tbody>{data.distances.map((distance) => <tr key={distance.distanceId} className="border-t border-border">
                  <th scope="row" className="max-w-48 break-words p-3 font-medium">{distance.name}{distanceAction?.(distance.distanceId)}</th>
                  <td className="p-3 text-right tabular-nums">{numberLabel(distance.reservedSlots)} / {distance.capacity > 0 ? numberLabel(distance.capacity) : "Không giới hạn"}</td>
                  <td className="p-3 text-right tabular-nums">{numberLabel(distance.confirmedRegistrations)}</td>
                </tr>)}</tbody>
              </table>
            </div> : <p className="text-sm text-muted-foreground">Chưa có cự ly. Thêm cự ly trong hồ sơ giải.</p>}
            <p className="mt-3 text-xs text-muted-foreground">Chỗ giữ có thể gồm đơn chưa thanh toán. Xác nhận gồm cả VĐV đã hoàn thành.</p>
            <details className="mt-2">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-orange-600">Trạng thái đăng ký · {numberLabel(data.totalRegistrations)} đơn</summary>
              <dl className="grid grid-cols-2 gap-3 text-sm">{groupedDashboardStatuses(data.registrationsByStatus, "registration").map((item) => <div key={item.label}><dt className="text-muted-foreground">{item.label}</dt><dd className="font-bold tabular-nums">{numberLabel(item.count)}</dd></div>)}</dl>
              {data.totalRegistrations === 0 && <p className="text-sm text-muted-foreground">Chưa có đơn đăng ký.</p>}
              <Link href={base + "?tab=approvals"} className={detailLink}>Xem đăng ký →</Link>
            </details>
          </Panel>
          <Panel compact title="Việc cần xử lý" action={<Link href={base + "/profile/open-registration"} className={detailLink}>Hồ sơ giải →</Link>}>
            {tasks.length ? <ul className="divide-y divide-border">{tasks.map((item) => <li key={item.title}>
              <Link href={item.href} className="flex min-h-11 items-start justify-between gap-3 rounded-lg py-3 text-sm hover:text-orange-700 focus-visible:outline-2 focus-visible:outline-orange-600">
                <span className="min-w-0"><span className="font-semibold">{item.title}</span><span className="mt-1 block break-words text-xs text-muted-foreground">{item.value}</span></span><span aria-hidden="true">→</span>
              </Link>
            </li>)}</ul> : <p className="text-sm text-muted-foreground">Không có mục chuẩn bị còn thiếu theo dữ liệu hiện tại.</p>}
            <p className="mt-3 text-xs text-muted-foreground">Chỉ hiển thị các cấu hình còn thiếu; không thay thế điều kiện duyệt mở đăng ký. Đăng ký và khiếu nại chờ xử lý ở các ô chỉ số phía trên.</p>
          </Panel>
        </>}
      </div>
      {data && <Updated at={data.generatedAtUtc} />}
    </div>
  );
}
