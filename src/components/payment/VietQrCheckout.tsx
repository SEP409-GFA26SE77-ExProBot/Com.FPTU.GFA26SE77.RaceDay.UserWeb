"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { VietQrFields } from "@/dto/payment.dto";

type VietQrCheckoutProps = VietQrFields & {
  amount: number;
  polling?: boolean;
};

function CopyRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/60 last:border-0">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
        <p
          className={`text-sm break-all ${
            emphasize ? "font-extrabold text-orange-600 text-base" : "font-semibold text-foreground"
          }`}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-500/20 transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Đã chép" : "Sao chép"}
      </button>
    </div>
  );
}

/**
 * QR + thông tin chuyển khoản chung 1 khung RaceDay (không tab PayOS).
 */
export function VietQrCheckout({
  qrCode,
  accountNumber,
  accountName,
  amount,
  transferDescription,
  bin,
  polling,
}: VietQrCheckoutProps) {
  if (!qrCode) return null;

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <p className="text-sm text-muted-foreground leading-snug">
        Mở app ngân hàng để <strong className="text-foreground">quét VietQR</strong> hoặc{" "}
        <strong className="text-foreground">chuyển khoản đúng</strong> số tiền / nội dung bên dưới.
      </p>

      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        <div className="shrink-0 rounded-xl border border-border bg-white p-3 shadow-sm">
          <QRCodeSVG value={qrCode} size={220} level="M" includeMargin={false} />
        </div>

        <div className="flex-1 w-full min-w-0 rounded-xl border border-border bg-muted/30 px-3.5 py-1">
          {accountName && <CopyRow label="Chủ tài khoản" value={accountName} />}
          {accountNumber && <CopyRow label="Số tài khoản" value={accountNumber} />}
          <CopyRow label="Số tiền" value={`${amount.toLocaleString("vi-VN")} VND`} emphasize />
          {(transferDescription || bin) && (
            <CopyRow
              label="Nội dung"
              value={transferDescription || `RaceDay ${bin || ""}`.trim()}
            />
          )}
          {bin && (
            <p className="text-[10px] text-muted-foreground py-2">
              BIN ngân hàng: <span className="font-mono">{bin}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Tổng: <strong className="text-orange-600">{formatPrice(amount)}</strong></span>
        {polling && (
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang chờ xác nhận PayOS…
          </span>
        )}
      </div>
    </div>
  );
}
