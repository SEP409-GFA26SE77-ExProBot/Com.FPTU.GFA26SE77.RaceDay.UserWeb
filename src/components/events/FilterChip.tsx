"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default function FilterChip({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 h-auto max-w-full whitespace-normal rounded-xl px-3.5 py-2 text-sm leading-snug transition-colors ${
        active
          ? "border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100 hover:text-orange-900"
          : "bg-card text-muted-foreground hover:border-orange-300 hover:text-foreground"
      }`}
    >
      {children}
    </Button>
  );
}
