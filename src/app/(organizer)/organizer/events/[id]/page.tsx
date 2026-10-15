"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import {
  Calendar,
  ClipboardList,
  ExternalLink,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import { getEventById } from "@/api/events";
import {
  approveRegistrationApi,
  listEventRegistrations,
  rejectRegistrationApi,
} from "@/api/organizer";
import type { RaceEventDto } from "@/dto/event.dto";
import type { ApiRegistration } from "@/dto/organizer.dto";
import {
  formatDate,
  formatPrice,
  getOrganizerStatusLabel,
  getStatusColor,
} from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";
import EventFinancePanel from "@/components/organizer/EventFinancePanel";
import RegistrationApprovalsPanel from "@/components/organizer/RegistrationApprovalsPanel";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

type TabKey = "overview" | "approvals" | "finance";

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
  const tab: TabKey =
    rawTab === "approvals" || rawTab === "finance" ? rawTab : "overview";
  const setTab = (next: TabKey) => {
    const url =
      next === "overview"
        ? `/organizer/events/${eventId}`
        : `/organizer/events/${eventId}?tab=${next}`;
    router.replace(url);
  };
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [regs, setRegs] = useState<ApiRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const username = Cookies.get("username") || "User";

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
      notify(getApiErrorMessage(e, "Không tải được danh sách đăng ký."));
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

  const pendingCount = useMemo(
    () => regs.filter((r) => r.status === "pending_approval").length,
    [regs]
  );

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
      notify(getApiErrorMessage(e, "Duyệt thất bại."));
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
      notify(getApiErrorMessage(e, "Từ chối thất bại."));
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
  const totalCap =
    distances.reduce((s, d) => s + d.capacity, 0) || event.totalRunners || 0;
  const totalReg = distances.reduce(
    (s, d) => s + (d.registeredCount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {toast}
        </div>
      )}

      {/* Banner + tab strip — chỉ overview / finance; approvals dùng sidebar + bảng */}
      {tab !== "approvals" && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="relative h-44 sm:h-52">
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
            <div className="absolute bottom-4 left-4 right-4">
              <span
                className={`mb-2 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${getStatusColor(
                  event.status
                )}`}
              >
                {getOrganizerStatusLabel(event.status)}
              </span>
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                {event.name}
              </h1>
              {event.tagline ? (
                <p className="mt-1 text-sm text-white/80">{event.tagline}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-border/60 p-2">
            {(
              [
                { key: "overview", label: "Tổng quan" },
                {
                  key: "approvals",
                  label: `Duyệt đăng ký${pendingCount ? ` (${pendingCount})` : ""}`,
                },
                { key: "finance", label: "Tài chính" },
              ] as { key: TabKey; label: string }[]
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  tab === t.key
                    ? "bg-orange-500/15 text-orange-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "overview" && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Info
              icon={Calendar}
              label="Ngày tổ chức"
              value={formatDate(event.date)}
            />
            <Info icon={MapPin} label="Địa điểm" value={event.location} />
            <Info
              icon={Users}
              label="VĐV / quy mô"
              value={`${totalReg.toLocaleString("vi-VN")} / ${totalCap.toLocaleString("vi-VN")}`}
            />
          </div>

          <section className="mt-6 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-sm font-bold text-foreground">Cự ly</h2>
            {distances.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Chưa có cự ly.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="text-[11px] uppercase text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-3 font-bold">Tên</th>
                      <th className="pb-2 pr-3 font-bold">Km</th>
                      <th className="pb-2 pr-3 font-bold">Giá</th>
                      <th className="pb-2 font-bold">Slot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {distances.map((d) => (
                      <tr key={d.id}>
                        <td className="py-3 pr-3 font-semibold">{d.name}</td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {d.distanceKm}K
                        </td>
                        <td className="py-3 pr-3 font-bold text-orange-600">
                          {formatPrice(d.price)}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {(d.registeredCount ?? 0).toLocaleString("vi-VN")} /{" "}
                          {d.capacity.toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/events/${event.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:border-orange-300 hover:text-orange-600"
            >
              <ExternalLink className="h-4 w-4" />
              Xem trang công khai
            </Link>
            <button
              type="button"
              onClick={() => setTab("approvals")}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              <ClipboardList className="h-4 w-4" />
              Duyệt đăng ký VĐV
            </button>
          </div>
        </>
      )}

      {tab === "finance" && <EventFinancePanel eventId={eventId} />}

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

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
