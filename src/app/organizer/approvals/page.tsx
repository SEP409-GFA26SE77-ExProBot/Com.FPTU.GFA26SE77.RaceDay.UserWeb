"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { BASE_URL } from "@/config/global-config";
import {
  approveRegistrationApi,
  listEventRegistrations,
  listOrganizerEvents,
  rejectRegistrationApi,
} from "@/api/organizer";
import type { ApiRegistration } from "@/dto/organizer.dto";
import {
  Check,
  X,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
} from "lucide-react";

function resolveFileUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = (BASE_URL || "").replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
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

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-3 text-xs sm:text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-medium text-slate-900 text-right break-all">{value}</span>
    </div>
  );
}

function RegistrationFormDetails({ r }: { r: ApiRegistration }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Thông tin VĐV
        </p>
        <div className="space-y-1.5">
          <DetailRow label="Họ tên" value={r.fullName} />
          <DetailRow label="Email" value={r.email} />
          <DetailRow label="SĐT" value={r.phone} />
          <DetailRow label="Ngày sinh" value={r.dateOfBirth} />
          <DetailRow label="Giới tính" value={r.gender} />
          <DetailRow label="CCCD/CMND" value={r.idNumber} />
          <DetailRow
            label="Chiều cao / Cân nặng"
            value={
              r.heightCm != null || r.weightKg != null
                ? `${r.heightCm != null ? `${r.heightCm} cm` : "—"} / ${
                    r.weightKg != null ? `${r.weightKg} kg` : "—"
                  }`
                : null
            }
          />
          <DetailRow label="Nhóm máu" value={r.bloodType} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Liên hệ khẩn cấp
        </p>
        <div className="space-y-1.5">
          <DetailRow label="Người liên hệ" value={r.emergencyName || "—"} />
          <DetailRow label="SĐT khẩn cấp" value={r.emergencyPhone || "—"} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
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
          <div className="flex justify-between gap-3 text-xs sm:text-sm items-start">
            <span className="text-slate-500 shrink-0">Giấy khám</span>
            {resolveFileUrl(r.healthCertUrl) ? (
              <a
                href={resolveFileUrl(r.healthCertUrl)!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-orange-600 hover:underline text-right"
              >
                <FileText className="h-3.5 w-3.5" />
                {r.healthCertFileName || "Xem file"}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="font-medium text-slate-900">
                {r.healthCertFileName || "Chưa có"}
              </span>
            )}
          </div>
        </div>
      </div>

      <DetailRow
        label="Đăng ký lúc"
        value={r.createdAtUtc ? new Date(r.createdAtUtc).toLocaleString("vi-VN") : null}
      />
    </div>
  );
}

export default function OrganizerApprovalsPage() {
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [events, setEvents] = useState<{ id: string; name: string; status: string }[]>([]);
  const [items, setItems] = useState<ApiRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mine = await listOrganizerEvents();
      setEvents(mine);
      const lists = await Promise.all(mine.map((e) => listEventRegistrations(e.id)));
      setItems(lists.flat());
    } catch (e) {
      setError((e as Error).message || "Không tải được dữ liệu duyệt.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pending = useMemo(() => {
    const list = items.filter((r) => r.status === "pending_approval");
    if (eventFilter === "all") return list;
    return list.filter((r) => r.eventId === eventFilter);
  }, [items, eventFilter]);

  const eventOptions = useMemo(() => {
    const ids = new Set(pending.map((r) => r.eventId));
    return events.filter((e) => ids.has(e.id));
  }, [events, pending]);

  const onApprove = async (id: string) => {
    setBusyId(id);
    try {
      const updated = await approveRegistrationApi(id);
      notify(
        updated.bibNumber
          ? `Đã duyệt — BIB ${updated.bibNumber}. Email vé đã gửi tới ${updated.email}.`
          : "Đã duyệt đăng ký."
      );
      await refresh();
    } catch (e) {
      notify((e as Error).message || "Duyệt thất bại");
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
      notify("Đã từ chối — email thông báo đã gửi (nếu SMTP ok).");
      await refresh();
    } catch (e) {
      notify((e as Error).message || "Từ chối thất bại");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-500">Organizer</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Duyệt đăng ký VĐV
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Xem full form runner → Approve cấp BIB/QR + Gmail vé, hoặc Reject kèm lý do.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
          <ClipboardCheck className="h-4 w-4 text-slate-400" />
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            {pending.length} chờ duyệt
          </span>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Lọc giải</span>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Tất cả giải</option>
          {eventOptions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải đăng ký từ API…
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Không có đơn chờ duyệt trên server. Runner cần thanh toán qua PayOS (API) trước.
        </div>
      ) : (
        <ul className="space-y-3">
          {pending.map((r) => {
            const open = expandedId === r.id;
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{r.fullName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.email} · {r.phone}
                    </p>
                    <p className="text-sm text-slate-700 mt-2">
                      {r.eventName || r.eventId} — {r.distanceLabel || r.distanceId}
                    </p>
                    <p className="text-sm font-semibold text-orange-600 mt-1">
                      {formatPrice(Number(r.price || 0))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : r.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {open ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      {open ? "Ẩn form" : "Xem form"}
                    </button>
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
                      Approve
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
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>

                {open && <RegistrationFormDetails r={r} />}

                <p className="text-[11px] text-slate-400 font-mono">{r.id}</p>
              </li>
            );
          })}
        </ul>
      )}

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-3">
            <h2 className="text-lg font-bold">Lý do từ chối</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
              placeholder="Tối thiểu 10 ký tự…"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
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

      <Link href="/my-events" className="text-sm font-semibold text-orange-600">
        ← Về giải của tôi
      </Link>
    </div>
  );
}
