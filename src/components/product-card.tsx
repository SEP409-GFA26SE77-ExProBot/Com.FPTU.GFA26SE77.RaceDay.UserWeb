import * as React from "react";
import Image from "next/image";
import { CalendarCheck, User, Clock, MapPin, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ProductPricing {
  unitPrice: string;
  discount: string;
  finalPrice: string;
}

export interface ProductCardProps {
  id?: string;
  image: string;
  title: string;
  features: string[];
  pricing: ProductPricing;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  showCheckbox?: boolean;
  className?: string;
}

const FEATURE_ICONS = [CalendarCheck, User, Clock, MapPin];

export function ProductCard({
  id,
  image,
  title,
  features,
  pricing,
  checked,
  onCheckedChange,
  showCheckbox = true,
  className,
}: ProductCardProps) {
  const isSelectable = showCheckbox && typeof onCheckedChange === "function";

  const handleToggle = () => {
    if (isSelectable) {
      onCheckedChange(!checked);
    }
  };

  return (
    <Card
      onClick={isSelectable ? handleToggle : undefined}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs md:h-[280px] transition-all duration-200",
        isSelectable && "cursor-pointer hover:shadow-md",
        checked
          ? "ring-2 ring-orange-500 border-orange-500 shadow-md bg-orange-500/[0.015]"
          : "hover:border-orange-500/40",
        className
      )}
    >
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-[32%_45%_23%]">
        {/* COLUMN 1 - IMAGE */}
        <div className="relative h-[210px] md:h-full w-full bg-slate-50/80 border-b md:border-b-0 md:border-r border-border/60 flex items-center justify-center p-6">
          <div className="relative h-full w-full">
            <Image
              src={image}
              alt={title}
              fill
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 32vw"
            />
          </div>

          {/* Selection indicator pill on mobile */}
          {isSelectable && (
            <div className="absolute top-3 left-3 md:hidden">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-xs",
                  checked
                    ? "bg-orange-500 text-white"
                    : "bg-background/90 text-foreground border border-border/70 backdrop-blur"
                )}
              >
                {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                {checked ? "Đã chọn" : "Chưa chọn"}
              </span>
            </div>
          )}
        </div>

        {/* COLUMN 2 - DETAILS */}
        <div className="bg-card p-6 md:p-7 flex flex-col justify-center relative">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
              {title}
            </h3>

            {/* Checkbox trigger button */}
            {isSelectable && (
              <label
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "hidden md:inline-flex items-center gap-2 cursor-pointer select-none rounded-xl px-3 py-1.5 border transition-all shrink-0",
                  checked
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-muted/30 text-muted-foreground border-border/70 hover:bg-muted/60"
                )}
              >
                <input
                  type="checkbox"
                  id={id ? `chk-${id}` : undefined}
                  checked={Boolean(checked)}
                  onChange={(e) => onCheckedChange(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-orange-600 accent-orange-600 cursor-pointer"
                />
                <span className="text-xs font-bold">
                  {checked ? "Đã chọn" : "Chọn mục"}
                </span>
              </label>
            )}
          </div>

          <div className="flex flex-col gap-2.5 md:gap-3">
            {features.slice(0, 4).map((feature, idx) => {
              const Icon = FEATURE_ICONS[idx % FEATURE_ICONS.length];
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-sm text-foreground/80"
                >
                  <Icon className="h-4.5 w-4.5 shrink-0 text-orange-500" />
                  <span className="line-clamp-1">{feature}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 3 - PRICE */}
        <div className="bg-muted/15 p-6 md:p-7 flex flex-col justify-center border-t md:border-t-0 md:border-l border-dashed border-border/80 relative">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Chi phí &amp; Ưu đãi
          </span>

          <div className="flex flex-col gap-2 text-sm text-foreground">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Đơn giá:</span>
              <strong className="text-sm font-semibold text-foreground">
                {pricing.unitPrice}
              </strong>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Mức giảm:</span>
              <strong className="text-sm font-semibold text-emerald-600">
                {pricing.discount}
              </strong>
            </div>

            <div className="mt-2 pt-2 border-t border-border/60 flex flex-col gap-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                Giá mua
              </span>
              <span className="text-xl md:text-2xl font-extrabold text-orange-600 leading-tight">
                {pricing.finalPrice}
              </span>
            </div>
          </div>

          {/* Checkbox for mobile */}
          {isSelectable && (
            <div className="mt-4 pt-3 border-t border-border/60 flex md:hidden items-center justify-between">
              <span className="text-xs text-muted-foreground">Lựa chọn:</span>
              <label
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={(e) => onCheckedChange(e.target.checked)}
                  className="h-4 w-4 rounded text-orange-600 accent-orange-600"
                />
                <span
                  className={cn(
                    "text-xs font-bold",
                    checked ? "text-orange-600" : "text-muted-foreground"
                  )}
                >
                  {checked ? "Đã chọn" : "Chọn mục"}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
