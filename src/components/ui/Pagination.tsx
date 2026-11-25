"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onChange,
  disabled = false,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1 || totalItems === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const pages = buildPages(page, totalPages);

  return (
    <nav
      className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 pt-2 ${className}`}
      aria-label="Phân trang"
    >
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        Hiển thị{" "}
        <span className="font-semibold text-foreground">
          {from}–{to}
        </span>{" "}
        / {totalItems}
      </p>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-orange-400 hover:text-orange-700 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span aria-current="page" className="min-w-24 text-center text-sm font-semibold tabular-nums sm:hidden">Trang {page} / {totalPages}</span>

        {pages.map((p, idx) =>
          p === "…" ? (
            <span
              key={`e-${idx}`}
              aria-hidden="true"
              className="hidden size-9 items-center justify-center text-muted-foreground sm:inline-flex"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p)}
              aria-label={`Trang ${p}`}
              className={`hidden h-11 min-w-11 px-2 items-center justify-center rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 sm:inline-flex ${
                p === page
                  ? "bg-orange-700 text-white shadow-sm"
                  : "border border-border bg-card text-foreground/80 hover:border-orange-400 hover:text-orange-700"
              }`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-orange-400 hover:text-orange-700 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
