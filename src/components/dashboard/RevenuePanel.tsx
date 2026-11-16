"use client";

import { useCallback } from "react";
import { getRevenueTrend } from "@/api/dashboard";
import { useDashboardResource } from "@/hooks/useDashboardResource";
import { moneyLabel, type DateRange } from "@/lib/dashboard";
import {
  Metric,
  Panel,
  ResourceState,
  TrendChart,
  Updated,
} from "./DashboardUI";

export default function RevenuePanel({
  range,
  eventId,
  refresh,
}: {
  range: DateRange;
  eventId?: string;
  refresh: number;
}) {
  const load = useCallback(() => {
    void refresh;
    return getRevenueTrend(range, eventId);
  }, [range, eventId, refresh]);
  const result = useDashboardResource(load);
  return (
    <Panel
      title="Dòng tiền vé"
      description="Theo ngày thực thu và ngày hoàn tiền thành công. Dòng tiền ròng chưa trừ phí và không phải số dư có thể rút."
    >
      <ResourceState
        loading={result.loading}
        error={result.error}
        retry={result.reload}
      />
      {result.data && (
        <div className="space-y-6">
          {result.data.series.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Chưa có phát sinh trong khoảng ngày này.
            </p>
          )}
          {result.data.series.map((series) => (
            <div key={series.currency} className="space-y-4">
              <h3 className="text-sm font-semibold">{series.currency}</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Đã thu"
                  value={moneyLabel(series.totalCollected, series.currency)}
                  note="Thanh toán vé thành công"
                />
                <Metric
                  label="Đã hoàn"
                  value={moneyLabel(series.totalRefunded, series.currency)}
                  note="Hoàn tiền thành công"
                />
                <Metric
                  label="Dòng tiền ròng"
                  value={moneyLabel(series.netCashFlow, series.currency)}
                  note="Đã thu trừ đã hoàn trong kỳ"
                />
              </div>
              <TrendChart
                dates={series.days.map((day) => day.date)}
                series={[
                  {
                    label: "Đã thu",
                    values: series.days.map((day) => day.collected),
                  },
                  {
                    label: "Đã hoàn",
                    values: series.days.map((day) => day.refunded),
                  },
                ]}
                format={(value) => moneyLabel(value, series.currency)}
              />
            </div>
          ))}
          <Updated at={result.data.generatedAtUtc} />
        </div>
      )}
    </Panel>
  );
}
