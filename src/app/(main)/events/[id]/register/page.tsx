"use client";

import { PAGE_SHELL_FORM } from "@/lib/page-shell";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Shirt,
  HeartPulse,
  ChevronRight,
  FileUp,
  ShieldCheck,
  Sparkles,
  LogIn,
} from "lucide-react";
import { getEventById, formatPrice } from "@/data/mock-events";
import PageLoading from "@/components/ui/PageLoading";

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

type MedicalCode = (typeof MEDICAL_OPTIONS)[number]["code"];

const SHIRT_TYPES = ["Áo thun", "Áo tank", "Áo dài tay", "Áo hoodie"] as const;
const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const SHIRT_COLORS = ["Đỏ RaceDay", "Đen", "Trắng", "Xám"] as const;
const BLOOD_TYPES = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

interface FormData {
  selectedDistanceId: number | null;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  phone: string;
  heightCm: string;
  weightKg: string;
  bloodType: string;
  emergencyName: string;
  emergencyPhone: string;
  wantShirt: boolean;
  shirtType: string;
  shirtSize: string;
  shirtColor: string;
  medicalCodes: MedicalCode[];
  liabilityAccepted: boolean;
}

type ErrorMap = Partial<Record<keyof FormData | "healthCert" | "medicalCodes", string>>;

const INITIAL: FormData = {
  selectedDistanceId: null,
  fullName: "",
  dateOfBirth: "",
  gender: "",
  idNumber: "",
  phone: "",
  heightCm: "",
  weightKg: "",
  bloodType: "",
  emergencyName: "",
  emergencyPhone: "",
  wantShirt: false,
  shirtType: "",
  shirtSize: "",
  shirtColor: "",
  medicalCodes: [],
  liabilityAccepted: false,
};

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function isValidVnPhone(phone: string): boolean {
  const p = phone.replace(/[\s.-]/g, "");
  return /^(0\d{9}|\+84\d{9})$/.test(p);
}

function isValidIdNumber(value: string): boolean {
  const v = value.trim().toUpperCase();
  if (/^\d{9}$/.test(v) || /^\d{12}$/.test(v)) return true;
  return /^[A-Z0-9]{6,12}$/.test(v);
}

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const event = getEventById(eventId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>(INITIAL);
  const [healthCert, setHealthCert] = useState<File | null>(null);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const age = useMemo(() => calcAge(formData.dateOfBirth), [formData.dateOfBirth]);

  useEffect(() => {
    const token = Cookies.get("access_token");
    setIsLoggedIn(Boolean(token));
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return (
      <PageLoading
        title="Đang kiểm tra đăng nhập…"
        description="Chuẩn bị form đăng ký và khai báo y tế."
        icon={ShieldCheck}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <LogIn className="h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-bold">Cần đăng nhập để đăng ký giải</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          Vui lòng đăng nhập tài khoản Runner trước khi điền form khai báo y tế và thanh toán.
        </p>
        <Link
          href={`/login?from=/events/${eventId}/register`}
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy giải</h1>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về danh sách giải
        </Link>
      </div>
    );
  }

  if (event.status !== "registration-open") {
    const msg =
      event.status === "sold-out"
        ? "Giải đã hết slot đăng ký."
        : event.status === "upcoming"
          ? "Giải chưa mở đăng ký."
          : "Giải đã đóng đăng ký / kết thúc.";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <h1 className="text-2xl font-bold">Không thể đăng ký</h1>
        <p className="text-muted-foreground max-w-md">{msg}</p>
        <p className="text-sm font-medium">{event.title}</p>
        <Link
          href={`/events/${event.id}`}
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Về chi tiết giải
        </Link>
      </div>
    );
  }

  const allSoldOut = event.distances.every((d) => d.registeredSlots >= d.maxSlots);
  if (allSoldOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <h1 className="text-2xl font-bold">Hết slot toàn bộ hạng mục</h1>
        <p className="text-muted-foreground max-w-md">
          Hiện không còn hạng mục nào còn chỗ. Vui lòng chọn giải khác.
        </p>
        <Link href="/events" className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
          Xem giải khác
        </Link>
      </div>
    );
  }

  const selectedDistance = event.distances.find((d) => d.id === formData.selectedDistanceId);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleMedical = (code: MedicalCode) => {
    setFormData((prev) => {
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
    if (errors.medicalCodes) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.medicalCodes;
        return next;
      });
    }
  };

  const fillSample = () => {
    const openDistance = event.distances.find((d) => d.registeredSlots < d.maxSlots);
    setFormData({
      selectedDistanceId: openDistance?.id ?? null,
      fullName: "Nguyễn Văn An",
      dateOfBirth: "1998-05-12",
      gender: "male",
      idNumber: "079098001234",
      phone: "0901234567",
      heightCm: "172",
      weightKg: "65",
      bloodType: "O+",
      emergencyName: "Nguyễn Thị Hoa",
      emergencyPhone: "0912345678",
      wantShirt: true,
      shirtType: "Áo thun",
      shirtSize: "M",
      shirtColor: "Đỏ RaceDay",
      medicalCodes: ["none"],
      liabilityAccepted: true,
    });
    setHealthCert(null);
    setErrors({});
    // Mock file metadata via empty File for prototype when user chưa upload
    try {
      const blob = new Blob(["PHIEU KHAM SK MAU"], { type: "application/pdf" });
      setHealthCert(new File([blob], "phieu-kham-suc-khoe-nguyen-van-an.pdf", { type: "application/pdf" }));
    } catch {
      /* ignore */
    }
  };

  const validate = (): boolean => {
    const e: ErrorMap = {};

    if (!formData.selectedDistanceId) e.selectedDistanceId = "Vui lòng chọn hạng mục thi đấu.";
    if (!formData.fullName.trim()) e.fullName = "Vui lòng nhập họ tên.";
    if (!formData.dateOfBirth) e.dateOfBirth = "Vui lòng chọn ngày sinh.";
    else if (age != null && (age < 12 || age > 90)) e.dateOfBirth = "Tuổi hợp lệ từ 12–90.";
    if (!formData.gender) e.gender = "Vui lòng chọn giới tính.";
    if (!formData.idNumber.trim()) e.idNumber = "Vui lòng nhập CCCD hoặc hộ chiếu.";
    else if (!isValidIdNumber(formData.idNumber))
      e.idNumber = "CCCD phải 9 hoặc 12 số, hoặc hộ chiếu 6–12 ký tự.";
    if (!formData.phone.trim()) e.phone = "Vui lòng nhập số điện thoại.";
    else if (!isValidVnPhone(formData.phone)) e.phone = "Số điện thoại không hợp lệ (0xxxxxxxxx hoặc +84…).";

    const h = Number(formData.heightCm);
    const w = Number(formData.weightKg);
    if (!formData.heightCm || Number.isNaN(h) || h < 100 || h > 250)
      e.heightCm = "Chiều cao (cm) từ 100–250.";
    if (!formData.weightKg || Number.isNaN(w) || w < 30 || w > 200)
      e.weightKg = "Cân nặng (kg) từ 30–200.";

    const hasEmName = formData.emergencyName.trim().length > 0;
    const hasEmPhone = formData.emergencyPhone.trim().length > 0;
    if (hasEmName || hasEmPhone) {
      if (!hasEmName) e.emergencyName = "Đã nhập SĐT — vui lòng nhập tên người thân.";
      if (!hasEmPhone) e.emergencyPhone = "Đã nhập tên — vui lòng nhập SĐT người thân.";
      else if (!isValidVnPhone(formData.emergencyPhone))
        e.emergencyPhone = "SĐT người thân không hợp lệ.";
      else if (
        formData.phone.replace(/\D/g, "") === formData.emergencyPhone.replace(/\D/g, "")
      )
        e.emergencyPhone = "SĐT người thân không được trùng SĐT của bạn.";
    }

    if (formData.wantShirt) {
      if (!formData.shirtType) e.shirtType = "Vui lòng chọn loại áo.";
      if (!formData.shirtSize) e.shirtSize = "Vui lòng chọn size áo.";
      if (!formData.shirtColor) e.shirtColor = "Vui lòng chọn màu áo.";
    }

    if (formData.medicalCodes.length === 0)
      e.medicalCodes = "Vui lòng chọn ít nhất một mục bệnh lý (hoặc “Không mắc…”).";
    else if (formData.medicalCodes.includes("none") && formData.medicalCodes.length > 1)
      e.medicalCodes = "Không thể chọn “Không mắc bệnh lý đặc biệt” cùng các bệnh khác.";

    if (!healthCert) e.healthCert = "Vui lòng đính kèm phiếu khám sức khỏe gần nhất.";
    else {
      const okType = ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(
        healthCert.type
      ) || /\.(pdf|jpe?g|png)$/i.test(healthCert.name);
      if (!okType) e.healthCert = "Chỉ chấp nhận PDF, JPG, PNG.";
      if (healthCert.size > 5 * 1024 * 1024) e.healthCert = "File tối đa 5MB.";
    }

    if (!formData.liabilityAccepted)
      e.liabilityAccepted = "Bạn phải xác nhận miễn trừ trách nhiệm để tiếp tục.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate() || !selectedDistance || !healthCert) return;

    const regData = {
      eventId: event.id,
      eventTitle: event.title,
      distance: selectedDistance,
      personal: {
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        age,
        gender: formData.gender,
        idNumber: formData.idNumber.trim(),
        phone: formData.phone.trim(),
        heightCm: Number(formData.heightCm),
        weightKg: Number(formData.weightKg),
        bloodType: formData.bloodType || null,
      },
      emergency:
        formData.emergencyName.trim() && formData.emergencyPhone.trim()
          ? {
              name: formData.emergencyName.trim(),
              phone: formData.emergencyPhone.trim(),
            }
          : null,
      shirt: formData.wantShirt
        ? {
            type: formData.shirtType,
            size: formData.shirtSize,
            color: formData.shirtColor,
          }
        : null,
      medical: {
        conditions: formData.medicalCodes,
        noneSelected: formData.medicalCodes.includes("none"),
        healthCert: {
          name: healthCert.name,
          size: healthCert.size,
          type: healthCert.type,
        },
      },
      liabilityAccepted: true,
      acceptedAt: new Date().toISOString(),
      // legacy fields for payment page
      fullName: formData.fullName.trim(),
      email: "",
      phone: formData.phone.trim(),
    };
    sessionStorage.setItem("registration_data", JSON.stringify(regData));
    router.push(`/events/${event.id}/payment`);
  };

  const inputClass = (field: keyof ErrorMap) =>
    `w-full rounded-xl border ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
        : "border-border focus:border-orange-500/50 focus:ring-orange-500/20"
    } bg-background py-2.5 px-4 text-sm outline-none transition-all focus:ring-2 placeholder:text-muted-foreground`;

  return (
    <div className={`${PAGE_SHELL_FORM} py-7`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại {event.title}
        </Link>
        <button
          type="button"
          onClick={fillSample}
          className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-500/15"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Điền dữ liệu mẫu (VN)
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Đăng ký tham gia giải
        </h1>
        <p className="mt-1 text-muted-foreground">{event.title}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Bao gồm khai báo y tế cơ bản theo quy định BTC. Các mục có dấu * là bắt buộc.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* 1 Distance */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  1
                </span>
                Chọn hạng mục *
              </h2>
              {errors.selectedDistanceId && (
                <p className="text-xs text-red-500 font-medium">{errors.selectedDistanceId}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.distances.map((d) => {
                  const soldOut = d.registeredSlots >= d.maxSlots;
                  const isSelected = formData.selectedDistanceId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => updateField("selectedDistanceId", d.id)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        soldOut
                          ? "border-border/50 bg-muted/50 cursor-not-allowed opacity-60"
                          : isSelected
                            ? "border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/10"
                            : "border-border hover:border-orange-500/40 hover:bg-orange-500/5"
                      }`}
                    >
                      <p className="text-sm font-bold text-foreground">{d.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.km} km • còn {Math.max(0, d.maxSlots - d.registeredSlots)} slot
                      </p>
                      <p className="text-lg font-extrabold text-orange-600 mt-2">
                        {formatPrice(d.price)}
                      </p>
                      {soldOut && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold text-red-500 uppercase">
                          Hết slot
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2 Personal */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  2
                </span>
                Thông tin cá nhân & chỉ số thể chất
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5">
                    <User className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Họ tên *
                  </label>
                  <input
                    className={inputClass("fullName")}
                    placeholder="Nguyễn Văn An"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    <Calendar className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Ngày sinh * {age != null && <span className="text-muted-foreground">({age} tuổi)</span>}
                  </label>
                  <input
                    type="date"
                    className={inputClass("dateOfBirth")}
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Giới tính *</label>
                  <select
                    className={inputClass("gender")}
                    value={formData.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">CCCD / Hộ chiếu *</label>
                  <input
                    className={inputClass("idNumber")}
                    placeholder="079098001234 hoặc C1234567"
                    value={formData.idNumber}
                    onChange={(e) => updateField("idNumber", e.target.value)}
                  />
                  {errors.idNumber && <p className="mt-1 text-xs text-red-500">{errors.idNumber}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    <Phone className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    className={inputClass("phone")}
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Chiều cao (cm) *</label>
                  <input
                    type="number"
                    className={inputClass("heightCm")}
                    placeholder="172"
                    value={formData.heightCm}
                    onChange={(e) => updateField("heightCm", e.target.value)}
                  />
                  {errors.heightCm && <p className="mt-1 text-xs text-red-500">{errors.heightCm}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Cân nặng (kg) *</label>
                  <input
                    type="number"
                    className={inputClass("weightKg")}
                    placeholder="65"
                    value={formData.weightKg}
                    onChange={(e) => updateField("weightKg", e.target.value)}
                  />
                  {errors.weightKg && <p className="mt-1 text-xs text-red-500">{errors.weightKg}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Nhóm máu <span className="text-muted-foreground font-normal">(nếu có)</span>
                  </label>
                  <select
                    className={inputClass("bloodType")}
                    value={formData.bloodType}
                    onChange={(e) => updateField("bloodType", e.target.value)}
                  >
                    {BLOOD_TYPES.map((b) => (
                      <option key={b || "empty"} value={b}>
                        {b || "Không rõ / bỏ trống"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Emergency optional */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  3
                </span>
                Người thân liên hệ khẩn cấp
                <span className="text-xs font-normal text-muted-foreground">(Tuỳ chọn)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    <HeartPulse className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Họ tên người thân
                  </label>
                  <input
                    className={inputClass("emergencyName")}
                    placeholder="Nguyễn Thị Hoa"
                    value={formData.emergencyName}
                    onChange={(e) => updateField("emergencyName", e.target.value)}
                  />
                  {errors.emergencyName && (
                    <p className="mt-1 text-xs text-red-500">{errors.emergencyName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">SĐT người thân</label>
                  <input
                    type="tel"
                    className={inputClass("emergencyPhone")}
                    placeholder="0912345678"
                    value={formData.emergencyPhone}
                    onChange={(e) => updateField("emergencyPhone", e.target.value)}
                  />
                  {errors.emergencyPhone && (
                    <p className="mt-1 text-xs text-red-500">{errors.emergencyPhone}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Shirt optional */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  4
                </span>
                <Shirt className="h-4 w-4 text-orange-500" />
                Đăng ký áo
                <span className="text-xs font-normal text-muted-foreground">(Tuỳ chọn)</span>
              </h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.wantShirt}
                  onChange={(e) => updateField("wantShirt", e.target.checked)}
                  className="rounded border-border"
                />
                Tôi muốn đăng ký áo sự kiện
              </label>
              {formData.wantShirt && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Loại áo *</label>
                    <select
                      className={inputClass("shirtType")}
                      value={formData.shirtType}
                      onChange={(e) => updateField("shirtType", e.target.value)}
                    >
                      <option value="">Chọn loại</option>
                      {SHIRT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {errors.shirtType && (
                      <p className="mt-1 text-xs text-red-500">{errors.shirtType}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Size *</label>
                    <select
                      className={inputClass("shirtSize")}
                      value={formData.shirtSize}
                      onChange={(e) => updateField("shirtSize", e.target.value)}
                    >
                      <option value="">Chọn size</option>
                      {SHIRT_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.shirtSize && (
                      <p className="mt-1 text-xs text-red-500">{errors.shirtSize}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Màu *</label>
                    <select
                      className={inputClass("shirtColor")}
                      value={formData.shirtColor}
                      onChange={(e) => updateField("shirtColor", e.target.value)}
                    >
                      <option value="">Chọn màu</option>
                      {SHIRT_COLORS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.shirtColor && (
                      <p className="mt-1 text-xs text-red-500">{errors.shirtColor}</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Medical */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  5
                </span>
                Danh mục bệnh lý đặc biệt *
              </h2>
              <p className="text-xs text-muted-foreground">
                Bắt buộc chọn ít nhất một mục. Nếu chọn “Không mắc bệnh lý đặc biệt” thì không chọn các mục khác.
              </p>
              {errors.medicalCodes && (
                <p className="text-xs text-red-500 font-medium">{errors.medicalCodes}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MEDICAL_OPTIONS.map((opt) => (
                  <label
                    key={opt.code}
                    className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                      formData.medicalCodes.includes(opt.code)
                        ? "border-orange-500 bg-orange-500/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.medicalCodes.includes(opt.code)}
                      onChange={() => toggleMedical(opt.code)}
                      className="mt-0.5"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* File + liability */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  6
                </span>
                Tệp đính kèm & miễn trừ trách nhiệm
              </h2>
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  <FileUp className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                  Phiếu khám sức khỏe gần nhất * (PDF/JPG/PNG ≤ 5MB)
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                  onChange={(e) => {
                    setHealthCert(e.target.files?.[0] ?? null);
                    if (errors.healthCert) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.healthCert;
                        return n;
                      });
                    }
                  }}
                />
                {healthCert && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Đã chọn: {healthCert.name} ({Math.round(healthCert.size / 1024)} KB)
                  </p>
                )}
                {errors.healthCert && (
                  <p className="mt-1 text-xs text-red-500">{errors.healthCert}</p>
                )}
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  errors.liabilityAccepted ? "border-red-400 bg-red-50/50" : "border-border bg-muted/30"
                }`}
              >
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.liabilityAccepted}
                    onChange={(e) => updateField("liabilityAccepted", e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold flex items-center gap-1 mb-1">
                      <ShieldCheck className="h-4 w-4 text-orange-500" />
                      Xác nhận miễn trừ trách nhiệm về rủi ro sức khỏe cá nhân *
                    </span>
                    Tôi cam kết thông tin khai báo là trung thực; tôi hiểu và tự chịu rủi ro sức khỏe khi
                    tham gia giải chạy; đồng ý miễn trừ trách nhiệm cho BTC trong phạm vi pháp luật cho phép.
                  </span>
                </label>
                {errors.liabilityAccepted && (
                  <p className="mt-2 text-xs text-red-500">{errors.liabilityAccepted}</p>
                )}
              </div>
            </section>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-foreground text-base">Tóm tắt đăng ký</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Giải</span>
                  <span className="font-medium text-right max-w-[160px] truncate">{event.title}</span>
                </div>
                {selectedDistance && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hạng mục</span>
                      <span className="font-medium">{selectedDistance.label}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Tổng</span>
                      <span className="text-xl font-extrabold text-orange-600">
                        {formatPrice(selectedDistance.price)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <button
                type="submit"
                disabled={!selectedDistance}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Tiếp tục thanh toán
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
