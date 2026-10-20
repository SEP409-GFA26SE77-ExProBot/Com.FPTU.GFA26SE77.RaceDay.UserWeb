"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileText,
  ImageIcon,
  Loader2,
  Save,
  Users } from "lucide-react";
import Link from "next/link";
import { getEventById } from "@/api/events";
import { uploadOrganizerFile } from "@/api/organizer";
import { updateEventProfile } from "@/api/event-packages";
import OrganizerLocationFields from "@/components/organizer/OrganizerLocationFields";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { toastError, toastSuccess } from "@/lib/toast";
import { mediaDisplayUrl } from "@/lib/media-url";
import { composeLocation, splitLocation } from "@/lib/vn-provinces";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

function statusKey(status: string) {
  return (status || "").toLowerCase().replace(/_/g, "-");
}

function canEdit(status: string) {
  const k = statusKey(status);
  return k === "draft" || k === "rejected";
}

export default function EventProfileClient() {
  const params = useParams();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [provinceKey, setProvinceKey] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
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
        {
          const loc = splitLocation(data.location || "");
          setProvinceKey(loc.provinceKey);
          setLocationDetail(loc.detail);
        }
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
      toastSuccess("Tải ảnh banner thành công.");
    } catch (e) {
      toastError(e, "Upload thất bại.");
    } finally {
      setUploading(false);
    }
  }, []);

  // Save profile — body khớp UpdateDraftProfileRequest (organizer + beneficiaryAccount)
  const handleSave = useCallback(async () => {
    if (saving || !event) return;
    if (!provinceKey) {
      toastError("Vui lòng chọn tỉnh / thành phố.");
      return;
    }
    setSaving(true);

    try {
      const org = event.organizer;
      const hasBank =
        accountHolder.trim() ||
        accountNumber.trim() ||
        bankName.trim() ||
        branch.trim();
      await updateEventProfile(eventId, {
        name: name.trim() || undefined,
        location: composeLocation(locationDetail, provinceKey) || undefined,
        date: date || undefined,
        description: description.trim() || undefined,
        bannerImage: bannerImage || undefined,
        // Không gửi totalRunners nếu theo gói — BE từ chối sửa
        ...(event.packagePurchaseId
          ? {}
          : { totalRunners: totalRunners || undefined }),
        ...(hasBank && org?.name && org?.email
          ? (() => {
              const phone = String(org.phone || "").trim();
              const digits = phone.replace(/\D/g, "");
              const phoneOk =
                phone.length > 0 &&
                !/^0+$/.test(digits) &&
                /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(
                  phone.replace(/[\s.\-()]/g, "")
                );
              if (!phoneOk) {
                throw new Error(
                  "Cần SĐT ban tổ chức hợp lệ (VD: 0901234567) trước khi lưu tài khoản giải ngân. Vào Thông tin cơ bản để cập nhật."
                );
              }
              return {
                organizer: {
                  name: org.name,
                  email: org.email,
                  phone,
                  legalEntity: org.legalEntity,
                  website: org.website,
                  beneficiaryAccount: {
                    accountHolder: accountHolder.trim() || undefined,
                    accountNumber: accountNumber.trim() || undefined,
                    bankName: bankName.trim() || undefined,
                    branch: branch.trim() || undefined } } };
            })()
          : {}) });
      const refreshed = await getEventById(eventId);
      setEvent(refreshed);
      toastSuccess("Đã lưu hồ sơ giải.");
    } catch (e) {
      toastError(e, "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    event,
    eventId,
    name,
    provinceKey,
    locationDetail,
    date,
    description,
    bannerImage,
    totalRunners,
    accountHolder,
    accountNumber,
    bankName,
    branch,
  ]);

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
            Hồ sơ giải
          </h1>
          {editable && (
            <p className="mt-2 text-xs text-muted-foreground">
              Gửi admin duyệt tại{" "}
              <Link
                href={`/organizer/events/${eventId}/profile/open-registration`}
                className="font-bold text-orange-600 hover:underline"
              >
                Xét mở chính thức
              </Link>
              .
            </p>
          )}
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
            <OrganizerLocationFields
              provinceKey={provinceKey}
              detail={locationDetail}
              onProvinceChange={setProvinceKey}
              onDetailChange={setLocationDetail}
              disabled={!editable}
            />
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
  children }: {
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
