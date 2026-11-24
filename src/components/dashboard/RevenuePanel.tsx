"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
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
              {compact ? <dl className="grid grid-cols-3 gap-3 border-b border-border pb-3">
                {[
                  { label: "+ Đã thu", value: `${series.totalCollected > 0 ? "+" : ""}${moneyLabel(series.totalCollected, series.currency)}` },
                  { label: "− Đã hoàn", value: `${series.totalRefunded > 0 ? "−" : ""}${moneyLabel(series.totalRefunded, series.currency)}` },
                  { label: "Chênh lệch", value: `${series.netCashFlow > 0 ? "+" : ""}${moneyLabel(series.netCashFlow, series.currency)}` },
                ].map((item) => <div key={item.label} className="min-w-0"><dt className="text-xs text-muted-foreground">{item.label}</dt><dd className="mt-1 break-words text-base font-bold tabular-nums sm:text-xl">{item.value}</dd></div>)}
              </dl> : <>
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
              </>}
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
          {compact ? <p className="text-xs text-muted-foreground">Thu − hoàn trong kỳ; chưa trừ phí, không phải lợi nhuận hoặc số dư ví.</p> : <Updated at={result.data.generatedAtUtc} />}
        </div>
      )}
    </Panel>
  );
}
