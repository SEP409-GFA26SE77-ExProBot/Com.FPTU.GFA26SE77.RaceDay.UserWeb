"use client";

import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComplaintPagination({
  page,
  pageSize,
  totalCount,
  onChange,
  disabled = false,
  itemLabel = "khiếu nại",
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  itemLabel?: string;
}) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalCount === 0) return null;
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  return (
    <nav
      aria-label={`Phân trang ${itemLabel}`}
      className="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-4"
    >
      <p className="text-xs text-muted-foreground">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} /{" "}
        {totalCount} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft />
          Trước
        </Button>
        {pages.map((value, index) => (
          <span key={value} className="flex items-center gap-1">
            {index > 0 && value - pages[index - 1] > 1 && (
              <Ellipsis
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <Button
              variant={value === page ? "default" : "ghost"}
              size="icon-sm"
              disabled={disabled}
              aria-label={`Trang ${value}`}
              aria-current={value === page ? "page" : undefined}
              onClick={() => onChange(value)}
            >
              {value}
            </Button>
          </span>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Sau
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
