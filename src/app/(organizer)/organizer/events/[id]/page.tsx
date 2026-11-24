"use client";
import { getAuthUser } from "@/stores/auth-store";
import { useOrganizerToastState } from "@/lib/use-organizer-toast-state";
import { useOrganizerErrorState } from "@/lib/use-organizer-error-state";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
} from "lucide-react";
import { getEventById } from "@/api/events";
import {
  approveRegistrationApi,
  getOrganizerLeaderboardPdf,
  listEventRegistrations,
  rejectRegistrationApi,
} from "@/api/organizer";
import type { EventDistanceDto, RaceEventDto } from "@/dto/event.dto";
import type { ApiRegistration } from "@/dto/organizer.dto";
import {
  formatDate,
  getOrganizerStatusLabel,
  getStatusColor,
} from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { hasEventFinished } from "@/lib/event-lifecycle";
import { mediaDisplayUrl } from "@/lib/media-url";
import { toastError } from "@/lib/toast";
import EventDashboard from "@/components/dashboard/EventDashboard";
import RegistrationApprovalsPanel from "@/components/organizer/RegistrationApprovalsPanel";
import { Button } from "@/components/ui/button";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

type TabKey = "overview" | "approvals";

function isManageableOrganizerStatus(status: string): boolean {
  const key = (status || "").toLowerCase().replace(/_/g, "-");
  return (
    key === "draft" ||
    key === "pending" ||
    key === "pending-approval" ||
    key === "rejected" ||
    key === "approved" ||
    key === "published" ||
    key === "registration-open" ||
    key === "closed" ||
    key === "completed" ||
    key === "cancelled" ||
    key === "suspended" ||
    key === "in-progress"
  );
}

export default function MyEventDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="mt-3 text-sm text-muted-foreground">Đang tải giải…</p>
        </div>
      }
    >
      <MyEventDetailContent />
    </Suspense>
  );
}

function MyEventDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = String(params?.id || "");
  const rawTab = searchParams.get("tab");
  const tab: TabKey = rawTab === "approvals" ? "approvals" : "overview";
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [regs, setRegs] = useState<ApiRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [error, setError] = useOrganizerErrorState();
  const [toast, setToast] = useOrganizerToastState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [downloadingDistanceId, setDownloadingDistanceId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const username = getAuthUser()?.username || "User";

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  const loadRegs = useCallback(async () => {
    setRegsLoading(true);
    try {
      const list = await listEventRegistrations(eventId);
      setRegs(Array.isArray(list) ? list : []);
    } catch (e) {
      setRegs([]);
      setError(getApiErrorMessage(e, "Không tải được danh sách đăng ký."));
    } finally {
      setRegsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getEventById(eventId);
        if (cancelled) return;
        if (!isManageableOrganizerStatus(data.status)) {
          router.replace("/my-events");
          return;
        }
        setEvent(data);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setEvent(null);
          setError(getApiErrorMessage(e, "Không tải được chi tiết giải."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, router]);

  useEffect(() => {
    if (!eventId || tab !== "approvals") return;
    void loadRegs();
  }, [eventId, tab, loadRegs]);

  const onApprove = async (id: string) => {
    setBusyId(id);
    try {
      const updated = await approveRegistrationApi(id);
      notify(
        updated.bibNumber
          ? `Đã duyệt — BIB ${updated.bibNumber}`
          : "Đã duyệt đăng ký."
      );
      await loadRegs();
    } catch (e) {
      setError(getApiErrorMessage(e, "Duyệt thất bại."));
    } finally {
      setBusyId(null);
    }
  };

  const onRejectConfirm = async () => {
    if (!rejectId || reason.trim().length < 10) return;
    setBusyId(rejectId);
    try {
      await rejectRegistrationApi(rejectId, reason.trim());
      setRejectId(null);
      setReason("");
      notify("Đã từ chối đăng ký.");
      await loadRegs();
    } catch (e) {
      setError(getApiErrorMessage(e, "Từ chối thất bại."));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải giải…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-bold text-foreground">Không tìm thấy giải</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Link
          href="/my-events"
          className="mt-6 inline-block text-sm font-bold text-orange-600"
        >
          Về danh sách
        </Link>
      </div>
    );
  }

  const distances = event.distances || [];
  const showLeaderboardDownload =
    event.id.toLowerCase() === eventId.toLowerCase() && hasEventFinished(event);
  const downloadLeaderboard = async (distance: EventDistanceDto) => {
    setDownloadingDistanceId(distance.id);
    try {
      const pdf = await getOrganizerLeaderboardPdf(event.id, distance.id);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      const name = `${event.name}-${distance.name}`.replace(/[<>:"/\\|?*]/g, "-");
      link.href = url;
      link.download = `bang-xep-hang-${name}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toastError("Không tải được bảng xếp hạng. Vui lòng thử lại.");
    } finally {
      setDownloadingDistanceId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {toast}
        </div>
      )}

      {/* Banner tổng quan; duyệt đăng ký truy cập qua sidebar. */}
      {tab !== "approvals" && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="relative p-4 sm:p-5">
            {event.bannerImage ? (
              <Image
                src={mediaDisplayUrl(event.bannerImage)}
                alt={event.name}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: DEFAULT_GRADIENT }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
            <div className="relative min-w-0">
              <span
                className={`mb-2 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${getStatusColor(
                  event.status
                )}`}
              >
                {getOrganizerStatusLabel(event.status)}
              </span>
              <h1 className="break-words text-xl font-extrabold text-white sm:text-2xl">
                {event.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
                <span className="flex min-w-0 items-start gap-2"><Calendar aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{formatDate(event.date)}</span></span>
                <span className="flex min-w-0 items-start gap-2"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{event.location || "Chưa có địa điểm"}</span></span>
                <Link href={"/events/" + event.id} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-white"><ExternalLink aria-hidden="true" className="h-4 w-4" />Xem trang công khai</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "overview" && (
        <EventDashboard key={eventId} eventId={eventId} distanceAction={showLeaderboardDownload ? (distanceId) => {
          const distance = distances.find((item) => item.id === distanceId);
          return distance ? <Button type="button" variant="outline" className="mt-2 min-h-11 max-w-full cursor-pointer whitespace-normal text-xs"
            disabled={downloadingDistanceId !== null}
            aria-label={(downloadingDistanceId === distance.id ? "Đang tải bảng xếp hạng PDF cự ly " : "Tải bảng xếp hạng PDF cự ly ") + distance.name}
            onClick={() => void downloadLeaderboard(distance)}>
            <Download aria-hidden="true" />{downloadingDistanceId === distance.id ? "Đang tải PDF…" : "Tải bảng xếp hạng PDF"}
          </Button> : null;
        } : undefined} />
      )}

      {tab === "approvals" && (
        <RegistrationApprovalsPanel
          event={event}
          regs={regs}
          loading={regsLoading}
          busyId={busyId}
          organizerUsername={username}
          onReload={() => void loadRegs()}
          onApprove={(id) => void onApprove(id)}
          onRejectRequest={(id) => {
            setRejectId(id);
            setReason("");
          }}
        />
      )}

      {rejectId && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-card p-5 shadow-xl">
            <h2 className="text-lg font-bold">Lý do từ chối</h2>
            <p className="text-xs text-muted-foreground">
              VĐV sẽ thấy lý do này trên vé / trang đăng ký của họ.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              placeholder="Tối thiểu 10 ký tự…"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={reason.trim().length < 10 || busyId === rejectId}
                onClick={() => void onRejectConfirm()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {busyId === rejectId ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Xác nhận từ chối"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
