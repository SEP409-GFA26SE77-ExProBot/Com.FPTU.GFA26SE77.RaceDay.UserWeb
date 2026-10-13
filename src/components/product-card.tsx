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
        "group relative w-full overflow-hidden rounded-xl border-0 shadow-lg md:h-[290px] transition-all duration-300",
        isSelectable && "cursor-pointer hover:shadow-2xl",
        checked
          ? "ring-2 ring-[#b6e61f] shadow-[0_0_25px_rgba(182,230,31,0.2)]"
          : "hover:ring-1 hover:ring-[#b6e61f]/40",
        className
      )}
    >
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-[35%_45%_20%]">
        {/* COLUMN 1 - IMAGE */}
        <div className="relative h-[220px] md:h-full w-full bg-[#3a3a3c] flex items-center justify-center p-4">
          <div className="relative h-full w-full">
            <Image
              src={image}
              alt={title}
              fill
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 35vw"
            />
          </div>

          {/* Optional selection badge over image on mobile */}
          {isSelectable && (
            <div className="absolute top-3 left-3 md:hidden">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                  checked
                    ? "bg-[#b6e61f] text-black"
                    : "bg-black/60 text-white/80 backdrop-blur"
                )}
              >
                {checked && <Check className="h-3 w-3 stroke-[3]" />}
                {checked ? "Đã chọn" : "Chưa chọn"}
              </span>
            </div>
          )}
        </div>

        {/* COLUMN 2 - DETAILS */}
        <div className="bg-[#222222] p-6 md:p-8 lg:p-9 flex flex-col justify-center relative">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-condensed text-2xl md:text-[28px] font-bold tracking-wide uppercase text-[#b6e61f] leading-tight">
              {title}
            </h3>

            {/* Checkbox trigger */}
            {isSelectable && (
              <label
                onClick={(e) => e.stopPropagation()}
                className="hidden md:inline-flex items-center gap-2 cursor-pointer select-none rounded-lg bg-black/50 px-3 py-1.5 border border-white/10 hover:border-[#b6e61f]/60 transition-colors shrink-0"
              >
                <input
                  type="checkbox"
                  id={id ? `chk-${id}` : undefined}
                  checked={Boolean(checked)}
                  onChange={(e) => onCheckedChange(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-400 text-[#b6e61f] accent-[#b6e61f] cursor-pointer"
                />
                <span
                  className={cn(
                    "text-xs font-bold tracking-wide uppercase",
                    checked ? "text-[#b6e61f]" : "text-white/80"
                  )}
                >
                  {checked ? "Đã chọn" : "Chọn mục này"}
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
                  className="flex items-center gap-3 text-sm md:text-base font-poppins text-white/95"
                >
                  <Icon className="h-5 w-5 shrink-0 text-[#b6e61f]" />
                  <span className="line-clamp-1">{feature}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 3 - PRICE */}
        <div className="bg-[#3d3d3d] p-6 md:p-7 flex flex-col justify-center border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#b6e61f] relative">
          <h4 className="font-condensed text-2xl md:text-[26px] font-bold tracking-wide uppercase text-[#b6e61f] mb-3">
            Giá mua
          </h4>

          <div className="flex flex-col gap-2.5 md:gap-3 text-sm md:text-base font-poppins text-white">
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="h-5 w-5 shrink-0 text-[#b6e61f]" />
              <span className="text-white/90">
                Đơn giá:{" "}
                <strong className="text-white font-semibold">
                  {pricing.unitPrice}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <User className="h-5 w-5 shrink-0 text-[#b6e61f]" />
              <span className="text-white/90">
                Mức giảm:{" "}
                <strong className="text-emerald-400 font-semibold">
                  {pricing.discount}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="h-5 w-5 shrink-0 text-[#b6e61f]" />
              <span className="text-white/90">
                Giá mua:{" "}
                <strong className="text-[#b6e61f] font-bold text-base md:text-lg">
                  {pricing.finalPrice}
                </strong>
              </span>
            </div>
          </div>

          {/* Checkbox for mobile */}
          {isSelectable && (
            <div className="mt-4 pt-3 border-t border-white/10 flex md:hidden items-center justify-between">
              <span className="text-xs text-white/70">Trạng thái:</span>
              <label
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={(e) => onCheckedChange(e.target.checked)}
                  className="h-4 w-4 rounded text-[#b6e61f] accent-[#b6e61f]"
                />
                <span
                  className={cn(
                    "text-xs font-bold uppercase",
                    checked ? "text-[#b6e61f]" : "text-white/70"
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
