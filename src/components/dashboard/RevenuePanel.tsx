"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
import { getRevenueTrend } from "@/api/dashboard";
import { useDashboardResource } from "@/hooks/useDashboardResource";
import { moneyLabel, type DateRange } from "@/lib/dashboard";
import {
  Panel,
  ResourceState,
  TrendChart,
  Updated,
} from "./DashboardUI";
import CashFlowBreakdown from "./CashFlowBreakdown";

export default function RevenuePanel({
  range,
  eventId,
  refresh,
  compact = false,
}: {
  range: DateRange;
  eventId?: string;
  refresh: number;
  compact?: boolean;
}) {
  const load = useCallback(() => {
    void refresh;
    return getRevenueTrend(range, eventId);
  }, [range, eventId, refresh]);
  const result = useDashboardResource(load);
  const [currency, setCurrency] = useState("");
  const currencyId = useId();
  const allSeries = result.data?.series ?? [];
  const selected = allSeries.find((item) => item.currency === currency) ?? allSeries[0];
  const visibleSeries = compact ? (selected ? [selected] : []) : allSeries;
  return (
    <Panel
      title="Dòng tiền vé"
      compact={compact}
      description={compact ? undefined : "Theo ngày thực thu và ngày hoàn tiền thành công. Dòng tiền ròng chưa trừ phí và không phải số dư có thể rút."}
      action={compact && <Link href={`/my-events/revenue?from=${range.from}&to=${range.to}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-orange-700 hover:underline focus-visible:outline-2 focus-visible:outline-orange-600">Xem chi tiết →</Link>}
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
          {compact && allSeries.length > 1 && <div className="flex items-center gap-2 text-sm">
            <label htmlFor={currencyId}>Tiền tệ</label>
            <select id={currencyId} value={selected?.currency ?? ""} onChange={(event) => setCurrency(event.target.value)} className="min-h-11 rounded-lg border border-border bg-card px-3">
              {allSeries.map((item) => <option key={item.currency} value={item.currency}>{item.currency}</option>)}
            </select>
          </div>}
          {visibleSeries.map((series) => (
            <div key={series.currency} className="space-y-4">
              {!compact && <h3 className="text-sm font-semibold">{series.currency}</h3>}
              <CashFlowBreakdown series={series} />
              <TrendChart
                compact={compact}
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
          {!compact && <Updated at={result.data.generatedAtUtc} />}
        </div>
      )}
    </Panel>
  );
}
