"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
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
import { getEventById } from "@/api/events";
import { submitRaceEvent, uploadOrganizerFile } from "@/api/organizer";
import { updateEventProfile } from "@/api/event-packages";
import { getOrganizerWallet, saveOrganizerBankAccount } from "@/api/finance";
import type { RaceEventDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { todayYmdLocal, tomorrowYmdLocal } from "@/lib/event-lifecycle";
import { getOrganizerStatusLabel, getStatusColor } from "@/lib/format";
import { mediaDisplayUrl } from "@/lib/media-url";
import {
  canEditProfile,
  canSubmitForApproval,
  localInputToUtcIso,
  statusKey,
  utcToLocalInput,
} from "../_shared";

const DEFAULT_GRADIENT =
  "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #dc2626 100%)";

export default function ProfileBasicClient() {
  const params = useParams();
  const eventId = String(params?.id || "");

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [totalRunners, setTotalRunners] = useState(0);
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  /** Cùng schema Ví & giải ngân (Finance bank account). */
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [branch, setBranch] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getEventById(eventId);
        if (cancelled) return;
        setEvent(data);
        setName(data.name || "");
        setTagline(data.tagline || "");
        setLocation(data.location || "");
        setDate(data.date ? data.date.split("T")[0] : "");
        setEndDate(data.endDate ? String(data.endDate).split("T")[0] : "");
        setDescription(data.description || "");
        setBannerImage(data.bannerImage || "");
        setTotalRunners(data.totalRunners || 0);
        setOpensAt(utcToLocalInput(data.registrationOpensAtUtc));
        setClosesAt(utcToLocalInput(data.registrationClosesAtUtc));
        const ba = data.organizer?.beneficiaryAccount;
        setAccountHolder(ba?.accountHolder || "");
        setAccountNumber(ba?.accountNumber || "");
        setBankName(ba?.bankName || "");
        setBranch(ba?.branch || "");
        setTransferNote(ba?.transferNote || "");
        // Ưu tiên tài khoản Ví & giải ngân (Finance) nếu đã có — khớp 1 nguồn.
        try {
          const wallet = await getOrganizerWallet();
          if (cancelled) return;
          const wb = wallet.bankAccount;
          if (wb?.bankName || wb?.accountNumber) {
            setBankName(wb.bankName || "");
            setAccountNumber(wb.accountNumber || "");
            setAccountHolder(wb.accountHolderName || "");
            setBranch(wb.branch || "");
            setTransferNote(wb.transferNote || "");
          }
        } catch {
          /* giữ beneficiary từ event */
        }
      } catch (e) {
        if (!cancelled)
          setError(getApiErrorMessage(e, "Không tải được hồ sơ giải."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

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

  const handleSave = useCallback(async () => {
    if (saving || !event) return;

    const today = todayYmdLocal();
    if (editable) {
      if (!date) {
        setError("Vui lòng chọn ngày tổ chức.");
        return;
      }
      if (date <= today) {
        setError("Ngày tổ chức phải sau hôm nay (không chọn hôm nay hoặc quá khứ).");
        return;
      }
      if (endDate) {
        if (endDate <= today) {
          setError("Ngày kết thúc phải sau hôm nay.");
          return;
        }
        if (endDate < date) {
          setError("Ngày kết thúc không được trước ngày tổ chức.");
          return;
        }
      }
    }

    const opensIso = localInputToUtcIso(opensAt);
    const closesIso = localInputToUtcIso(closesAt);
    if (opensIso && closesIso && new Date(closesIso) <= new Date(opensIso)) {
      setError("Đóng ĐK phải sau thời điểm mở ĐK.");
      return;
    }
    if (date) {
      const raceStart = new Date(`${date}T00:00:00`);
      if (opensIso && new Date(opensIso) >= raceStart) {
        setError("Mở đăng ký phải trước ngày tổ chức giải.");
        return;
      }
      if (closesIso && new Date(closesIso) >= raceStart) {
        setError("Đóng đăng ký phải trước ngày tổ chức giải.");
        return;
      }
    }
    if (
      closesIso &&
      event.packageExpiresAtUtc &&
      new Date(closesIso) > new Date(event.packageExpiresAtUtc)
    ) {
      setError("Đóng ĐK không được sau hạn gói tổ chức.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const org = event.organizer;
      const hasBank =
        accountHolder.trim() ||
        accountNumber.trim() ||
        bankName.trim() ||
        branch.trim();
      const editable = canEditProfile(event.status);

      if (editable) {
        await updateEventProfile(eventId, {
          name: name.trim() || undefined,
          tagline: tagline.trim() || undefined,
          location: location.trim() || undefined,
          date: date || undefined,
          endDate: endDate || undefined,
          clearEndDate: !endDate,
          description: description.trim() || undefined,
          bannerImage: bannerImage || undefined,
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
                    transferNote: transferNote.trim() || undefined,
                  },
                },
              }
            : {}),
        });
      }

      // Đồng bộ cùng API Ví & giải ngân
      if (bankName.trim() && accountNumber.trim()) {
        await saveOrganizerBankAccount({
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountHolderName: accountHolder.trim(),
          branch: branch.trim() || undefined,
          transferNote: transferNote.trim() || undefined,
        });
      }

      await updateEventProfile(eventId, {
        setRegistrationWindow: true,
        registrationOpensAtUtc: opensIso,
        registrationClosesAtUtc: closesIso,
      });
      const refreshed = await getEventById(eventId);
      setEvent(refreshed);
      notify("Đã lưu thông tin cơ bản.");
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
    tagline,
    location,
    date,
    endDate,
    description,
    bannerImage,
    totalRunners,
    opensAt,
    closesAt,
    accountHolder,
    accountNumber,
    bankName,
    branch,
    transferNote,
  ]);

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
      <div className="flex min-h-[40vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-bold">Không tìm thấy giải</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Link href="/my-events" className="mt-6 inline-block text-sm font-bold text-orange-600">
          Về danh sách
        </Link>
      </div>
    );
  }

  const editable = canEditProfile(event.status);
  const showSubmit = canSubmitForApproval(event.status);
  const bannerUrl = bannerImage ? mediaDisplayUrl(bannerImage) : null;
  const canEditWindow =
    !["suspended", "cancelled", "completed"].includes(statusKey(event.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Chi tiết giải
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            Thông tin cơ bản
          </h1>
          <span
            className={`mt-2 inline-flex rounded-md border px-2.5 py-1 text-[11px] font-extrabold ${getStatusColor(event.status)}`}
          >
            {getOrganizerStatusLabel(event.status)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(editable || canEditWindow) && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-bold hover:border-orange-300 hover:text-orange-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Lưu
            </button>
          )}
          {showSubmit && (
            <button
              type="button"
              disabled={submittingApproval || !name.trim()}
              onClick={() => void handleSubmitApproval()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {submittingApproval ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Gửi duyệt
            </button>
          )}
        </div>
      </div>

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
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
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
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5" />
                )}
                {uploading ? "Đang tải…" : "Đổi ảnh banner"}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <FileText className="h-4 w-4 text-orange-500" /> Thông tin giải
          </h2>
          <div className="space-y-3">
            <Field label="Tên giải" required>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editable}
                className={inputClass}
              />
            </Field>
            <Field label="Tagline">
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                disabled={!editable}
                className={inputClass}
              />
            </Field>
            <Field label="Địa điểm" required icon={MapPin}>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={!editable}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày tổ chức" required icon={Calendar}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={!editable}
                  min={tomorrowYmdLocal()}
                  className={inputClass}
                />
              </Field>
              <Field label="Ngày kết thúc" icon={Calendar}>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!editable}
                  min={date && date > tomorrowYmdLocal() ? date : tomorrowYmdLocal()}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field
              label="Quy mô VĐV"
              icon={Users}
            >
              <input
                type="number"
                value={totalRunners || ""}
                onChange={(e) => setTotalRunners(Number(e.target.value) || 0)}
                disabled={!editable || Boolean(event.packagePurchaseId)}
                min={0}
                className={inputClass}
              />
              {event.packagePurchaseId ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Theo gói — không chỉnh sửa.
                  {event.packageExpiresAtUtc
                    ? ` Hết hạn: ${new Date(event.packageExpiresAtUtc).toLocaleDateString("vi-VN")}.`
                    : null}
                </p>
              ) : null}
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold">Lịch mở / đóng đăng ký</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Job hệ thống tự mở ĐK khi tới giờ (giải đã Approved) và tự đóng khi tới hạn.
            Mở/đóng ĐK phải trước ngày tổ chức; đóng sau mở; không sau hạn gói.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Mở đăng ký">
              <input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                disabled={!canEditWindow}
                className={inputClass}
              />
            </Field>
            <Field label="Đóng đăng ký">
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                disabled={!canEditWindow}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold">Mô tả giải</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!editable}
            rows={4}
            placeholder="Giới thiệu về giải chạy…"
            className={inputClass}
          />
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-1 text-sm font-bold">Tài khoản nhận giải ngân</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Cùng tài khoản với mục <strong>Ví &amp; giải ngân</strong> — lưu ở đây
            sẽ đồng bộ sang ví.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Ngân hàng">
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Số tài khoản">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Chủ tài khoản">
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Chi nhánh">
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Đà Nẵng, Hà Nội,…"
                className={inputClass}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Nội dung CK giải ngân (gợi ý)">
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Giai ngan BTC + ten giải"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
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
