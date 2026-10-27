"use client";

import { MapPin } from "lucide-react";
import { VN_PROVINCES } from "@/lib/vn-provinces";

const DEFAULT_INPUT =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

type Props = {
  provinceKey: string;
  detail: string;
  onProvinceChange: (key: string) => void;
  onDetailChange: (detail: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Override class cho input/select (profile vs permit form). */
  inputClassName?: string;
};

/**
 * UI tách tỉnh (bắt buộc) + địa chỉ chi tiết.
 * Caller ghép `composeLocation` trước khi PUT `location` lên BE.
 */
export default function OrganizerLocationFields({
  provinceKey,
  detail,
  onProvinceChange,
  onDetailChange,
  disabled,
  invalid,
  inputClassName = DEFAULT_INPUT,
}: Props) {
  const borderInvalid = invalid
    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
    : "";

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            invalid ? "text-red-600" : "text-muted-foreground"
          }`}
        >
          <MapPin className="h-3.5 w-3.5 text-orange-500" />
          Tỉnh / thành phố <span className="text-red-500">*</span>
        </span>
        <select
          value={provinceKey}
          onChange={(e) => onProvinceChange(e.target.value)}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={`${inputClassName} ${borderInvalid}`}
        >
          <option value="">Chọn tỉnh / thành</option>
          {[...VN_PROVINCES]
            .sort((a, b) => a.label.localeCompare(b.label, "vi"))
            .map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground">
          Địa chỉ chi tiết
        </span>
        <input
          type="text"
          value={detail}
          onChange={(e) => onDetailChange(e.target.value)}
          disabled={disabled}
          placeholder="VD: Biển Mỹ Khê, phố đi bộ Nguyễn Huệ…"
          className={inputClassName}
        />
        <p className="text-[11px] text-muted-foreground">
          Lưu thành một địa điểm: chi tiết + tỉnh (dùng filter khám phá giải).
        </p>
      </label>
    </div>
  );
}
