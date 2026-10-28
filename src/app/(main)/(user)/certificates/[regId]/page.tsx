"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, Info } from "lucide-react";
import { getRegistrationCertificate } from "@/api/events";
import type { RunnerCertificateDto } from "@/dto/certificate.dto";
import { formatDate, getRegistrationStatusLabel } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";
import { Button } from "@/components/ui/button";
import ParticipationCertificate from "@/components/certificates/ParticipationCertificate";
import type { CertificateDetails } from "@/lib/certificate-canvas";

export default function CertificateDetailPage() {
  const params = useParams();
  const regId = String(params.regId);
  return <CertificateContent key={regId} regId={regId} />;
}

function CertificateContent({ regId }: { regId: string }) {
  const [certificate, setCertificate] = useState<RunnerCertificateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getRegistrationCertificate(regId);
        if (cancelled) return;
        if (result === false) {
          setCertificate(null);
          setError("Bạn chưa hoàn thành giải hoặc kết quả hoàn thành chưa được ghi nhận.");
          return;
        }
        setCertificate(result);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được chứng nhận. Vui lòng thử lại."));
          setCertificate(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [regId, loadAttempt]);

  const details = useMemo<CertificateDetails | null>(() => certificate ? {
    runnerName: certificate.runnerName,
    eventName: certificate.eventName,
    bib: certificate.bib || "Chưa cấp",
    distance: certificate.distance,
    raceDate: formatDate(`${certificate.raceDate}T00:00:00`),
    status: getRegistrationStatusLabel(certificate.status),
    registrationId: certificate.registrationId,
    finishTime: certificate.finishTime,
    pace: certificate.pace,
  } : null, [certificate]);

  if (loading) {
    return (
      <PageLoading
        title="Đang tải chứng nhận…"
        description="Đang kiểm tra kết quả hoàn thành giải của bạn."
        icon={Award}
      />
    );
  }

  if (error || !certificate || !details) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <Award aria-hidden="true" className="size-12 text-orange-700" />
        <h1 className="text-2xl font-bold">Chưa thể tải chứng nhận</h1>
        <p role="alert" className="max-w-md text-sm text-muted-foreground">{error || "Không tìm thấy chứng nhận của bạn."}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => { setLoading(true); setLoadAttempt((attempt) => attempt + 1); }} className="min-h-11 rounded-xl bg-orange-700 px-5 text-white hover:bg-orange-800">Thử lại</Button>
          <Button asChild variant="outline" className="min-h-11 rounded-xl px-5"><Link href="/certificates">Về danh sách</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL_FORM} py-6 sm:py-8 space-y-6`}>
      <Link
        href="/certificates"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Tất cả chứng nhận
      </Link>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-orange-700">Dấu ấn trên đường chạy</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Chứng nhận tham gia</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">Lưu lại cột mốc của bạn cùng {details.eventName}. Tải chứng nhận dưới dạng PDF để lưu giữ hoặc chia sẻ.</p>
      </div>

      <ParticipationCertificate key={`${certificate.registrationId}-${certificate.finishedAtUtc}`} details={details} />

      <section aria-labelledby="certificate-details-title" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 id="certificate-details-title" className="text-base font-bold">Thông tin đăng ký</h2>
        <dl className="mt-4 grid gap-x-6 gap-y-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Vận động viên", details.runnerName], ["Giải chạy", details.eventName], ["Số BIB", details.bib],
            ["Cự ly", details.distance], ["Ngày thi đấu", details.raceDate], ["Trạng thái", details.status],
            ["Thời gian hoàn thành", details.finishTime],
            ["Pace trung bình", `${details.pace} phút/km`],
          ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}
        </dl>
        <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Chứng nhận được tạo từ kết quả hoàn thành đã ghi nhận trên RaceDay, không thay thế chứng nhận thành tích chính thức của BTC.</p>
      </section>
    </div>
  );
}
