"use client";

import { getAuthUser } from "@/stores/auth-store";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Camera,
  Download,
  Eye,
  Flag,
  Loader2,
  LogIn,
  Search,
  Ticket,
} from "lucide-react";
import { getMyRegistrations } from "@/api/events";
import { createPhotoDispute, searchPhotos } from "@/api/photos";
import type { RegistrationDto } from "@/dto/event.dto";
import type { PhotoListItemDto } from "@/dto/photo.dto";
import { downloadPhotoById } from "@/lib/download-photo";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL } from "@/lib/page-shell";
import { toastError, toastSuccess } from "@/lib/toast";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import PhotoDisputeModal from "@/components/photos/PhotoDisputeModal";
import PhotoViewerModal from "@/components/photos/PhotoViewerModal";

const PAGE_SIZE = 10;

type BibOption = {
  key: string;
  eventId: string;
  eventName: string;
  bibNumber: string;
};

function PhotosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bibFromUrl = (searchParams.get("bib") || "").trim();
  const eventFromUrl = (searchParams.get("eventId") || "").trim();
  const pageFromUrl = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1
  );

  const loggedIn = Boolean(getAuthUser());
  const [regs, setRegs] = useState<RegistrationDto[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(true);

  const [eventId, setEventId] = useState(eventFromUrl);
  const [bib, setBib] = useState(bibFromUrl);
  const [page, setPage] = useState(pageFromUrl);
  const [photos, setPhotos] = useState<PhotoListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disputePhoto, setDisputePhoto] = useState<PhotoListItemDto | null>(
    null
  );
  const [viewPhoto, setViewPhoto] = useState<PhotoListItemDto | null>(null);
  const [reporting, setReporting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const bibOptions = useMemo((): BibOption[] => {
    const map = new Map<string, BibOption>();
    for (const r of regs) {
      const b = (r.bibNumber || "").trim();
      if (!b || !r.eventId) continue;
      const key = `${r.eventId}:${b.toUpperCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          eventId: r.eventId,
          eventName: r.eventName || "Giải",
          bibNumber: b,
        });
      }
    }
    return Array.from(map.values());
  }, [regs]);

  const selectedEventName = useMemo(() => {
    const hit = bibOptions.find((o) => o.eventId === eventId);
    return hit?.eventName || "";
  }, [bibOptions, eventId]);

  useEffect(() => {
    if (!loggedIn) {
      setLoadingRegs(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await getMyRegistrations();
        if (cancelled) return;
        setRegs(
          (Array.isArray(list) ? list : []).filter((r) => Boolean(r.bibNumber))
        );
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được đăng ký."));
          setRegs([]);
        }
      } finally {
        if (!cancelled) setLoadingRegs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  // URL chỉ có bib → map event từ đăng ký
  useEffect(() => {
    if (!bibFromUrl || eventFromUrl || bibOptions.length === 0) return;
    const hit = bibOptions.find(
      (o) => o.bibNumber.toUpperCase() === bibFromUrl.toUpperCase()
    );
    if (hit) {
      setEventId(hit.eventId);
      setBib(hit.bibNumber);
    }
  }, [bibFromUrl, eventFromUrl, bibOptions]);

  const runSearch = useCallback(
    async (
      nextEventId: string,
      nextBib: string,
      nextPage = 1,
      syncUrl = true
    ) => {
      const eId = nextEventId.trim();
      const b = nextBib.trim();
      if (!eId || !b) {
        setError("Chọn giải và nhập số BIB.");
        return;
      }
      let safePage = Math.max(1, nextPage);
      setSearching(true);
      setError(null);
      setSearched(true);
      try {
        let result = await searchPhotos({
          eventId: eId,
          bib: b,
          page: safePage,
          pageSize: PAGE_SIZE,
        });
        // Hết trang (sau dispute / URL page quá lớn) → về trang cuối còn ảnh.
        const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
        if (result.total > 0 && safePage > pages) {
          safePage = pages;
          result = await searchPhotos({
            eventId: eId,
            bib: b,
            page: safePage,
            pageSize: PAGE_SIZE,
          });
        }
        setPage(safePage);
        setPhotos(result.items);
        setTotal(result.total);
        if (syncUrl) {
          const qs = new URLSearchParams({
            eventId: eId,
            bib: b,
            page: String(safePage),
          });
          router.replace(`/photos?${qs.toString()}`, { scroll: false });
        }
      } catch (e) {
        setPhotos([]);
        setTotal(0);
        setError(getApiErrorMessage(e, "Không tìm được ảnh."));
      } finally {
        setSearching(false);
      }
    },
    [router]
  );

  // Auto-search một lần khi đã có eventId + bib
  useEffect(() => {
    if (!loggedIn || loadingRegs || searched || searching) return;
    const eId = eventId.trim();
    const b = bib.trim();
    if (!eId || !b) return;
    void runSearch(eId, b, pageFromUrl);
  }, [
    loggedIn,
    loadingRegs,
    eventId,
    bib,
    pageFromUrl,
    searched,
    searching,
    runSearch,
  ]);

  const pickBib = (opt: BibOption) => {
    setEventId(opt.eventId);
    setBib(opt.bibNumber);
    void runSearch(opt.eventId, opt.bibNumber, 1);
  };

  const goToPage = (next: number) => {
    if (next < 1 || next === page || searching) return;
    void runSearch(eventId, bib, next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownload = async (photo: PhotoListItemDto) => {
    try {
      const bibPart =
        photo.tags?.map((t) => t.bib).filter(Boolean).join("-") ||
        bib ||
        "photo";
      await downloadPhotoById(photo.id, `raceday-bib-${bibPart}.jpg`);
      toastSuccess("Đã tải ảnh.");
    } catch (e) {
      toastError(getApiErrorMessage(e, "Tải ảnh thất bại."));
    }
  };

  const submitDispute = async (reason: string) => {
    if (!disputePhoto) return;
    setReporting(true);
    try {
      await createPhotoDispute(disputePhoto.id, reason);
      toastSuccess("Đã gửi khiếu nại — photographer sẽ xem lại.");
      setDisputePhoto(null);
      // Reload trang hiện tại (nếu trống sẽ tự lùi trang trong runSearch).
      await runSearch(eventId, bib, page, true);
    } catch (e) {
      toastError(getApiErrorMessage(e, "Gửi khiếu nại thất bại."));
    } finally {
      setReporting(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Đăng nhập để tìm ảnh theo BIB</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Đăng nhập để xem ảnh sự kiện đã gắn số BIB của bạn.
        </p>
        <Link
          href="/login?from=/photos"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (loadingRegs) {
    return (
      <PageLoading
        title="Đang tải…"
        description="Đang tải danh sách giải và BIB của bạn…"
        icon={Camera}
      />
    );
  }

  return (
    <div className={`${PAGE_SHELL} space-y-6 py-7`}>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-500">
          Ảnh sự kiện
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Tìm ảnh theo BIB
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Nhập số BIB để xem ảnh sự kiện đã được gắn với bạn. Chỉ hiển thị ảnh
          đã sẵn sàng xem — ảnh đang xử lý sẽ xuất hiện sau khi BTC hoàn tất.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(eventId, bib, 1);
        }}
      >
        <label className="min-w-0 flex-1 space-y-1.5 text-sm">
          <span className="font-semibold text-foreground">Giải</span>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          >
            <option value="">— Chọn giải có BIB —</option>
            {[...new Map(bibOptions.map((o) => [o.eventId, o])).values()].map(
              (o) => (
                <option key={o.eventId} value={o.eventId}>
                  {o.eventName}
                </option>
              )
            )}
          </select>
        </label>
        <label className="w-full space-y-1.5 text-sm sm:w-40">
          <span className="font-semibold text-foreground">Số BIB</span>
          <input
            value={bib}
            onChange={(e) => setBib(e.target.value)}
            placeholder="vd. A1001"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-orange-400"
          />
        </label>
        <button
          type="submit"
          disabled={searching || !eventId.trim() || !bib.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Tìm
        </button>
      </form>

      {bibOptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-bold">
            <Ticket className="h-4 w-4 text-orange-500" />
            BIB của bạn
          </h2>
          <ul className="flex flex-wrap gap-2">
            {bibOptions.map((o) => (
              <li key={o.key}>
                <button
                  type="button"
                  onClick={() => pickBib(o)}
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-orange-500/40 ${
                    eventId === o.eventId &&
                    bib.toUpperCase() === o.bibNumber.toUpperCase()
                      ? "border-orange-500 bg-orange-500/10 text-orange-700"
                      : ""
                  }`}
                >
                  BIB {o.bibNumber} · {o.eventName}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {searching && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          Đang tìm ảnh…
        </div>
      )}

      {!searching && searched && photos.length === 0 && !error && (
        <div className="space-y-3 rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-bold">Chưa có ảnh cho BIB này</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Có thể ảnh chưa được tải lên hoặc đang xử lý. Thử lại sau, hoặc kiểm
            tra lại số BIB và giải bạn đã chọn.
          </p>
        </div>
      )}

      {!searching && photos.length > 0 && (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <Flag className="mr-1 inline h-3.5 w-3.5 text-orange-500" />
            {total} ảnh · BIB <span className="font-semibold">{bib}</span>
            {totalPages > 1 ? (
              <span>
                {" "}
                · trang {page}/{totalPages}
              </span>
            ) : null}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((p) => {
              const src = mediaDisplayUrl(p.url);
              return (
                <li
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setViewPhoto(p)}
                    className="relative aspect-[4/3] w-full bg-muted text-left"
                    aria-label="Xem ảnh đầy đủ"
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={`Ảnh BIB ${bib}`}
                        fill
                        className="object-cover"
                        sizes="(max-width:640px) 100vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                  </button>
                  <div className="space-y-2 p-3">
                    <p className="text-xs text-muted-foreground">
                      {p.tags?.map((t) => t.bib).filter(Boolean).join(", ") ||
                        bib}
                      {p.zone ? ` · ${p.zone}` : ""}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setViewPhoto(p)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold hover:border-orange-400 hover:text-orange-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Xem chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDownload(p)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold hover:border-orange-400 hover:text-orange-700"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Tải ảnh
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onChange={goToPage}
            disabled={searching}
          />
        </section>
      )}

      <PhotoViewerModal
        open={Boolean(viewPhoto)}
        photo={viewPhoto}
        bibHint={bib}
        eventName={selectedEventName}
        onClose={() => setViewPhoto(null)}
        onReport={() => {
          if (!viewPhoto) return;
          setDisputePhoto(viewPhoto);
          setViewPhoto(null);
        }}
      />

      <PhotoDisputeModal
        open={Boolean(disputePhoto)}
        photoId={disputePhoto?.id || ""}
        photoUrl={disputePhoto?.url || ""}
        bibHint={bib}
        busy={reporting}
        onClose={() => !reporting && setDisputePhoto(null)}
        onSubmit={submitDispute}
      />
    </div>
  );
}

export default function PhotosPage() {
  return (
    <Suspense
      fallback={
        <PageLoading
          title="Đang tải…"
          description="Chuẩn bị trang ảnh."
          icon={Camera}
        />
      }
    >
      <PhotosInner />
    </Suspense>
  );
}
