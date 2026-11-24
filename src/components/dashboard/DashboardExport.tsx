"use client";

import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/error";
import type { DateRange } from "@/lib/dashboard";

export default function DashboardExport({ range, download, disabled = false, compact = false }: {
  range: DateRange;
  download: (format: "xlsx" | "pdf") => Promise<Blob>;
  disabled?: boolean;
  compact?: boolean;
}) {
  const lock = useRef(false);
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function exportFile(format: "xlsx" | "pdf") {
    if (lock.current) return;
    lock.current = true;
    setBusy(format);
    setError("");
    setMessage("");
    try {
      const blob = await download(format);
      if (!blob.size) throw new Error("Empty report");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-${range.from}-${range.to}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`Đã tạo báo cáo ${format === "xlsx" ? "Excel" : "PDF"}.`);
    } catch (error) {
      let detail: unknown = error;
      if (isAxiosError(error) && error.response?.data instanceof Blob) {
        try { detail = { response: { data: JSON.parse(await error.response.data.text()) } }; } catch { /* Use fallback for a non-JSON error body. */ }
      }
      setError(getApiErrorMessage(detail, "Không thể xuất dashboard. Vui lòng thử lại."));
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Xuất báo cáo dashboard" aria-busy={busy !== null}>
        {(["xlsx", "pdf"] as const).map((format) => (
          <Button key={format} type="button" variant="outline" className="min-h-11 gap-2"
            aria-label={compact ? busy === format ? "Đang xuất…" : `Xuất ${format === "xlsx" ? "Excel" : "PDF"}` : undefined}
            disabled={disabled || busy !== null} onClick={() => void exportFile(format)}>
            {busy === format ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
            {busy === format ? "Đang xuất…" : `${compact ? "" : "Xuất "}${format === "xlsx" ? "Excel" : "PDF"}`}
          </Button>
        ))}
      </div>
      <p className={compact ? "sr-only" : "text-xs text-muted-foreground"}>Xuất toàn dashboard: biểu đồ theo kỳ đã áp dụng; chỉ số hiện tại được tải lại khi xuất.</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <p role="status" className={compact && !message ? "sr-only" : "text-sm text-muted-foreground"}>{message}</p>
    </div>
  );
}
