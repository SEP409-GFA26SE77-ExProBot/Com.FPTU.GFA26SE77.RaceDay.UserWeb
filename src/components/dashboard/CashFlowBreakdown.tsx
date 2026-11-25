import { ChevronDown } from "lucide-react";
import type { RevenueTrendDto } from "@/dto/dashboard.dto";
import { dateLabel, moneyLabel } from "@/lib/dashboard";

export default function CashFlowBreakdown({ series }: { series: RevenueTrendDto["series"][number] }) {
  const signed = (value: number, sign: string) => `${value === 0 ? "" : sign}${moneyLabel(Math.abs(value), series.currency)}`;
  return (
    <div className="space-y-2">
      {([
        { field: "collected", title: "Tiền vào", sign: "+", total: series.totalCollected, description: "Tiền vé đã thanh toán thành công, theo ngày thực thu trong kỳ.", tone: "bg-emerald-50 text-emerald-800" },
        { field: "refunded", title: "Tiền ra", sign: "−", total: series.totalRefunded, description: "Tiền hoàn vé thành công, theo ngày hoàn trong kỳ. Phí nền tảng và tiền rút ví được theo dõi riêng.", tone: "bg-rose-50 text-rose-800" },
      ] as const).map((flow) => {
        const days = series.days.filter((day) => day[flow.field] > 0);
        return (
          <details key={flow.field} className="group rounded-xl border border-border">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 focus-visible:outline-2 focus-visible:outline-orange-600 [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-base font-bold ${flow.tone}`}>{flow.sign}</span>
              <span className="min-w-0 flex-1 text-sm font-semibold">{flow.title}</span>
              <span className="min-w-0 max-w-[55%] break-words text-right text-sm font-bold tabular-nums sm:text-base">{signed(flow.total, flow.sign)}</span>
              <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <div className="space-y-3 border-t border-border p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">{flow.description}</p>
              {days.length ? <>
                <p className="text-xs font-medium">{days.length} ngày có phát sinh</p>
                <ul aria-label={`${flow.title} theo ngày (${series.currency})`} tabIndex={0} className="max-h-40 space-y-2 overflow-y-auto rounded-lg bg-muted/40 p-3 focus-visible:outline-2 focus-visible:outline-orange-600">
                  {days.map((day) => <li key={day.date} className="flex items-start justify-between gap-3 text-xs">
                    <time dateTime={day.date} className="shrink-0">{dateLabel(day.date)}</time>
                    <span className="min-w-0 break-words text-right font-semibold tabular-nums">{signed(day[flow.field], flow.sign)}</span>
                  </li>)}
                </ul>
              </> : <p className="text-sm text-muted-foreground">{flow.field === "collected" ? "Chưa có tiền vé thu thành công trong kỳ." : "Chưa có tiền hoàn vé thành công trong kỳ."}</p>}
            </div>
          </details>
        );
      })}
      <div className="rounded-xl bg-muted/40 p-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold">Chênh lệch</p>
          <p className={`min-w-0 break-words text-right text-base font-bold tabular-nums ${series.netCashFlow < 0 ? "text-rose-800" : series.netCashFlow > 0 ? "text-emerald-800" : "text-foreground"}`}>{signed(series.netCashFlow, series.netCashFlow < 0 ? "−" : "+")}</p>
        </div>
        <p className="mt-1 break-words text-xs text-muted-foreground">{moneyLabel(series.totalCollected, series.currency)} − {moneyLabel(series.totalRefunded, series.currency)} = {signed(series.netCashFlow, series.netCashFlow < 0 ? "−" : "+")}</p>
        <p className="mt-1 text-xs text-muted-foreground">Tiền vào − tiền ra (hoàn vé). Chưa trừ phí; không phải lợi nhuận hay số dư ví.</p>
      </div>
    </div>
  );
}
