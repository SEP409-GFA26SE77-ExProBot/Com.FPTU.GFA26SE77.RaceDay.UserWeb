"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Upload } from "lucide-react";
import {
  getRegistrationById,
  resubmitRejectedRegistration,
  uploadHealthCert,
} from "@/api/events";
import type { RegistrationDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import {
  isValidDateOfBirth,
  isValidEmail,
  isValidOptionalBloodType,
  isValidOptionalGender,
  isValidRequiredIdNumber,
  isValidVietnamPhone,
  MSG,
  phonesMatch,
} from "@/lib/input-rules";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

/** Khớp form đăng ký (events/[id]/register) — không thêm field ngoài. */
const EMERGENCY_RELATIONS = [
  "Ba/Mẹ",
  "Chồng/Vợ",
  "Anh/Chị/Em",
  "Người thân",
  "Bạn bè",
] as const;

const BLOOD_OPTIONS = [
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O",
  "A",
  "B",
  "AB",
] as const;

const MEDICAL_OPTIONS = [
  { code: "cardiovascular", label: "Bệnh lý tim mạch" },
  { code: "respiratory", label: "Bệnh lý hô hấp" },
  { code: "cns", label: "Bệnh lý hệ thần kinh trung ương" },
  { code: "injury", label: "Chấn thương" },
  { code: "thermoregulation", label: "Rối loạn thân nhiệt" },
  { code: "electrolyte", label: "Rối loạn nước điện giải" },
  { code: "consciousness", label: "Rối loạn tri giác" },
  { code: "seizure", label: "Co giật" },
  { code: "pregnancy", label: "Phụ nữ đang mang thai" },
  { code: "none", label: "Không mắc bệnh lý đặc biệt" },
] as const;

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  shirtSize: string;
  bibName: string;
  bloodType: string;
  medicalCodes: string[];
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  liabilityAccepted: boolean;
};

type FieldErrors = Partial<
  Record<keyof FormState | "healthCert" | "medicalCodes", string>
>;

function normalizeGender(raw?: string | null): string {
  const g = (raw || "").trim().toLowerCase();
  if (!g) return "";
  if (g === "nam" || g === "male" || g === "m" || g === "1") return "Male";
  if (g === "nữ" || g === "nu" || g === "female" || g === "f" || g === "2")
    return "Female";
  if (g === "khác" || g === "khac" || g === "other" || g === "0" || g === "3")
    return "Other";
  if (raw === "Male" || raw === "Female" || raw === "Other") return raw;
  return "";
}

function parseMedicalCodes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function ResubmitRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [reg, setReg] = useState<RegistrationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [healthCert, setHealthCert] = useState<File | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await getRegistrationById(id);
        if (cancelled) return;
        if (r.status !== "rejected") {
          setError("Chỉ đơn bị từ chối mới được sửa và nộp lại.");
          setReg(r);
          return;
        }
        setReg(r);
        setForm({
          fullName: r.fullName || "",
          email: r.email || "",
          phone: r.phone || "",
          dateOfBirth: r.dateOfBirth?.slice(0, 10) || "",
          gender: normalizeGender(r.gender),
          idNumber: r.idNumber || "",
          shirtSize: r.shirtSize || "",
          bibName: r.bibName || "",
          bloodType: r.bloodType || "",
          medicalCodes: parseMedicalCodes(r.medicalCodes),
          emergencyName: r.emergencyName || "",
          emergencyPhone: r.emergencyPhone || "",
          emergencyRelation: r.emergencyRelation || "",
          liabilityAccepted: true,
        });
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được đăng ký."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setFieldErrors((prev) => {
      if (!prev[key as keyof FieldErrors]) return prev;
      const next = { ...prev };
      delete next[key as keyof FieldErrors];
      return next;
    });
  };

  const toggleMedical = (code: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      let next = [...prev.medicalCodes];
      if (code === "none") {
        next = next.includes("none") ? [] : ["none"];
      } else {
        next = next.filter((c) => c !== "none");
        if (next.includes(code)) next = next.filter((c) => c !== code);
        else next.push(code);
      }
      return { ...prev, medicalCodes: next };
    });
    setFieldErrors((prev) => {
      const n = { ...prev };
      delete n.medicalCodes;
      delete n.healthCert;
      return n;
    });
  };

  const medicalNoneOnly =
    !!form &&
    form.medicalCodes.length === 1 &&
    form.medicalCodes[0] === "none";

  const validate = (): boolean => {
    if (!form || !reg) return false;
    const e: FieldErrors = {};

    if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ tên";
    else if (form.fullName.trim().length > 100)
      e.fullName = "Họ tên tối đa 100 ký tự.";

    if (!form.email.trim()) e.email = "Vui lòng nhập email";
    else if (!isValidEmail(form.email)) e.email = "Email không hợp lệ.";

    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    else if (!isValidVietnamPhone(form.phone)) e.phone = MSG.phone;

    if (!form.gender) e.gender = "Vui lòng chọn giới tính";
    else if (!isValidOptionalGender(form.gender)) e.gender = MSG.gender;

    if (!form.dateOfBirth) e.dateOfBirth = "Vui lòng nhập ngày sinh";
    else if (!isValidDateOfBirth(form.dateOfBirth))
      e.dateOfBirth = MSG.dateOfBirth;

    if (!form.idNumber.trim()) e.idNumber = MSG.idNumberRequired;
    else if (!isValidRequiredIdNumber(form.idNumber)) e.idNumber = MSG.idNumber;

    if (form.bibName.trim().length > 40)
      e.bibName = "Tên trên BIB tối đa 40 ký tự.";

    if (!form.bloodType.trim()) e.bloodType = MSG.bloodTypeRequired;
    else if (!isValidOptionalBloodType(form.bloodType))
      e.bloodType = MSG.bloodType;

    if (form.medicalCodes.length === 0)
      e.medicalCodes =
        "Chọn ít nhất một mục bệnh lý (hoặc “Không mắc…”).";
    else if (
      form.medicalCodes.includes("none") &&
      form.medicalCodes.length > 1
    )
      e.medicalCodes =
        "Không thể chọn “Không mắc bệnh lý đặc biệt” cùng các bệnh khác.";

    if (!medicalNoneOnly) {
      if (!healthCert && !reg.healthCertUrl)
        e.healthCert = "Vui lòng đính kèm phiếu khám sức khỏe.";
    }
    if (healthCert) {
      const okType =
        ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(
          healthCert.type
        ) || /\.(pdf|jpe?g|png)$/i.test(healthCert.name);
      if (!okType) e.healthCert = "Chỉ chấp nhận PDF, JPG, PNG.";
      else if (healthCert.size > 5 * 1024 * 1024)
        e.healthCert = "File tối đa 5MB.";
    }

    if (!form.emergencyName.trim())
      e.emergencyName = "Vui lòng nhập người liên hệ khẩn cấp";
    else if (form.emergencyName.trim().length > 100)
      e.emergencyName = "Tên liên hệ khẩn cấp tối đa 100 ký tự.";

    if (!form.emergencyPhone.trim())
      e.emergencyPhone = "Vui lòng nhập SĐT khẩn cấp";
    else if (!isValidVietnamPhone(form.emergencyPhone))
      e.emergencyPhone = MSG.phone;
    else if (phonesMatch(form.emergencyPhone, form.phone))
      e.emergencyPhone = MSG.emergencyPhoneSame;

    if (!form.emergencyRelation.trim())
      e.emergencyRelation = MSG.emergencyRelation;

    if (!form.liabilityAccepted) e.liabilityAccepted = MSG.liability;

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form || !reg) return;
    if (!validate()) {
      setError("Vui lòng sửa các ô được đánh dấu trước khi nộp lại.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let healthCertFileName = reg.healthCertFileName;
      let healthCertUrl = reg.healthCertUrl;
      if (healthCert) {
        const up = await uploadHealthCert(healthCert);
        healthCertFileName = up.fileName;
        healthCertUrl = up.fileUrl;
      }

      await resubmitRejectedRegistration(reg.id, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender,
        idNumber: form.idNumber.trim(),
        // Giữ giá trị cũ nếu có (form ĐK không nhập UI nhưng API vẫn nhận)
        heightCm: reg.heightCm ?? undefined,
        weightKg: reg.weightKg ?? undefined,
        bloodType: form.bloodType.trim(),
        emergencyName: form.emergencyName.trim(),
        emergencyPhone: form.emergencyPhone.trim(),
        emergencyRelation: form.emergencyRelation || undefined,
        shirtType: reg.shirtType || undefined,
        shirtSize: form.shirtSize || undefined,
        shirtColor: reg.shirtColor || undefined,
        bibName: form.bibName.trim() || undefined,
        medicalCodes: form.medicalCodes,
        healthCertFileName: healthCertFileName || undefined,
        healthCertUrl: healthCertUrl || undefined,
        liabilityAccepted: true,
      });

      router.replace(
        `/events/${reg.eventId}/pending?regId=${reg.id}&resubmitted=1`
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Nộp lại thất bại."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading title="Đang tải hồ sơ…" />;

  if (!form || !reg || reg.status !== "rejected") {
    return (
      <div className={`${PAGE_SHELL_FORM} py-8`}>
        <p className="text-sm text-red-700">
          {error || "Không thể mở form nộp lại."}
        </p>
        <Link
          href={`/my-registrations/${id}`}
          className="mt-3 inline-block text-sm font-semibold text-orange-600"
        >
          Quay lại vé
        </Link>
      </div>
    );
  }

  const labelClass = "text-xs font-semibold text-foreground";
  const inputClass = (key: keyof FieldErrors) =>
    `mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/15 ${
      fieldErrors[key]
        ? "border-red-400 focus:border-red-500"
        : "border-border focus:border-orange-500/50"
    }`;

  const FieldError = ({ k }: { k: keyof FieldErrors }) =>
    fieldErrors[k] ? (
      <p className="mt-1 text-xs text-red-500">{fieldErrors[k]}</p>
    ) : null;

  return (
    <div className={`${PAGE_SHELL_FORM} space-y-4 py-6 pb-10`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/my-registrations/${reg.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại vé
          </Link>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">
            Chỉnh sửa & nộp lại hồ sơ
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Cùng các trường như lúc đăng ký. Đã thanh toán — không trả tiền lại.
          </p>
        </div>
        {reg.rejectionReason ? (
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            <span className="text-[10px] font-bold uppercase tracking-wide text-red-700">
              Lý do từ chối ·{" "}
            </span>
            {reg.rejectionReason}
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-base font-bold">Thông tin cá nhân</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Họ tên *</span>
              <input
                className={inputClass("fullName")}
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
              />
              <FieldError k="fullName" />
            </label>
            <label className="block">
              <span className={labelClass}>Email *</span>
              <input
                type="email"
                className={inputClass("email")}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
              <FieldError k="email" />
            </label>
            <label className="block">
              <span className={labelClass}>SĐT *</span>
              <input
                className={inputClass("phone")}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
              <FieldError k="phone" />
            </label>
            <label className="block">
              <span className={labelClass}>Giới tính *</span>
              <select
                className={inputClass("gender")}
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
              >
                <option value="">Chọn giới tính</option>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
              <FieldError k="gender" />
            </label>
            <label className="block">
              <span className={labelClass}>Ngày sinh *</span>
              <input
                type="date"
                className={inputClass("dateOfBirth")}
                value={form.dateOfBirth}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
              />
              <FieldError k="dateOfBirth" />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Số CCCD / Hộ chiếu *</span>
              <input
                className={inputClass("idNumber")}
                value={form.idNumber}
                onChange={(e) => setField("idNumber", e.target.value)}
              />
              <FieldError k="idNumber" />
            </label>
            <label className="block">
              <span className={labelClass}>Size áo</span>
              <select
                className={inputClass("shirtSize")}
                value={form.shirtSize}
                onChange={(e) => setField("shirtSize", e.target.value)}
              >
                <option value="">Để trống / Chọn size</option>
                {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Tên trên BIB</span>
              <input
                className={inputClass("bibName")}
                value={form.bibName}
                maxLength={40}
                placeholder="Tên in trên số BIB"
                onChange={(e) => setField("bibName", e.target.value)}
              />
              <FieldError k="bibName" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-base font-bold">Thông tin y tế</h2>
          <label className="block max-w-xs">
            <span className={labelClass}>Nhóm máu *</span>
            <select
              className={inputClass("bloodType")}
              value={form.bloodType}
              onChange={(e) => setField("bloodType", e.target.value)}
            >
              <option value="">Chọn nhóm máu</option>
              {BLOOD_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <FieldError k="bloodType" />
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MEDICAL_OPTIONS.map((opt) => (
              <label
                key={opt.code}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  form.medicalCodes.includes(opt.code)
                    ? "border-orange-500/40 bg-orange-500/5"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.medicalCodes.includes(opt.code)}
                  onChange={() => toggleMedical(opt.code)}
                  className="h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
          <FieldError k="medicalCodes" />

          <div>
            <span className={labelClass}>
              Phiếu khám sức khỏe (PDF/JPG/PNG, ≤5MB)
              {medicalNoneOnly ? " — không bắt buộc" : " *"}
            </span>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {reg.healthCertFileName
                ? `Hiện tại: ${reg.healthCertFileName}`
                : "Chưa có file."}
              {healthCert ? ` · Mới: ${healthCert.name}` : ""}
            </p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-muted">
              <Upload className="h-3.5 w-3.5 text-orange-500" />
              {healthCert ? "Đổi file" : "Chọn file"}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  setHealthCert(e.target.files?.[0] ?? null);
                  setFieldErrors((prev) => {
                    const n = { ...prev };
                    delete n.healthCert;
                    return n;
                  });
                }}
              />
            </label>
            <FieldError k="healthCert" />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-base font-bold">Liên hệ khẩn cấp</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Tên người liên hệ *</span>
              <input
                className={inputClass("emergencyName")}
                value={form.emergencyName}
                onChange={(e) => setField("emergencyName", e.target.value)}
              />
              <FieldError k="emergencyName" />
            </label>
            <label className="block">
              <span className={labelClass}>SĐT liên hệ *</span>
              <input
                className={inputClass("emergencyPhone")}
                value={form.emergencyPhone}
                onChange={(e) => setField("emergencyPhone", e.target.value)}
              />
              <FieldError k="emergencyPhone" />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Mối quan hệ với người tham gia *</span>
              <select
                className={inputClass("emergencyRelation")}
                value={form.emergencyRelation}
                onChange={(e) => setField("emergencyRelation", e.target.value)}
              >
                <option value="">- Chọn quan hệ -</option>
                {EMERGENCY_RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <FieldError k="emergencyRelation" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.liabilityAccepted}
              onChange={(e) => setField("liabilityAccepted", e.target.checked)}
            />
            <span>
              Tôi xác nhận thông tin đúng và chấp nhận điều khoản trách nhiệm. *
            </span>
          </label>
          <FieldError k="liabilityAccepted" />

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-sm font-bold text-white disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Nộp lại cho BTC duyệt"
            )}
          </button>
        </section>
      </form>
    </div>
  );
}
