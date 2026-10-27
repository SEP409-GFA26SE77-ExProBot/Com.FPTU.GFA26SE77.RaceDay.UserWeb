"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, LogIn, MessageSquare, Send } from "lucide-react";
import { createEventDispute, getMyEventDisputes, getRecentJoinedEvents } from "@/api/disputes";
import type { EventDisputeDto, RecentJoinedEventDto, RunnerPageDto } from "@/dto/dispute.dto";
import Pagination from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";
import { useAuthStore } from "@/stores/auth-store";

const PAGE_SIZE = 10;
const EVENT_PAGE_SIZE = 20;
const STATUS = {
  open: { label: "Chờ xử lý", className: "bg-amber-50 text-amber-700" },
  resolved: { label: "Đã giải quyết", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Đã từ chối", className: "bg-red-50 text-red-700" },
};

type LoadResult<T> = { key: string; data?: RunnerPageDto<T>; error?: string };

function eventLabel(event: RecentJoinedEventDto) {
  const date = new Date(`${event.date}T00:00:00`).toLocaleDateString("vi-VN");
  return `${event.name} · ${date} · ${event.location}`;
}

export default function DisputesPage() {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) return <Loading />;
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Bạn chưa đăng nhập</h1>
        <Link
          href="/login?from=/disputes"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return <DisputesContent key={user.id} />;
}

function Loading() {
  return (
    <div role="status" className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
    </div>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">Thử lại</button>
    </div>
  );
}

function DisputesContent() {
  const [page, setPage] = useState(1);
  const [listVersion, setListVersion] = useState(0);
  const [list, setList] = useState<LoadResult<EventDisputeDto>>({ key: "" });
  const [eventPage, setEventPage] = useState(1);
  const [eventsVersion, setEventsVersion] = useState(0);
  const [events, setEvents] = useState<LoadResult<RecentJoinedEventDto>>({ key: "" });
  const [selectedEvent, setSelectedEvent] = useState<RecentJoinedEventDto | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const listKey = `${page}:${listVersion}`;
  const eventsKey = `${eventPage}:${eventsVersion}`;
  const listLoading = list.key !== listKey;
  const eventsLoading = events.key !== eventsKey;

  useEffect(() => {
    let cancelled = false;
    getMyEventDisputes(page, PAGE_SIZE).then(
      (data) => { if (!cancelled) setList({ key: listKey, data }); },
      (error: unknown) => {
        if (!cancelled) setList({ key: listKey, error: getApiErrorMessage(error, "Không thể tải danh sách khiếu nại.") });
      },
    );
    return () => { cancelled = true; };
  }, [page, listKey]);

  useEffect(() => {
    let cancelled = false;
    getRecentJoinedEvents(eventPage, EVENT_PAGE_SIZE).then(
      (data) => { if (!cancelled) setEvents({ key: eventsKey, data }); },
      (error: unknown) => {
        if (!cancelled) setEvents({ key: eventsKey, error: getApiErrorMessage(error, "Không thể tải các giải đã tham gia.") });
      },
    );
    return () => { cancelled = true; };
  }, [eventPage, eventsKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !selectedEvent) return;
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    setSubmitError("");
    setSuccess("");
    if (!trimmedTitle || !trimmedDescription) {
      setSubmitError("Vui lòng nhập tiêu đề và nội dung khiếu nại.");
      return;
    }
    setSubmitting(true);
    try {
      await createEventDispute({ eventId: selectedEvent.id, title: trimmedTitle, description: trimmedDescription });
      setTitle("");
      setDescription("");
      setSelectedEvent(null);
      setSuccess("Đã gửi khiếu nại. Bạn có thể theo dõi trạng thái trong danh sách bên dưới.");
      setPage(1);
      setListVersion((value) => value + 1);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Không thể gửi khiếu nại. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  }

  const eventItems = events.data?.items ?? [];
  const canSubmit = selectedEvent && title.trim() && description.trim() && !submitting && !eventsLoading && !events.error;

  return (
    <div className={`${PAGE_SHELL} py-7 max-w-3xl space-y-6`}>
      <div>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
          Khiếu nại
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Khiếu nại của tôi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gửi và theo dõi khiếu nại về các giải chạy bạn đã tham gia.
        </p>
      </div>

      <section className="rounded-2xl border bg-white p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold">Tạo khiếu nại</h2>
        <p id="recent-events-help" className="text-sm text-muted-foreground">
          Chọn giải diễn ra trong 1 tháng gần đây với đăng ký đã xác nhận hoặc đã hoàn thành.
        </p>
        {success && <p role="status" className="flex gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 className="h-5 w-5 shrink-0" />{success}</p>}
        {eventsLoading ? <Loading /> : events.error ? (
          <LoadError message={events.error} onRetry={() => setEventsVersion((value) => value + 1)} />
        ) : events.data?.totalCount === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center space-y-2">
            <AlertTriangle className="mx-auto h-7 w-7 text-amber-500" />
            <p className="font-semibold">Chưa có giải phù hợp để khiếu nại</p>
            <p className="text-sm text-muted-foreground">Bạn chưa có đăng ký đã xác nhận hoặc đã hoàn thành cho giải diễn ra trong 1 tháng gần đây.</p>
            <Link href="/registered-events" className="inline-flex text-sm font-semibold text-orange-600">Xem giải đã đăng ký →</Link>
          </div>
        ) : null}
        {(events.data?.totalCount ?? 0) > 0 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={submitting} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="dispute-event" className="text-sm font-semibold">Giải chạy</label>
                <select
                  id="dispute-event"
                  required
                  aria-describedby="recent-events-help"
                  value={selectedEvent?.id ?? ""}
                  disabled={eventsLoading || Boolean(events.error) || submitting}
                  onChange={(event) => {
                    setSelectedEvent(eventItems.find((item) => item.id === event.target.value) ?? null);
                    setSuccess("");
                  }}
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm disabled:opacity-50"
                >
                  <option value="">Chọn giải đã tham gia</option>
                  {selectedEvent && !eventItems.some((item) => item.id === selectedEvent.id) && (
                    <option value={selectedEvent.id}>{eventLabel(selectedEvent)}</option>
                  )}
                  {eventItems.map((item) => <option key={item.id} value={item.id}>{eventLabel(item)}</option>)}
                </select>
                {events.data && <Pagination page={eventPage} pageSize={EVENT_PAGE_SIZE} totalItems={events.data.totalCount} totalPages={events.data.totalPages} onChange={setEventPage} disabled={eventsLoading || submitting} />}
              </div>
              <div className="space-y-2">
                <label htmlFor="dispute-title" className="text-sm font-semibold">Tiêu đề</label>
                <input id="dispute-title" required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Sai thời gian hoàn thành" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              </div>
              <div className="space-y-2">
                <label htmlFor="dispute-description" className="text-sm font-semibold">Nội dung khiếu nại</label>
                <textarea id="dispute-description" required maxLength={4000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả vấn đề, BIB và thông tin liên quan để ban tổ chức kiểm tra." className="w-full resize-y rounded-xl border px-3 py-2.5 text-sm" />
                <p className="text-right text-xs text-muted-foreground">{description.length}/4000</p>
              </div>
            </fieldset>
            {submitError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
            <button type="submit" disabled={!canSubmit} className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Đang gửi…" : "Gửi khiếu nại"}
            </button>
          </form>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="my-disputes-heading">
        <h2 id="my-disputes-heading" className="text-lg font-bold">Danh sách khiếu nại</h2>
        {listLoading ? <Loading /> : list.error ? (
          <LoadError message={list.error} onRetry={() => setListVersion((value) => value + 1)} />
        ) : list.data?.totalCount === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="font-bold">Bạn chưa có khiếu nại nào</h3>
            <p className="text-sm text-muted-foreground">Các khiếu nại đã gửi sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {list.data?.items.map((dispute) => {
                const status = STATUS[dispute.status] ?? { label: dispute.status, className: "bg-slate-100 text-slate-700" };
                return (
                  <li key={dispute.id} className="rounded-2xl border bg-white p-5 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="min-w-0 break-words font-bold">{dispute.title}</h3>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                    </div>
                    <p className="text-sm font-medium text-orange-600">{dispute.eventName}</p>
                    <p className="line-clamp-2 whitespace-pre-line break-words text-sm text-muted-foreground">{dispute.description}</p>
                    <time dateTime={dispute.createdAtUtc} className="block text-xs text-muted-foreground">Gửi lúc {new Date(dispute.createdAtUtc).toLocaleString("vi-VN")}</time>
                  </li>
                );
              })}
            </ul>
            {list.data && <Pagination page={page} pageSize={PAGE_SIZE} totalItems={list.data.totalCount} totalPages={list.data.totalPages} onChange={setPage} />}
          </>
        )}
      </section>
    </div>
  );
}
