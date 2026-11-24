"use client";

import { useId, useState, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  dateLabel,
  numberLabel,
  rangeError,
  recentRange,
  updatedLabel,
  type DateRange,
} from "@/lib/dashboard";

export function Panel({
  title,
  description,
  children,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border bg-card text-card-foreground shadow-sm ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className={`${compact ? "mb-3" : "mb-5"} flex flex-wrap items-start justify-between gap-3`}>
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  note,
  compact = false,
}: {
  label: string;
  value: string | number;
  note?: string;
  compact?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border border-border bg-card text-card-foreground shadow-sm ${compact ? "p-3 sm:p-4" : "p-5"}`}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`${compact ? "mt-1 text-2xl" : "my-2 text-2xl sm:text-3xl"} break-words font-bold tracking-tight tabular-nums`}>
        {typeof value === "number" ? numberLabel(value) : value}
      </p>
      {note && <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>}
    </div>
  );
}

export function ResourceState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error?: string;
  retry: () => void;
}) {
  if (loading)
    return (
      <div
        role="status"
        className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground"
      >
        <div className="mb-3 h-2 w-24 rounded bg-primary/20 motion-safe:animate-pulse" />
        Đang tải dữ liệu…
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-card p-5 text-card-foreground"
      >
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="min-w-0 flex-1 text-sm">{error}</p>
        <Button variant="outline" className="min-h-11" onClick={retry}>
          Thử lại
        </Button>
      </div>
    );
  return null;
}

export function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" className="min-h-11 gap-2" onClick={onClick}>
      <RefreshCw className="h-4 w-4" />
      Làm mới
    </Button>
  );
}

export function Updated({ at }: { at: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      Cập nhật {updatedLabel(at)} · Giờ Việt Nam
    </p>
  );
}

export function DateFilter({
  value,
  onChange,
  compact = false,
}: {
  value: DateRange;
  onChange: (value: DateRange) => void;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  return (
    <form
      className={compact ? "min-w-0 space-y-2" : "space-y-3 rounded-2xl border border-border bg-card p-4 text-card-foreground"}
      onSubmit={(event) => {
        event.preventDefault();
        const message = rangeError(draft);
        setError(message);
        if (!message) onChange(draft);
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className={`min-w-0 text-xs font-medium ${compact ? "w-[calc(50%-0.375rem)] sm:w-36" : "w-full sm:w-44"}`}>
          Từ ngày
          <Input
            type="date"
            min="1900-01-01"
            max="9998-12-31"
            required
            value={draft.from}
            onChange={(event) =>
              setDraft({ ...draft, from: event.target.value })
            }
            className="mt-1 min-h-11"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? id : undefined}
          />
        </label>
        <label className={`min-w-0 text-xs font-medium ${compact ? "w-[calc(50%-0.375rem)] sm:w-36" : "w-full sm:w-44"}`}>
          Đến ngày
          <Input
            type="date"
            min="1900-01-01"
            max="9998-12-31"
            required
            value={draft.to}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })}
            className="mt-1 min-h-11"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? id : undefined}
          />
        </label>
        <Button
          type="submit"
          className="min-h-11 bg-orange-700 text-white hover:bg-orange-800"
        >
          Áp dụng
        </Button>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              type="button"
              variant="outline"
              className={`min-h-11 ${compact ? "px-2.5" : ""}`}
              onClick={() => {
                const next = recentRange(days);
                setDraft(next);
                setError(null);
                onChange(next);
              }}
            >
              {days} ngày
            </Button>
          ))}
        </div>
      </div>
      {error && (
        <p id={id} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className={compact ? "sr-only" : "text-xs text-muted-foreground"}>
        Đang xem {dateLabel(value.from)} – {dateLabel(value.to)} · UTC+7 · Bao
        gồm cả hai ngày
      </p>
    </form>
  );
}

export function Distribution({
  items,
}: {
  items: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <dl className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex justify-between gap-3 text-sm">
            <dt>{item.label}</dt>
            <dd className="font-semibold tabular-nums">
              {numberLabel(item.count)}
            </dd>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-orange-600"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </dl>
  );
}

export function TrendChart({
  dates,
  series,
  format = numberLabel,
  compact = false,
}: {
  dates: string[];
  series: { label: string; values: number[] }[];
  format?: (value: number) => string;
  compact?: boolean;
}) {
  const values = series.flatMap((item) => item.values);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const x = (index: number) =>
    68 + (dates.length <= 1 ? 262 : (index / (dates.length - 1)) * 524);
  const y = (value: number) => 192 - ((value - min) / (max - min)) * 168;
  const colors = ["#c2410c", "#0284c7", "#a855f7"];
  const ticks = [
    ...new Set([0, Math.floor((dates.length - 1) / 2), dates.length - 1]),
  ].filter((index) => index >= 0);
  return (
    <figure className="min-w-0">
      <figcaption className="mb-3 flex flex-wrap gap-4 text-xs">
        {series.map((item, index) => (
          <span key={item.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="w-5 border-t-2"
              style={{
                borderColor: colors[index % colors.length],
                borderStyle: index ? "dashed" : "solid",
              }}
            />
            {item.label}
          </span>
        ))}
      </figcaption>
      {values.some((value) => value !== 0) ? (
        <svg
          viewBox="0 0 620 225"
          className={compact ? "h-auto w-full sm:h-[200px]" : "w-full"}
          role="img"
          aria-label={compact ? "Biểu đồ theo ngày. Mở Xem chi tiết để đọc bảng số liệu." : "Biểu đồ theo ngày. Số liệu chi tiết ở bảng bên dưới."}
        >
          {[min, (max + min) / 2, max].map((value, index) => (
            <g key={index}>
              <line
                x1="68"
                x2="592"
                y1={y(value)}
                y2={y(value)}
                stroke="currentColor"
                opacity=".12"
              />
              <text
                x="60"
                y={y(value) + 4}
                textAnchor="end"
                fill="currentColor"
                fontSize="11"
              >
                {new Intl.NumberFormat("vi-VN", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(value)}
              </text>
            </g>
          ))}
          {series.map((item, index) => (
            <g key={item.label}>
              <polyline
                points={item.values
                  .map((value, day) => `${x(day)},${y(value)}`)
                  .join(" ")}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="2.5"
                strokeDasharray={index ? "6 4" : undefined}
              />
              {dates.length === 1 && (
                <circle
                  cx={x(0)}
                  cy={y(item.values[0] ?? 0)}
                  r="4"
                  fill={colors[index % colors.length]}
                />
              )}
            </g>
          ))}
          {ticks.map((index) => (
            <text
              key={index}
              x={x(index)}
              y="216"
              textAnchor="middle"
              fill="currentColor"
              fontSize="11"
            >
              {dateLabel(dates[index]).slice(0, 5)}
            </text>
          ))}
        </svg>
      ) : (
        <p className="flex min-h-40 items-center justify-center rounded-xl bg-muted/40 px-4 text-center text-sm text-muted-foreground">
          Chưa có phát sinh trong khoảng ngày này.
        </p>
      )}
      {!compact && <details className="mt-4">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">
          Xem bảng số liệu theo ngày
        </summary>
        <div className="max-h-72 overflow-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Số liệu theo ngày, giờ Việt Nam
            </caption>
            <thead className="sticky top-0 bg-card">
              <tr>
                <th scope="col" className="whitespace-nowrap p-3">
                  Ngày
                </th>
                {series.map((item) => (
                  <th
                    key={item.label}
                    scope="col"
                    className="whitespace-nowrap p-3 text-right"
                  >
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date, index) => (
                <tr key={date} className="border-t border-border">
                  <th scope="row" className="whitespace-nowrap p-3 font-normal">
                    {dateLabel(date)}
                  </th>
                  {series.map((item) => (
                    <td
                      key={item.label}
                      className="whitespace-nowrap p-3 text-right tabular-nums"
                    >
                      {format(item.values[index] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>}
    </figure>
  );
}
