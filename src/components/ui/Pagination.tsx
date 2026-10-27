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
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 ${className}`}
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground transition-all hover:border-orange-400 hover:text-orange-600 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, idx) =>
          p === "…" ? (
            <span
              key={`e-${idx}`}
              className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => onChange(p)}
              className={`inline-flex h-9 min-w-9 px-2 items-center justify-center rounded-full text-sm font-semibold transition-all active:scale-95 ${
                p === page
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/25 scale-105"
                  : "border border-border bg-white text-foreground/80 hover:border-orange-400 hover:text-orange-600"
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground transition-all hover:border-orange-400 hover:text-orange-600 disabled:opacity-40 disabled:pointer-events-none active:scale-95"
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
