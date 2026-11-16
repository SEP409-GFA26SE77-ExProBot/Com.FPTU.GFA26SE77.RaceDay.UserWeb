"use client";

import Link from "next/link";
import { useCallback, useId, useState } from "react";
import { exportOrganizerDashboard, getEventDashboard, getRegistrationTrend } from "@/api/dashboard";
import { FINANCE_USE_MOCK, getEventFinanceSummary } from "@/api/finance";
import { Button } from "@/components/ui/button";
import { useDashboardResource } from "@/hooks/useDashboardResource";
import { moneyLabel, numberLabel, recentRange } from "@/lib/dashboard";
import { documentLabel } from "@/lib/dashboard-labels";
import {
  DateFilter,
  Metric,
  Panel,
  RefreshButton,
  ResourceState,
  TrendChart,
  Updated,
} from "./DashboardUI";
import RevenuePanel from "./RevenuePanel";
import StatusBreakdown from "./StatusBreakdown";
import DashboardExport from "./DashboardExport";

export default function EventDashboard({ eventId }: { eventId: string }) {
  const distanceSelectId = useId();
  const [range, setRange] = useState(() => recentRange());
  const [refresh, setRefresh] = useState(0);
  const [distanceId, setDistanceId] = useState("");
  const load = useCallback(() => getEventDashboard(eventId), [eventId]);
  const loadFinance = useCallback(
    () => getEventFinanceSummary(eventId),
    [eventId],
  );
  const loadTrend = useCallback(() => {
    void refresh;
    return getRegistrationTrend(eventId, range);
  }, [eventId, range, refresh]);
  const dashboard = useDashboardResource(load);
  const finance = useDashboardResource(loadFinance);
  const trend = useDashboardResource(loadTrend);
  const data = dashboard.data;
  const base = `/organizer/events/${eventId}`;
  const selectedDistance = trend.data?.distances.find(
    (distance) => distance.distanceId === distanceId,
  );
  const days = selectedDistance?.days ?? trend.data?.days ?? [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Vận hành giải</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Số liệu hiện tại của giải. Biểu đồ bên dưới có bộ lọc ngày riêng.
          </p>
        </div>
        <RefreshButton
          onClick={() => {
            dashboard.reload();
            finance.reload();
            setRefresh((value) => value + 1);
          }}
        />
      </div>
      <ResourceState
        loading={dashboard.loading}
        error={dashboard.error}
        retry={dashboard.reload}
      />
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Tổng đơn đăng ký"
              value={data.totalRegistrations}
              note="Bao gồm đơn chờ thanh toán, bị từ chối và đã hủy"
            />
            <Metric
              label="Đăng ký đã xác nhận"
              value={data.checkInSummary.eligible}
              note="Gồm cả đăng ký của VĐV đã hoàn thành"
            />
            <Metric
              label="Đã check-in"
              value={
                numberLabel(data.checkInSummary.checkedIn) +
                " / " +
                numberLabel(data.checkInSummary.eligible)
              }
              note="Trên tổng đăng ký đã xác nhận"
            />
            <Metric
              label="Khiếu nại chờ xử lý"
              value={data.pendingComplaints}
              note="Khiếu nại của giải đang ở trạng thái chờ"
            />
          </div>
          <div className="grid items-start gap-6 md:grid-cols-2">
            <Panel
              title="Trạng thái đăng ký"
              action={
                <Button asChild variant="outline" className="min-h-11">
                  <Link href={base + "?tab=approvals"}>Duyệt đăng ký</Link>
                </Button>
              }
            >
              <StatusBreakdown items={data.registrationsByStatus} kind="registration" />
            </Panel>
            <Panel
              title="Tình hình thi đấu"
              description="Chỉ tính đăng ký đã xác nhận hoặc hoàn thành."
              action={
                <Button asChild variant="outline" className="min-h-11">
                  <Link href={base + "/results"}>Kết quả giải</Link>
                </Button>
              }
            >
              <StatusBreakdown items={data.raceByStatus} kind="race" />
            </Panel>
          </div>
          <Panel
            title="Sức chứa theo cự ly"
            description="Chỗ đang giữ có thể gồm đơn chưa thanh toán; không đồng nghĩa với vé đã bán."
          >
            {data.distances.length ? (
              <div className="grid gap-5 md:grid-cols-2">
                {data.distances.map((distance) => (
                  <div
                    key={distance.distanceId}
                    className="rounded-xl border border-border p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <h3 className="font-bold">{distance.name}</h3>
                      <span>
                        {numberLabel(distance.reservedSlots)} /{" "}
                        {distance.capacity > 0
                          ? numberLabel(distance.capacity) + " chỗ"
                          : "Không giới hạn"}
                      </span>
                    </div>
                    {distance.capacity > 0 && (
                      <div
                        className="my-3 h-2 overflow-hidden rounded-full bg-muted"
                        aria-hidden="true"
                      >
                        <div
                          className="h-full rounded-full bg-orange-600"
                          style={{
                            width: `${Math.min(100, Math.max(0, (distance.reservedSlots / distance.capacity) * 100))}%`,
                          }}
                        />
                      </div>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      {numberLabel(distance.confirmedRegistrations)} đăng ký đã
                      xác nhận / hoàn thành
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa có cự ly. Thêm cự ly trong hồ sơ giải.
              </p>
            )}
          </Panel>
          <Panel
            title="Công tác chuẩn bị"
            description="Các dữ kiện cấu hình, không thay thế điều kiện duyệt mở đăng ký."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  title: "Cấu hình BIB",
                  value: `${data.preparation.distancesWithBib} / ${data.preparation.totalDistances} cự ly có dải BIB`,
                  href: base + "/profile/bib",
                },
                {
                  title: "Tuyến đường",
                  value: `${data.preparation.coursesReady} tuyến sẵn sàng · ${data.preparation.coursesWithCheckpoints} tuyến có checkpoint`,
                  href: base + "/setup-map",
                },
                {
                  title: "Nhân sự",
                  value: `${data.preparation.assignedStaff} / ${data.preparation.activeStaff} nhân sự hoạt động đã được phân trạm`,
                  href: base + "/staff",
                },
                {
                  title: "Tài liệu bắt buộc",
                  value: data.preparation.missingDocumentKeys.length
                    ? "Còn thiếu: " +
                      data.preparation.missingDocumentKeys
                        .map(documentLabel)
                        .join(", ")
                    : "Đã có các tệp tài liệu bắt buộc",
                  href: base + "/profile/documents",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-xl border border-border p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <h3 className="text-sm font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.value}
                  </p>
                  <span className="mt-3 inline-block text-xs font-semibold text-orange-700">
                    Xem chi tiết →
                  </span>
                </Link>
              ))}
            </div>
            {data.pendingComplaints > 0 && (
              <Button asChild variant="outline" className="mt-4 min-h-11">
                <Link href={`/organizer/disputes?eventId=${eventId}`}>
                  Xử lý {numberLabel(data.pendingComplaints)} khiếu nại
                </Link>
              </Button>
            )}
          </Panel>
          <Updated at={data.generatedAtUtc} />
        </>
      )}
      <Panel
        title="Tài chính của giải"
        description={
          FINANCE_USE_MOCK
            ? "Đang bật dữ liệu tài chính mô phỏng theo cấu hình môi trường."
            : "Số liệu tích lũy hiện tại, không áp dụng bộ lọc ngày bên dưới."
        }
        action={
          <Button asChild variant="outline" className="min-h-11">
            <Link href={base + "/wallet"}>Ví & giải ngân</Link>
          </Button>
        }
      >
        <ResourceState
          loading={finance.loading}
          error={finance.error}
          retry={finance.reload}
        />
        {finance.data && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Tiền vé theo sổ tài chính"
                value={moneyLabel(
                  finance.data.grossRevenue,
                  finance.data.currency,
                )}
                note={numberLabel(finance.data.ticketsSold) + " vé đã bán"}
              />
              <Metric
                label="Phí nền tảng"
                value={moneyLabel(
                  finance.data.platformFeeAmount,
                  finance.data.currency,
                )}
                note={
                  numberLabel(finance.data.platformFeePercent) +
                  "% theo sổ tài chính"
                }
              />
              <Metric
                label="Đã hoàn tiền"
                value={moneyLabel(
                  finance.data.refundedTotal,
                  finance.data.currency,
                )}
                note="Tổng hoàn tiền tích lũy"
              />
              <Metric
                label="Có thể rút"
                value={moneyLabel(
                  finance.data.availableToWithdraw,
                  finance.data.currency,
                )}
                note="Theo chính sách giải ngân của giải"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {finance.data.withdrawPolicyNote}
            </p>
          </div>
        )}
      </Panel>
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">
          Xu hướng theo ngày
        </h2>
        <DateFilter value={range} onChange={setRange} />
      </div>
      <Panel
        title="Đăng ký mới"
        description="Theo ngày tạo đơn, bao gồm cả đơn chưa thanh toán hoặc đã hủy."
      >
        <ResourceState
          loading={trend.loading}
          error={trend.error}
          retry={trend.reload}
        />
        {trend.data && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor={distanceSelectId}
                className="block text-sm font-medium"
              >
                Cự ly
              </label>
              <select
                id={distanceSelectId}
                value={selectedDistance?.distanceId ?? ""}
                onChange={(event) => setDistanceId(event.target.value)}
                className="mt-2 block min-h-11 w-full rounded-lg border border-border bg-card px-3 text-foreground focus-visible:outline-2 focus-visible:outline-primary sm:max-w-xs"
              >
                <option value="">Tất cả cự ly</option>
                {trend.data.distances.map((distance) => (
                  <option key={distance.distanceId} value={distance.distanceId}>
                    {distance.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm font-semibold">
              {numberLabel(
                selectedDistance
                  ? days.reduce((total, day) => total + day.count, 0)
                  : trend.data.totalRegistrations,
              )}{" "}
              đơn trong khoảng ngày đã chọn
            </p>
            <DashboardExport
              key={eventId + range.from + range.to + (selectedDistance?.distanceId ?? "")}
              range={range}
              download={(format) => exportOrganizerDashboard(range, format, eventId, selectedDistance?.distanceId)}
              disabled={!data || dashboard.loading || FINANCE_USE_MOCK}
            />
            <p className="text-xs text-muted-foreground">Cự ly chỉ lọc biểu đồ đăng ký; các chỉ số khác và dòng tiền vẫn tính toàn giải.</p>
            {FINANCE_USE_MOCK && <p className="text-sm text-muted-foreground">Xuất báo cáo chỉ hỗ trợ khi dashboard dùng dữ liệu tài chính thực.</p>}
            <TrendChart
              dates={days.map((day) => day.date)}
              series={[
                {
                  label: selectedDistance?.name ?? "Tất cả cự ly",
                  values: days.map((day) => day.count),
                },
              ]}
            />
            <Updated at={trend.data.generatedAtUtc} />
          </div>
        )}
      </Panel>
      <RevenuePanel range={range} eventId={eventId} refresh={refresh} />
    </div>
  );
}
