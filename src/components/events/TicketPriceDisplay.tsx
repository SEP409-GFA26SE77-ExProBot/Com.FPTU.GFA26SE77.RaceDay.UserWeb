import { formatPrice } from "@/lib/format";
import type { ResolvedTicketPrice } from "@/lib/ticket-pricing";

function formatYmdVi(ymd: string): string {
  if (!ymd || ymd.length < 10) return ymd;
  const [y, m, d] = ymd.slice(0, 10).split("-");
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
}

export function formatPhaseWindow(phase: {
  dateFrom: string;
  dateTo: string;
}): string {
  const from = phase.dateFrom ? formatYmdVi(phase.dateFrom) : "";
  const to = phase.dateTo ? formatYmdVi(phase.dateTo) : "";
  if (from && to) return `${from} – ${to}`;
  if (from) return `từ ${from}`;
  if (to) return `đến ${to}`;
  return "";
}

type Size = "sm" | "md" | "lg";

/**
 * Giá hiện tại + gạch giá gốc khi đang đợt ưu tiên; kèm tên phase + cửa sổ ngày.
 */
export default function TicketPriceDisplay({
  ticket,
  size = "md",
  align = "center",
  showWindow = true,
}: {
  ticket: ResolvedTicketPrice;
  size?: Size;
  align?: "left" | "center" | "right";
  showWindow?: boolean;
}) {
  const strike =
    ticket.phase &&
    !ticket.phase.isStandard &&
    ticket.basePrice > 0 &&
    ticket.basePrice > ticket.price;

  const alignCls =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  const priceCls =
    size === "lg"
      ? "text-3xl font-extrabold text-orange-600"
      : size === "sm"
        ? "text-base font-extrabold text-orange-600"
        : "text-lg font-extrabold text-orange-600";

  const strikeCls =
    size === "lg"
      ? "text-sm text-muted-foreground line-through"
      : "text-xs text-muted-foreground line-through";

  const window = ticket.phase ? formatPhaseWindow(ticket.phase) : "";

  return (
    <div className={`flex flex-col gap-0.5 ${alignCls}`}>
      {strike ? <span className={strikeCls}>{formatPrice(ticket.basePrice)}</span> : null}
      <span className={priceCls}>{formatPrice(ticket.price)}</span>
      {ticket.phase ? (
        <span className="max-w-[14rem] text-[10px] font-semibold leading-snug text-muted-foreground">
          {ticket.phase.name}
          {showWindow && window ? (
            <span className="font-medium text-muted-foreground/80">
              {" "}
              · {window}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="text-[10px] font-medium text-muted-foreground">
          Giá niêm yết
        </span>
      )}
    </div>
  );
}
