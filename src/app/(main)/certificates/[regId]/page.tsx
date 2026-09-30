"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Award, ArrowLeft, Download, Flag } from "lucide-react";
import { getCertificate } from "@/data/mock-results";
import { getEventById, formatDate } from "@/data/mock-events";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";

export default function CertificatePage() {
  const params = useParams();
  const regId = String(params.regId);
  const result = getCertificate(regId);
  const event = result ? getEventById(result.eventId) : undefined;

  if (!result || result.status !== "finished" || !result.certificateId) {
    return (
      <div className={`${PAGE_SHELL_FORM} max-w-lg py-14 text-center space-y-4`}>
        <Award className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Chưa có chứng nhận</h1>
        <p className="text-sm text-muted-foreground">
          Chứng nhận finisher chỉ cấp khi bạn đã hoàn thành giải và kết quả được công bố.
        </p>
        <Link href="/my-registrations" className="text-orange-600 font-semibold text-sm">
          Về vé của tôi
        </Link>
      </div>
    );
  }

  const handlePrint = () => window.print();

  return (
    <div className={`${PAGE_SHELL_FORM} max-w-3xl py-7 space-y-6`}>
      <Link
        href={`/results/${result.eventId}?bib=${result.bib}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground print:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Về kết quả
      </Link>

      <div className="rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 via-white to-red-50 p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
        <div className="absolute top-4 left-4 opacity-20">
          <Flag className="h-16 w-16 text-orange-600" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">RaceDay</p>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
          Chứng nhận hoàn thành
        </h1>
        <p className="mt-6 text-muted-foreground text-sm">Chứng nhận rằng</p>
        <p className="mt-2 text-3xl font-extrabold text-foreground">{result.name}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          đã hoàn thành hạng mục <strong>{result.distanceLabel}</strong>
        </p>
        <p className="mt-1 text-lg font-bold">{event?.title}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {event ? formatDate(event.date) : ""} · BIB {result.bib}
        </p>
        <div className="mt-8 inline-flex flex-col items-center rounded-2xl bg-white/80 border px-8 py-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Thời gian về đích
          </p>
          <p className="text-3xl font-extrabold tabular-nums text-orange-600">
            {result.finishTime}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Hạng #{result.rankOverall} tổng · #{result.rankGender} theo giới
          </p>
        </div>
        <p className="mt-8 text-[11px] text-muted-foreground">
          Mã chứng nhận: {result.certificateId}
        </p>
      </div>

      <div className="flex justify-center print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white"
        >
          <Download className="h-4 w-4" />
          Tải / In chứng nhận
        </button>
      </div>
    </div>
  );
}
