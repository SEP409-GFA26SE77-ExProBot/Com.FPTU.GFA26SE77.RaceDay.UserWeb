"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CalendarDays, Flag, Plus } from "lucide-react";
import { exportOrganizerDashboard, getOrganizerDashboard } from "@/api/dashboard";
import { FINANCE_USE_MOCK, getOrganizerWallet } from "@/api/finance";
import { Button } from "@/components/ui/button";
import { useDashboardResource } from "@/hooks/useDashboardResource";
import {
  dateLabel,
  moneyLabel,
  numberLabel,
  recentRange,
} from "@/lib/dashboard";
import { dashboardStatusLabel } from "@/lib/dashboard-labels";
import {
  DateFilter,
  Metric,
  Panel,
  RefreshButton,
  ResourceState,
  Updated,
} from "./DashboardUI";
import RevenuePanel from "./RevenuePanel";
import StatusBreakdown from "./StatusBreakdown";
import DashboardExport from "./DashboardExport";

export default function OrganizerDashboard() {
  const dashboard = useDashboardResource(getOrganizerDashboard);
  const wallet = useDashboardResource(getOrganizerWallet);
  const [range, setRange] = useState(() => recentRange());
  const [refresh, setRefresh] = useState(0);
  const data = dashboard.data;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-700">
            <Flag className="h-4 w-4" />
            Không gian ban tổ chức
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Việc cần xử lý, lịch sắp tới và dòng tiền của các giải bạn sở hữu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RefreshButton
            onClick={() => {
              dashboard.reload();
              wallet.reload();
              setRefresh((value) => value + 1);
            }}
          />
          <Button
            asChild
            className="min-h-11 gap-2 bg-orange-700 text-white hover:bg-orange-800"
          >
            <Link href="/events/create">
              <Plus className="h-4 w-4" />
              Tạo giải mới
            </Link>
          </Button>
        </div>
      </header>
      <ResourceState
        loading={dashboard.loading}
        error={dashboard.error}
        retry={dashboard.reload}
      />
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric
              label="Giải đang mở đăng ký"
              value={data.eventsByStatus.find((item) => item.status === "registration-open")?.count ?? 0}
              note={`Trên ${numberLabel(data.totalEvents)} giải của bạn, gồm cả bản nháp`}
            />
            <Metric
              label="Đăng ký chờ duyệt"
              value={data.pendingRegistrations}
              note="Các đơn đang đợi ban tổ chức xử lý"
            />
            <Metric
              label="Khiếu nại chờ xử lý"
              value={data.pendingComplaints}
              note="Khiếu nại của giải ở trạng thái chờ"
            />
          </div>
          {data.totalEvents === 0 && (
            <Panel
              title="Bắt đầu giải chạy đầu tiên"
              description="Sau khi tạo giải, các chỉ số và công việc cần xử lý sẽ xuất hiện tại đây."
            >
              <Button asChild variant="outline" className="min-h-11">
                <Link href="/events/create">Tạo giải mới</Link>
              </Button>
            </Panel>
          )}
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel
              title="Việc cần xử lý"
              description="Ưu tiên các giải có nhiều đăng ký và khiếu nại đang chờ."
              action={
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/my-events">
                    Danh sách giải
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              }
            >
              {data.eventsWithPendingTasks.length ? (
                <ul className="max-h-[480px] divide-y divide-border overflow-y-auto">
                  {data.eventsWithPendingTasks.map((event) => (
                    <li key={event.eventId} className="space-y-3 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          className="min-h-11 break-words font-semibold text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                          href={`/organizer/events/${event.eventId}`}
                        >
                          {event.name}
                        </Link>
                        <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                          {numberLabel(event.pendingTasks)} việc
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.pendingRegistrations > 0 && (
                          <Button
                            asChild
                            variant="outline"
                            className="min-h-11"
                          >
                            <Link
                              href={`/organizer/events/${event.eventId}?tab=approvals`}
                            >
                              Duyệt {numberLabel(event.pendingRegistrations)}{" "}
                              đăng ký
                            </Link>
                          </Button>
                        )}
                        {event.pendingComplaints > 0 && (
                          <Button
                            asChild
                            variant="outline"
                            className="min-h-11"
                          >
                            <Link
                              href={`/organizer/disputes?eventId=${event.eventId}`}
                            >
                              Xử lý {numberLabel(event.pendingComplaints)} khiếu
                              nại
                            </Link>
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl bg-muted/40 p-5 text-sm text-muted-foreground">
                  Không có đăng ký hoặc khiếu nại đang chờ xử lý.
                </p>
              )}
            </Panel>
            <Panel
              title="Trạng thái các giải"
              description="Nhóm theo công việc hiện tại; mở chi tiết để xem từng trạng thái."
            >
              <StatusBreakdown items={data.eventsByStatus} kind="event" />
            </Panel>
          </div>
          <Panel
            title="Giải sắp diễn ra"
            description="Tối đa 5 giải đã duyệt, đang mở hoặc đã đóng đăng ký, từ hôm nay trở đi."
          >
            {data.upcomingEvents.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.upcomingEvents.map((event) => (
                  <Link
                    key={event.eventId}
                    href={`/organizer/events/${event.eventId}`}
                    className="group min-w-0 rounded-xl border border-border p-4 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <p className="flex items-center gap-2 text-xs font-semibold text-orange-700">
                      <CalendarDays className="h-4 w-4" />
                      {dateLabel(event.eventDate)}
                    </p>
                    <h3 className="my-3 break-words text-base font-bold">
                      {event.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {dashboardStatusLabel(event.status)}
                    </p>
                    <p className="mt-4 flex items-center gap-1 text-sm font-semibold">
                      Xem tổng quan
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa có giải sắp diễn ra phù hợp.
              </p>
            )}
          </Panel>
          <Updated at={data.generatedAtUtc} />
        </>
      )}
      <Panel
        title="Ví ban tổ chức"
        description={
          FINANCE_USE_MOCK
            ? "Đang bật dữ liệu tài chính mô phỏng theo cấu hình môi trường."
            : "Số dư hiện tại, không phụ thuộc bộ lọc ngày của biểu đồ."
        }
        action={
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/wallet">
              Mở ví
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      >
        <ResourceState
          loading={wallet.loading}
          error={wallet.error}
          retry={wallet.reload}
        />
        {wallet.data && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric
              label="Có thể rút"
              value={moneyLabel(
                wallet.data.availableBalance,
                wallet.data.currency,
              )}
              note="Theo chính sách và số dư từng giải"
            />
            <Metric
              label="Đang giữ ký quỹ"
              value={moneyLabel(
                wallet.data.pendingEscrow,
                wallet.data.currency,
              )}
              note="Khoản tiền chưa được giải ngân"
            />
            <Metric
              label="Đã rút"
              value={moneyLabel(
                wallet.data.withdrawnTotal,
                wallet.data.currency,
              )}
              note="Tổng tiền đã giải ngân thành công"
            />
          </div>
        )}
      </Panel>
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">
          Theo dõi dòng tiền
        </h2>
        <DateFilter value={range} onChange={setRange} />
        <DashboardExport
          key={range.from + range.to}
          range={range}
          download={(format) => exportOrganizerDashboard(range, format)}
          disabled={!data || dashboard.loading || FINANCE_USE_MOCK}
        />
        {FINANCE_USE_MOCK && <p className="text-sm text-muted-foreground">Xuất báo cáo chỉ hỗ trợ khi dashboard dùng dữ liệu tài chính thực.</p>}
        <RevenuePanel range={range} refresh={refresh} />
      </div>
    </div>
  );
}
