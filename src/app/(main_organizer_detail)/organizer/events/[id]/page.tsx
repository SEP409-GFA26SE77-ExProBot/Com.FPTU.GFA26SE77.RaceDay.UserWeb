"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  User,
  Users,
  X,
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
  getRegistrationStatusLabel,
  getStatusColor,
} from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { mediaDisplayUrl } from "@/lib/media-url";
import { PAGE_SHELL } from "@/lib/page-shell";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

type TabKey = "overview" | "approvals";

function isManageableOrganizerStatus(status: string): boolean {
  const key = (status || "").toLowerCase().replace(/_/g, "-");
  return (
    key === "approved" ||
    key === "published" ||
    key === "registration-open" ||
    key === "closed" ||
    key === "completed" ||
    key === "cancelled" ||
    key === "in-progress"
  );
}

function resolveFileUrl(url?: string | null): string | null {
  if (!url) return null;
  const resolved = mediaDisplayUrl(url);
  return resolved || null;
}

function formatMedical(codes: ApiRegistration["medicalCodes"]): string {
  if (!codes) return "—";
  if (Array.isArray(codes)) return codes.length ? codes.join(", ") : "—";
  if (typeof codes === "string") return codes || "—";
  try {
    return JSON.stringify(codes);
  } catch {
    return "—";
  }
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-3 text-xs sm:text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function RegistrationFormDetails({ r }: { r: ApiRegistration }) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/40 p-4">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Thông tin VĐV
        </p>
        <div className="space-y-1.5">
          <DetailRow label="Họ tên" value={r.fullName} />
          <DetailRow label="Email" value={r.email} />
          <DetailRow label="SĐT" value={r.phone} />
          <DetailRow label="Ngày sinh" value={r.dateOfBirth} />
          <DetailRow label="Giới tính" value={r.gender} />
          <DetailRow label="CCCD/CMND" value={r.idNumber} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Áo / Y tế
        </p>
        <div className="space-y-1.5">
          <DetailRow
            label="Áo"
            value={
              r.shirtType || r.shirtSize || r.shirtColor
                ? [r.shirtType, r.shirtSize, r.shirtColor].filter(Boolean).join(" · ")
                : "Không lấy áo"
            }
          />
          <DetailRow label="Mã bệnh lý" value={formatMedical(r.medicalCodes)} />
          <div className="flex items-start justify-between gap-3 text-xs sm:text-sm">
            <span className="shrink-0 text-muted-foreground">Giấy khám</span>
            {resolveFileUrl(r.healthCertUrl) ? (
              <a
                href={resolveFileUrl(r.healthCertUrl)!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-right font-semibold text-orange-600 hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                {r.healthCertFileName || "Xem file"}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="font-medium">{r.healthCertFileName || "Chưa có"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
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
  const tab: TabKey =
    searchParams.get("tab") === "approvals" ? "approvals" : "overview";
  const setTab = (next: TabKey) => {
    const url =
      next === "approvals"
        ? `/organizer/events/${eventId}?tab=approvals`
        : `/organizer/events/${eventId}`;
    router.replace(url);
  };
  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [regs, setRegs] = useState<ApiRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [regsLoading, setRegsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending_approval");

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

  const filteredRegs = useMemo(() => {
    if (statusFilter === "all") return regs;
    return regs.filter((r) => r.status === statusFilter);
  }, [regs, statusFilter]);

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
      <div className={`${PAGE_SHELL} py-16 text-center`}>
        <h1 className="text-xl font-bold text-foreground">Không tìm thấy giải</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Link
          href="/my-events"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" /> Về danh sách
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
    <div className={`${PAGE_SHELL} py-8 sm:py-10`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/my-events"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-orange-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Danh sách giải của tôi
        </Link>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
          <User className="h-3.5 w-3.5 text-orange-500" />
          <span className="font-semibold text-foreground">{username}</span>
        </div>
      </div>

      {toast && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {toast}
        </div>
      )}

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

      {tab === "approvals" && (
        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                BTC · {username}
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">
                Duyệt đăng ký giải này
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dữ liệu theo API tài khoản đang đăng nhập — không dùng mock.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold"
              >
                <option value="pending_approval">Chờ duyệt</option>
                <option value="confirmed">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="all">Tất cả</option>
              </select>
              <button
                type="button"
                onClick={() => void loadRegs()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${regsLoading ? "animate-spin" : ""}`}
                />
                Tải lại
              </button>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                {pendingCount} chờ duyệt
              </span>
            </div>
          </div>

          {regsLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Đang tải đăng ký…
            </div>
          ) : filteredRegs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Không có đơn phù hợp bộ lọc. VĐV cần thanh toán PayOS trước khi vào
              chờ duyệt.
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredRegs.map((r) => {
                const open = expandedId === r.id;
                const canModerate = r.status === "pending_approval";
                return (
                  <li
                    key={r.id}
                    className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">{r.fullName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {r.email} · {r.phone}
                        </p>
                        <p className="mt-2 text-sm text-foreground/80">
                          {r.distanceLabel || r.distanceId}
                          {r.bibNumber ? ` · BIB ${r.bibNumber}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-orange-600">
                          {formatPrice(Number(r.price || 0))} ·{" "}
                          {getRegistrationStatusLabel(r.status)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedId(open ? null : r.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
                        >
                          {open ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          {open ? "Ẩn form" : "Xem form"}
                        </button>
                        {canModerate && (
                          <>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => void onApprove(r.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                            >
                              {busyId === r.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Duyệt
                            </button>
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              onClick={() => {
                                setRejectId(r.id);
                                setReason("");
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
                            >
                              <X className="h-3.5 w-3.5" /> Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {open && <RegistrationFormDetails r={r} />}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-card p-5 shadow-xl">
            <h2 className="text-lg font-bold">Lý do từ chối</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border p-3 text-sm"
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
                Xác nhận từ chối
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
