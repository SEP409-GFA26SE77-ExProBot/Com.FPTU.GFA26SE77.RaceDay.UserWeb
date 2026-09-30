"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, CheckCircle2, FileUp, Flag } from "lucide-react";
import { getEventById } from "@/data/mock-events";
import { getResultByEventAndBib } from "@/data/mock-results";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

function DisputeForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = Number(params.eventId);
  const bib = Number(searchParams.get("bib") || "1234");
  const event = getEventById(eventId);
  const result = getResultByEventAndBib(eventId, bib);

  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="font-bold">Không tìm thấy giải</p>
        <Link href="/results" className="text-orange-600 text-sm">
          Quay lại
        </Link>
      </div>
    );
  }

  if (!result || result.status !== "finished") {
    return (
      <div className={`${PAGE_SHELL_FORM} max-w-lg py-14 text-center space-y-3`}>
        <h1 className="text-xl font-bold">Không thể khiếu nại</h1>
        <p className="text-sm text-muted-foreground">
          Chỉ khiếu nại khi đã có kết quả chính thức (trạng thái về đích).
        </p>
        <Link href={`/results/${eventId}`} className="text-orange-600 font-semibold text-sm">
          Về trang kết quả
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className={`${PAGE_SHELL_FORM} max-w-lg py-14 text-center space-y-4`}>
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="text-2xl font-bold">Đã gửi khiếu nại</h1>
        <p className="text-muted-foreground text-sm">
          BTC sẽ xem xét và phản hồi. Lý do & bằng chứng đã được ghi nhận (mock).
        </p>
        <button
          type="button"
          onClick={() => router.push(`/results/${eventId}?bib=${bib}`)}
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Về kết quả
        </button>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!reason.trim()) err.reason = "Vui lòng chọn lý do khiếu nại.";
    if (detail.trim().length < 20) err.detail = "Mô tả chi tiết tối thiểu 20 ký tự.";
    if (!file) err.file = "Vui lòng đính kèm bằng chứng (ảnh/PDF ≤ 5MB).";
    else if (file.size > 5 * 1024 * 1024) err.file = "File tối đa 5MB.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setDone(true);
  };

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-2xl py-7 space-y-6`}>
      <Link
        href={`/results/${eventId}?bib=${bib}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại kết quả
      </Link>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Khiếu nại kết quả</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {event.title} · BIB {bib} · {result.finishTime}
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border bg-card p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold mb-1.5 block">Lý do *</label>
          <select
            className={`w-full rounded-xl border px-3 py-2.5 text-sm ${errors.reason ? "border-red-400" : "border-border"}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">Chọn lý do</option>
            <option value="wrong_time">Sai thời gian chip / split</option>
            <option value="wrong_rank">Sai hạng</option>
            <option value="missing_split">Thiếu checkpoint</option>
            <option value="other">Khác</option>
          </select>
          {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block">Mô tả chi tiết *</label>
          <textarea
            rows={4}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm ${errors.detail ? "border-red-400" : "border-border"}`}
            placeholder="Giải thích rõ vấn đề và thời điểm..."
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
          {errors.detail && <p className="text-xs text-red-500 mt-1">{errors.detail}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block">
            <FileUp className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
            Bằng chứng * (ảnh/PDF)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-bold text-white"
        >
          Gửi khiếu nại
        </button>
      </form>
    </div>
  );
}

export default function DisputePage() {
  return (
    <Suspense
      fallback={
        <PageLoading
          title="Đang tải form khiếu nại…"
          description="Chuẩn bị dữ liệu kết quả và BIB."
          icon={Flag}
        />
      }
    >
      <DisputeForm />
    </Suspense>
  );
}
