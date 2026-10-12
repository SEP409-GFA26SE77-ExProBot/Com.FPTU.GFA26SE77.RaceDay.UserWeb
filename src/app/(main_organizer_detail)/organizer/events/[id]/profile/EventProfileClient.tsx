"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  Save,
  Send,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getEventById } from "@/api/events";
import { submitRaceEvent, uploadOrganizerFile } from "@/api/organizer";
import { updateEventProfile } from "@/api/event-packages";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { getOrganizerStatusLabel, getStatusColor } from "@/lib/format";
import { mediaDisplayUrl } from "@/lib/media-url";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

function statusKey(status: string) {
  return (status || "").toLowerCase().replace(/_/g, "-");
}

function canEdit(status: string) {
  const k = statusKey(status);
  return k === "draft" || k === "rejected";
}

function canSubmitForApproval(status: string) {
  const k = statusKey(status);
  return k === "draft" || k === "rejected";
}

export default function EventProfileClient() {
  const params = useParams();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [totalRunners, setTotalRunners] = useState<number>(0);
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Load event
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getEventById(eventId);
        if (cancelled) return;
        setEvent(data);
        setName(data.name || "");
        setLocation(data.location || "");
        setDate(data.date ? data.date.split("T")[0] : "");
        setDescription(data.description || "");
        setBannerImage(data.bannerImage || "");
        setTotalRunners(data.totalRunners || 0);
        const ba = data.organizer?.beneficiaryAccount;
        setAccountHolder(ba?.accountHolder || "");
        setAccountNumber(ba?.accountNumber || "");
        setBankName(ba?.bankName || "");
        setBranch(ba?.branch || "");
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "Không tải được hồ sơ giải."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [eventId]);

  // Upload banner
  const handleBannerUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadOrganizerFile(file, "banner");
      setBannerImage(result.fileUrl);
      notify("Tải ảnh banner thành công.");
    } catch (e) {
      notify(getApiErrorMessage(e, "Upload thất bại."));
    } finally {
      setUploading(false);
    }
  }, []);

  // Save profile — body khớp UpdateDraftProfileRequest (organizer + beneficiaryAccount)
  const handleSave = useCallback(async () => {
    if (saving || !event) return;
    setSaving(true);
    setError(null);
    try {
      const org = event.organizer;
      const hasBank =
        accountHolder.trim() ||
        accountNumber.trim() ||
        bankName.trim() ||
        branch.trim();
      await updateEventProfile(eventId, {
        name: name.trim() || undefined,
        location: location.trim() || undefined,
        date: date || undefined,
        description: description.trim() || undefined,
        bannerImage: bannerImage || undefined,
        // Không gửi totalRunners nếu theo gói — BE từ chối sửa
        ...(event.packagePurchaseId
          ? {}
          : { totalRunners: totalRunners || undefined }),
        ...(hasBank && org?.name && org?.email && org?.phone
          ? {
              organizer: {
                name: org.name,
                email: org.email,
                phone: org.phone,
                legalEntity: org.legalEntity,
                website: org.website,
                beneficiaryAccount: {
                  accountHolder: accountHolder.trim() || undefined,
                  accountNumber: accountNumber.trim() || undefined,
                  bankName: bankName.trim() || undefined,
                  branch: branch.trim() || undefined,
                },
              },
            }
          : {}),
      });
      const refreshed = await getEventById(eventId);
      setEvent(refreshed);
      notify("Đã lưu hồ sơ giải.");
    } catch (e) {
      setError(getApiErrorMessage(e, "Lưu thất bại."));
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    event,
    eventId,
    name,
    location,
    date,
    description,
    bannerImage,
    totalRunners,
    accountHolder,
    accountNumber,
    bankName,
    branch,
  ]);

  // Submit for approval
  const handleSubmitApproval = useCallback(async () => {
    if (submittingApproval) return;
    setSubmittingApproval(true);
    setError(null);
    try {
      const updated = await submitRaceEvent(eventId);
      setEvent(updated);
      notify("Đã gửi duyệt hồ sơ giải.");
    } catch (e) {
      setError(getApiErrorMessage(e, "Gửi duyệt thất bại."));
    } finally {
      setSubmittingApproval(false);
    }
  }, [submittingApproval, eventId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải hồ sơ giải…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-bold text-foreground">Không tìm thấy giải</h1>
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

  const editable = canEdit(event.status);
  const showSubmit = canSubmitForApproval(event.status);
  const bannerUrl = bannerImage ? mediaDisplayUrl(bannerImage) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Chi tiết giải
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            {event.name || "Giải chưa đặt tên"}
          </h1>
          <span
            className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${getStatusColor(event.status)}`}
          >
            {getOrganizerStatusLabel(event.status)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:border-orange-300 hover:text-orange-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu hồ sơ
            </button>
          )}
          {showSubmit && (
            <button
              type="button"
              disabled={submittingApproval || !name.trim()}
              onClick={() => void handleSubmitApproval()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {submittingApproval ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Gửi duyệt
            </button>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {statusKey(event.status) === "rejected" && event.rejectionReason && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-700">Lý do từ chối</p>
            <p className="mt-1 text-sm text-red-600">{event.rejectionReason}</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Banner */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <ImageIcon className="h-4 w-4 text-orange-500" /> Ảnh banner
          </h2>
          <div className="relative h-44 overflow-hidden rounded-xl border border-border/60">
            {bannerUrl ? (
              <Image
                src={bannerUrl}
                alt="Banner"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0" style={{ background: DEFAULT_GRADIENT }} />
            )}
          </div>
          {editable && (
            <div className="mt-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleBannerUpload(f);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                {uploading ? "Đang tải…" : "Đổi ảnh banner"}
              </button>
            </div>
          )}
        </section>

        {/* Basic info */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <FileText className="h-4 w-4 text-orange-500" /> Thông tin cơ bản
          </h2>
          <div className="space-y-3">
            <Field label="Tên giải" required disabled={!editable}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editable}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </Field>
            <Field label="Địa điểm" required disabled={!editable} icon={MapPin}>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={!editable}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </Field>
            <Field label="Ngày tổ chức" required disabled={!editable} icon={Calendar}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!editable}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </Field>
            <Field
              label="Quy mô VĐV"
              disabled={!editable || Boolean(event?.packagePurchaseId)}
              icon={Users}
            >
              <input
                type="number"
                value={totalRunners || ""}
                onChange={(e) => setTotalRunners(Number(e.target.value) || 0)}
                disabled={!editable || Boolean(event?.packagePurchaseId)}
                min={0}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              {event?.packagePurchaseId ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Theo gói đăng ký — không chỉnh sửa.
                  {event.packageExpiresAtUtc
                    ? ` Hết hạn gói: ${new Date(event.packageExpiresAtUtc).toLocaleDateString("vi-VN")}.`
                    : null}
                </p>
              ) : null}
            </Field>
          </div>
        </section>

        {/* Description */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold text-foreground">Mô tả giải</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!editable}
            rows={4}
            placeholder="Giới thiệu về giải chạy…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </section>

        {/* Bank info */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold text-foreground">Tài khoản giải ngân (BTC)</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Chủ tài khoản" disabled={!editable}>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                disabled={!editable}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </Field>
            <Field label="Số tài khoản" disabled={!editable}>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                disabled={!editable}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </Field>
            <Field label="Tên ngân hàng" disabled={!editable}>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={!editable}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </Field>
            <Field label="Chi nhánh" disabled={!editable}>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={!editable}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </Field>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  disabled,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  disabled?: boolean;
  icon?: typeof Calendar;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
