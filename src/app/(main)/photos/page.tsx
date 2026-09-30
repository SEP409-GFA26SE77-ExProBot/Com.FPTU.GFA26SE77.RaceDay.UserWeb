"use client";

import { PAGE_SHELL } from "@/lib/page-shell";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Download, Loader2, Search, X } from "lucide-react";
import { MOCK_EVENTS, getEventById } from "@/data/mock-events";
import { searchPhotosByBib, type MockRacePhoto } from "@/data/mock-photos";
import PageLoading from "@/components/ui/PageLoading";
import Pagination from "@/components/ui/Pagination";
import { usePagedList } from "@/hooks/usePagedList";

const PHOTO_PAGE_SIZE = 6;

export default function PhotosSearchPage() {
  const [bibInput, setBibInput] = useState("");
  const [eventId, setEventId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MockRacePhoto[]>([]);

  const eventOptions = useMemo(
    () => MOCK_EVENTS.filter((e) => e.status !== "upcoming").slice(0, 8),
    []
  );

  const resultsKey = useMemo(
    () => results.map((r) => r.id).join(",") || "empty",
    [results]
  );
  const pager = usePagedList(results, PHOTO_PAGE_SIZE, resultsKey);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const bib = Number(String(bibInput).replace(/\D/g, ""));
    if (!bib || bib < 1) {
      setError("Vui lòng nhập số BIB hợp lệ.");
      setResults([]);
      setSearched(true);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const photos = await searchPhotosByBib(
        bib,
        eventId ? Number(eventId) : undefined
      );
      setResults(photos);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setBibInput("1234");
    setEventId("1");
    setError(null);
  };

  return (
    <div className={`${PAGE_SHELL} py-7`}>
      <div className="mb-6 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-5 sm:p-6 max-w-3xl">
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1.5">
          Tìm ảnh theo BIB
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Tìm ảnh theo số BIB</h1>
        <p className="mt-1.5 text-muted-foreground text-sm">
          Nhập số BIB (và chọn giải nếu muốn) để xem toàn bộ ảnh đã được gắn nhãn OCR.
          Demo: thử BIB <button type="button" onClick={fillDemo} className="text-orange-600 font-semibold underline">1234</button> (Sapa)
          hoặc <button type="button" onClick={() => { setBibInput("2048"); setEventId("2"); }} className="text-orange-600 font-semibold underline">2048</button> (TP.HCM).
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 sm:items-end"
      >
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-semibold">Số BIB *</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={bibInput}
              onChange={(e) => setBibInput(e.target.value)}
              placeholder="Ví dụ: 1234"
              className={`w-full rounded-xl border ${error ? "border-red-400" : "border-border"} bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-orange-500/20`}
            />
            {bibInput && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setBibInput("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="sm:w-64 space-y-1.5">
          <label className="text-xs font-semibold">Giải (tuỳ chọn)</label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Tất cả giải</option>
            {eventOptions.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Tìm ảnh
        </button>
      </form>

      {loading && (
        <PageLoading
          title="Đang tìm ảnh theo BIB…"
          description="OCR đang khớp số BIB với thư viện ảnh giải."
          icon={Camera}
        />
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Camera className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Không tìm thấy ảnh</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Chưa có ảnh gắn BIB này, hoặc OCR chưa nhận diện được. Thử BIB demo 1234 / 2048.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Tìm thấy <strong className="text-foreground">{results.length}</strong> ảnh cho BIB{" "}
            <strong className="text-foreground">{results[0].bib}</strong>
          </p>
          <div
            className={`list-fade ${pager.visible ? "list-fade-in" : "list-fade-out"} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 list-stagger min-h-[200px]`}
          >
            {pager.turning
              ? Array.from({ length: PHOTO_PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-muted skeleton-shimmer" />
                ))
              : pager.pageItems.map((photo) => {
                  const ev = getEventById(photo.eventId);
                  return (
                    <article
                      key={photo.id}
                      className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                    >
                      <div className="relative aspect-[4/3] bg-muted">
                        <Image
                          src={photo.src}
                          alt={photo.caption}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width:768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <p className="text-sm font-semibold line-clamp-2">{photo.caption}</p>
                        <p className="text-xs text-muted-foreground">
                          {ev?.title || `Giải #${photo.eventId}`} · BIB {photo.bib}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(photo.takenAt).toLocaleString("vi-VN")}
                        </p>
                        <a
                          href={photo.src}
                          download
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Tải ảnh
                        </a>
                      </div>
                    </article>
                  );
                })}
          </div>
          <div className="mt-6 border-t border-border/60 pt-4">
            <Pagination
              page={pager.page}
              totalPages={pager.totalPages}
              totalItems={pager.totalItems}
              pageSize={PHOTO_PAGE_SIZE}
              onChange={pager.goTo}
              disabled={pager.turning}
            />
          </div>
        </>
      )}

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Chưa có BIB?{" "}
        <Link href="/events" className="text-orange-600 font-medium hover:underline">
          Đăng ký giải
        </Link>{" "}
        để nhận số BIB sau thanh toán.
      </p>
    </div>
  );
}
