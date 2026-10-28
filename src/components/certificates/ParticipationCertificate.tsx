"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileCheck2, LoaderCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CERTIFICATE_HEIGHT, CERTIFICATE_WIDTH, drawParticipationCertificate, type CertificateDetails } from "@/lib/certificate-canvas";
import { certificateFileName, createCertificatePdf } from "@/lib/certificate-pdf";

export default function ParticipationCertificate({ details }: { details: CertificateDetails }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderAttempt, setRenderAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const font = getComputedStyle(canvas).fontFamily;
        const content = Object.values(details).join(" ");
        await Promise.all([document.fonts.load(`400 24px ${font}`, content), document.fonts.load(`700 48px ${font}`, content), document.fonts.load(`800 48px ${font}`, content)]);
        if (cancelled) return;
        drawParticipationCertificate(canvas, details, font);
        setReady(true);
        setError(null);
      } catch {
        if (!cancelled) setError("Chưa thể tạo chứng nhận. Vui lòng thử lại.");
      }
    };
    void render();
    return () => { cancelled = true; };
  }, [details, renderAttempt]);

  const download = async () => {
    if (!canvasRef.current || !ready || downloading) return;
    setDownloading(true);
    setError(null);
    try {
      const canvas = canvasRef.current;
      const image = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Không thể tạo ảnh chứng nhận.")), "image/jpeg", 0.98);
      });
      const pdf = createCertificatePdf(new Uint8Array(await image.arrayBuffer()), canvas.width, canvas.height);
      const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = certificateFileName(details.runnerName, details.bib === "Chưa cấp" ? details.registrationId : details.bib);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Không tải được chứng nhận. Vui lòng thử lại.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3 sm:px-6">
          <p className="inline-flex items-center gap-2 text-sm font-semibold"><FileCheck2 aria-hidden="true" className="size-4 text-orange-700" />Bản xem trước chứng nhận</p>
          <span className="text-xs text-muted-foreground">PDF · A4 ngang</span>
        </div>
        <div className="relative bg-[#eee9e1] p-2 sm:p-6 lg:p-8" aria-busy={!ready && !error}>
          <div className="relative overflow-hidden bg-[#fffcf7] shadow-md" style={{ aspectRatio: `${CERTIFICATE_WIDTH} / ${CERTIFICATE_HEIGHT}` }}>
            {!ready && <Skeleton aria-hidden="true" className="absolute inset-0 rounded-none" />}
            <canvas ref={canvasRef} role="img" aria-label={`Chứng nhận tham gia ${details.eventName} của ${details.runnerName}. BIB ${details.bib}, cự ly ${details.distance}, ngày ${details.raceDate}, thời gian hoàn thành ${details.finishTime}, pace trung bình ${details.pace} phút/km.`}
              width={CERTIFICATE_WIDTH} height={CERTIFICATE_HEIGHT} className={`block h-auto w-full ${ready ? "opacity-100" : "opacity-0"}`}>
              Chứng nhận tham gia của {details.runnerName} tại {details.eventName}, thời gian hoàn thành {details.finishTime}, pace trung bình {details.pace} phút/km.
            </canvas>
          </div>
        </div>
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <p>{error}</p>
        {!ready && <Button type="button" variant="outline" onClick={() => setRenderAttempt((attempt) => attempt + 1)} className="mt-3 min-h-11 bg-card">Thử lại</Button>}
      </div>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" disabled={!ready || downloading} onClick={() => void download()} aria-busy={downloading}
            className="min-h-12 rounded-xl bg-orange-700 px-5 text-sm font-semibold text-white hover:bg-orange-800">
            {downloading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
            {downloading ? "Đang tạo PDF…" : "Tải chứng nhận"}
          </Button>
          <Button asChild variant="outline" className="min-h-12 rounded-xl px-5"><Link href={`/my-registrations/${details.registrationId}`}><Ticket aria-hidden="true" className="size-4" />Xem vé & QR</Link></Button>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">Tệp PDF chỉ chứa chứng nhận của bạn, sẵn sàng để lưu hoặc chia sẻ.</p>
      </div>
    </div>
  );
}
