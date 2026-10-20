"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shirt,
  HeartPulse,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileUp,
  LogIn,
  ShieldOff,
} from "lucide-react";
import { RaceEventDto, EventDistanceDto } from "@/dto/event.dto";
import { getMyProfile } from "@/api/auth";
import {
  genderToFormValue,
  profileDobToDateInput,
} from "@/dto/auth.dto";
import {
  getEventById,
  getRegistrationById,
  createRegistration,
  uploadHealthCert,
} from "@/api/events";
import { formatPrice, formatDate } from "@/lib/format";
import {
  getPublicEventStatusLabel,
  isPublicRegistrationLive,
} from "@/lib/event-lifecycle";
import { resolveDistanceTicketPrice } from "@/lib/ticket-pricing";
import TicketPriceDisplay from "@/components/events/TicketPriceDisplay";
import { getApiErrorMessage } from "@/lib/error";
import {
  isValidDateOfBirth,
  isValidEmail,
  isValidOptionalBloodType,
  isValidOptionalGender,
  isValidOptionalHeightCm,
  isValidOptionalVietnamPhone,
  isValidOptionalWeightKg,
  isValidRequiredIdNumber,
  isValidVietnamPhone,
  phonesMatch,
  MSG,
} from "@/lib/input-rules";
import { PAGE_SHELL } from "@/lib/page-shell";

const formDraftKey = (eventId: string) => `registration_form_draft_${eventId}`;

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

const EMERGENCY_RELATIONS = [
  "Ba/Mẹ",
  "Chồng/Vợ",
  "Anh/Chị/Em",
  "Người thân",
  "Bạn bè",
] as const;

const BLOOD_OPTIONS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "O", "A", "B", "AB"] as const;

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  idNumber: string;
  heightCm: string;
  weightKg: string;
  bloodType: string;
  shirtType: string;
  shirtSize: string;
  shirtColor: string;
  bibName: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  selectedDistanceId: string | null;
  medicalCodes: string[];
  liabilityAccepted: boolean;
  paymentTermsAccepted: boolean;
}

type ErrorMap = Partial<
  Record<keyof FormData | "healthCert" | "medicalCodes", string>
>;

type RegStep = 1 | 2 | 3 | 4;

const REG_STEPS: { id: RegStep; label: string }[] = [
  { id: 1, label: "Chọn cự ly" },
  { id: 2, label: "Thông tin cá nhân" },
  { id: 3, label: "Thông tin y tế" },
  { id: 4, label: "Thanh toán" },
];

function RegisterPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const resume = searchParams.get("resume") === "1";

  const [event, setEvent] = useState<RaceEventDto | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingPayRegId, setPendingPayRegId] = useState<string | null>(null);
  const [resumeHint, setResumeHint] = useState<string | null>(null);
  const [step, setStep] = useState<RegStep>(1);

  const loggedIn = Boolean(Cookies.get("access_token"));

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    idNumber: "",
    heightCm: "",
    weightKg: "",
    bloodType: "",
    shirtType: "",
    shirtSize: "",
    shirtColor: "",
    bibName: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    selectedDistanceId: null,
    medicalCodes: [],
    liabilityAccepted: false,
    paymentTermsAccepted: false,
  });

  const [healthCert, setHealthCert] = useState<File | null>(null);
  const [errors, setErrors] = useState<ErrorMap>({});

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setPageLoading(true);

    getEventById(eventId)
      .then((data) => {
        if (!cancelled) setEvent(data);
      })
      .catch((err) => {
        if (!cancelled)
          setPageError(err?.response?.data?.error || "Không thể tải thông tin giải.");
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // Quay lại từ trang thanh toán (không hủy đơn) → khôi phục form + tiếp tục thanh toán
  // Chỉ hiện «Tiếp tục thanh toán» khi đơn vẫn pending_payment (tránh confirmed → lỗi checkout)
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    try {
      const raw = sessionStorage.getItem(formDraftKey(eventId));
      if (raw) {
        const draft = JSON.parse(raw) as FormData;
        setFormData((prev) => ({ ...prev, ...draft }));
        // Chỉ nhảy bước khi resume từ thanh toán — «Đăng ký ngay» luôn bắt đầu ở chọn cự ly
        if (resume && draft.selectedDistanceId) setStep(2);
      }
    } catch {
      /* ignore */
    }

    (async () => {
      try {
        const lastReg = sessionStorage.getItem("last_registration_id");
        const regMeta = sessionStorage.getItem("registration_data");
        if (!lastReg || !regMeta) return;
        const meta = JSON.parse(regMeta) as {
          eventId?: string;
          registrationId?: string;
        };
        const sameEvent =
          String(meta.eventId) === eventId || meta.registrationId === lastReg;
        if (!sameEvent) return;

        const reg = await getRegistrationById(lastReg).catch(() => null);
        if (cancelled) return;

        if (reg?.status === "pending_payment") {
          setPendingPayRegId(lastReg);
          if (resume) {
            setResumeHint(
              "Đơn đang chờ thanh toán. Bấm «Tiếp tục thanh toán» để mở lại QR — phiếu khám cần đính kèm lại nếu gửi đơn mới."
            );
          }
          return;
        }

        // Đã thanh toán / duyệt / hủy — dọn cache để không hiện nút thanh toán sai
        sessionStorage.removeItem("last_registration_id");
        sessionStorage.removeItem("registration_data");
        setPendingPayRegId(null);
        setResumeHint(null);
        if (resume && reg?.status === "confirmed") {
          setResumeHint(
            "Đơn này đã thanh toán / xác nhận. Không cần thanh toán lại — xem Vé của tôi nếu cần."
          );
        } else if (resume && reg?.status === "pending_approval") {
          setResumeHint(
            "Đơn đã thanh toán, đang chờ BTC duyệt. Xem trạng thái tại Vé / đăng ký."
          );
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, resume]);

  // Prefill từ hồ sơ IAM (GET /me) — không đè draft đã có
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await getMyProfile();
        if (cancelled) return;
        setFormData((prev) => {
          const hasDraft =
            Boolean(prev.fullName.trim()) || Boolean(prev.email.trim());
          if (hasDraft) return prev;
          return {
            ...prev,
            fullName: me.fullName || prev.fullName,
            email: me.email || prev.email,
            phone: me.phone || prev.phone,
            gender: genderToFormValue(me.gender) || prev.gender,
            dateOfBirth:
              profileDobToDateInput(me.dateOfBirth) || prev.dateOfBirth,
          };
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="mt-3 text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  if (pageError || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">🏃</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy giải</h1>
        <p className="text-muted-foreground mb-6">{pageError}</p>
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

  if (!loggedIn) {
    const from = encodeURIComponent(`/events/${eventId}/register`);
    return (
      <div className={`${PAGE_SHELL} max-w-3xl py-16 text-center space-y-4`}>
        <LogIn className="mx-auto h-10 w-10 text-orange-500" />
        <h1 className="text-2xl font-extrabold">Đăng nhập để đăng ký</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Bạn cần đăng nhập trước khi đăng ký tham gia giải <strong>{event.name}</strong>.
        </p>
        <Link
          href={`/login?from=${from}`}
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors"
        >
          <LogIn className="h-4 w-4" />
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  if (!isPublicRegistrationLive(event)) {
    const isSoldOut = event.status === "sold-out";
    const label = getPublicEventStatusLabel(event);
    return (
      <div className={`${PAGE_SHELL} max-w-3xl py-16 text-center space-y-4`}>
        <ShieldOff className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-extrabold">
          {isSoldOut ? "Hết slot đăng ký" : "Giải chưa mở đăng ký"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {isSoldOut
            ? "Tất cả hạng mục đã hết chỗ. Hãy theo dõi để đăng ký giải tiếp theo."
            : `Trạng thái hiện tại: ${label}. Vui lòng quay lại khi đăng ký được mở.`}
        </p>
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về chi tiết giải
        </Link>
      </div>
    );
  }

  const distances = event.distances || [];
  const selectedDistance: EventDistanceDto | undefined = distances.find(
    (d) => d.id === formData.selectedDistanceId
  );
  const selectedTicket = selectedDistance
    ? resolveDistanceTicketPrice(event?.ticketPricing, selectedDistance)
    : null;

  const medicalNoneOnly =
    formData.medicalCodes.length === 1 &&
    formData.medicalCodes[0] === "none";

  const validateStep = (s: RegStep): boolean => {
    const newErrors: ErrorMap = {};

    if (s === 1) {
      if (!formData.selectedDistanceId)
        newErrors.selectedDistanceId = "Vui lòng chọn cự ly";
    }

    if (s === 2) {
      if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
      else if (formData.fullName.trim().length > 100)
        newErrors.fullName = "Họ tên tối đa 100 ký tự.";

      if (!formData.email.trim()) newErrors.email = "Vui lòng nhập email";
      else if (!isValidEmail(formData.email))
        newErrors.email = "Email không hợp lệ.";

      if (!formData.phone.trim())
        newErrors.phone = "Vui lòng nhập số điện thoại";
      else if (!isValidVietnamPhone(formData.phone))
        newErrors.phone = MSG.phone;

      if (!formData.gender) newErrors.gender = "Vui lòng chọn giới tính";
      else if (!isValidOptionalGender(formData.gender))
        newErrors.gender = MSG.gender;

      if (!formData.dateOfBirth)
        newErrors.dateOfBirth = "Vui lòng nhập ngày sinh";
      else if (!isValidDateOfBirth(formData.dateOfBirth))
        newErrors.dateOfBirth = MSG.dateOfBirth;

      if (!formData.idNumber.trim())
        newErrors.idNumber = MSG.idNumberRequired;
      else if (!isValidRequiredIdNumber(formData.idNumber))
        newErrors.idNumber = MSG.idNumber;

      if (formData.bibName.trim().length > 40)
        newErrors.bibName = "Tên trên BIB tối đa 40 ký tự.";
    }

    if (s === 3) {
      if (!isValidOptionalHeightCm(formData.heightCm))
        newErrors.heightCm = MSG.height;
      if (!isValidOptionalWeightKg(formData.weightKg))
        newErrors.weightKg = MSG.weight;

      if (!formData.bloodType.trim())
        newErrors.bloodType = MSG.bloodTypeRequired;
      else if (!isValidOptionalBloodType(formData.bloodType))
        newErrors.bloodType = MSG.bloodType;

      if (!formData.emergencyName.trim())
        newErrors.emergencyName = "Vui lòng nhập người liên hệ khẩn cấp";
      else if (formData.emergencyName.trim().length > 100)
        newErrors.emergencyName = "Tên liên hệ khẩn cấp tối đa 100 ký tự.";

      if (!formData.emergencyPhone.trim())
        newErrors.emergencyPhone = "Vui lòng nhập SĐT khẩn cấp";
      else if (!isValidOptionalVietnamPhone(formData.emergencyPhone))
        newErrors.emergencyPhone = MSG.phone;
      else if (phonesMatch(formData.emergencyPhone, formData.phone))
        newErrors.emergencyPhone = MSG.emergencyPhoneSame;

      if (!formData.emergencyRelation.trim())
        newErrors.emergencyRelation = MSG.emergencyRelation;

      if (formData.medicalCodes.length === 0)
        newErrors.medicalCodes =
          "Chọn ít nhất một mục bệnh lý (hoặc \u201CKhông mắc…\u201D).";
      else if (
        formData.medicalCodes.includes("none") &&
        formData.medicalCodes.length > 1
      )
        newErrors.medicalCodes =
          "Không thể chọn \u201CKhông mắc bệnh lý đặc biệt\u201D cùng các bệnh khác.";

      // Phiếu khám bắt buộc trừ khi chỉ tick «Không mắc bệnh lý đặc biệt»
      if (!medicalNoneOnly) {
        if (!healthCert)
          newErrors.healthCert = "Vui lòng đính kèm phiếu khám sức khỏe.";
        else {
          const okType =
            [
              "application/pdf",
              "image/jpeg",
              "image/png",
              "image/jpg",
            ].includes(healthCert.type) ||
            /\.(pdf|jpe?g|png)$/i.test(healthCert.name);
          if (!okType) newErrors.healthCert = "Chỉ chấp nhận PDF, JPG, PNG.";
          if (healthCert.size > 5 * 1024 * 1024)
            newErrors.healthCert = "File tối đa 5MB.";
        }
      } else if (healthCert) {
        const okType =
          ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(
            healthCert.type
          ) || /\.(pdf|jpe?g|png)$/i.test(healthCert.name);
        if (!okType) newErrors.healthCert = "Chỉ chấp nhận PDF, JPG, PNG.";
        if (healthCert.size > 5 * 1024 * 1024)
          newErrors.healthCert = "File tối đa 5MB.";
      }

      if (!formData.liabilityAccepted)
        newErrors.liabilityAccepted = MSG.liability;
    }

    if (s === 4) {
      if (!formData.paymentTermsAccepted)
        newErrors.paymentTermsAccepted = MSG.paymentTerms;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    try {
      sessionStorage.setItem(formDraftKey(eventId), JSON.stringify(formData));
    } catch {
      /* ignore */
    }
    if (step < 4) setStep((step + 1) as RegStep);
  };

  const goBack = () => {
    setErrors({});
    setSubmitError(null);
    if (step > 1) setStep((step - 1) as RegStep);
  };

  const toggleMedical = (code: string) => {
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
        const n = { ...prev };
        delete n.medicalCodes;
        return n;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 4) {
      goNext();
      return;
    }
    if (!validateStep(1)) {
      setStep(1);
      return;
    }
    if (!validateStep(2)) {
      setStep(2);
      return;
    }
    if (!validateStep(3)) {
      setStep(3);
      return;
    }
    if (!validateStep(4) || !formData.selectedDistanceId) return;
    if (!medicalNoneOnly && !healthCert) {
      setStep(3);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let healthCertFileName: string | undefined;
      let healthCertUrl: string | undefined;
      if (healthCert) {
        const uploaded = await uploadHealthCert(healthCert);
        healthCertFileName = uploaded.fileName || healthCert.name;
        healthCertUrl = uploaded.fileUrl;
      }

      const registration = await createRegistration(eventId, {
        distanceId: formData.selectedDistanceId,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        idNumber: formData.idNumber.trim(),
        heightCm: formData.heightCm ? Number(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? Number(formData.weightKg) : undefined,
        bloodType: formData.bloodType || undefined,
        emergencyName: formData.emergencyName.trim(),
        emergencyPhone: formData.emergencyPhone.trim(),
        emergencyRelation: formData.emergencyRelation || undefined,
        shirtType: formData.shirtType || undefined,
        shirtSize: formData.shirtSize || undefined,
        shirtColor: formData.shirtColor || undefined,
        bibName: formData.bibName.trim() || undefined,
        medicalCodes: formData.medicalCodes,
        healthCertFileName,
        healthCertUrl,
        liabilityAccepted: true,
      });

      sessionStorage.setItem(formDraftKey(eventId), JSON.stringify(formData));
      sessionStorage.setItem(
        "registration_data",
        JSON.stringify({
          registrationId: registration.id,
          eventId: event!.id,
          eventTitle: event!.name,
          distance: selectedDistance,
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
        })
      );
      sessionStorage.setItem("last_registration_id", registration.id);
      router.push(`/events/${event!.id}/payment?regId=${registration.id}`);
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(err, "Đăng ký thất bại. Vui lòng thử lại.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (
    field: keyof FormData,
    value: string | boolean | null | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ErrorMap]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof ErrorMap];
        return next;
      });
    }
    setSubmitError(null);
  };

  const inputClass = (field: keyof FormData) =>
    `w-full rounded-xl border ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
        : "border-border focus:border-orange-500/50 focus:ring-orange-500/20"
    } bg-background py-2.5 px-4 text-sm outline-none transition-all focus:ring-2 placeholder:text-muted-foreground`;

  return (
    <div className={`${PAGE_SHELL} py-8`}>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại {event.name}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Đăng ký tham gia giải
        </h1>
        <p className="mt-1 text-muted-foreground">{event.name}</p>
      </div>

      {/* Stepper nhẹ */}
      <nav className="mb-8 flex flex-wrap items-center gap-2 sm:gap-0">
        {REG_STEPS.map((s, i) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-2 sm:gap-3">
              {i > 0 ? (
                <div
                  className={`mx-1 hidden h-px w-8 sm:block ${
                    done ? "bg-orange-400" : "bg-border"
                  }`}
                />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (s.id < step) setStep(s.id);
                }}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? "bg-orange-500 text-white"
                    : done
                      ? "bg-orange-500/15 text-orange-700"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    active
                      ? "bg-white/25"
                      : done
                        ? "bg-orange-500 text-white"
                        : "bg-background"
                  }`}
                >
                  {s.id}
                </span>
                {s.label}
              </button>
            </div>
          );
        })}
      </nav>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Form fields */}
          <div className="min-w-0 space-y-6">
            {/* Distance selection */}
            {step === 1 ? (
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  1
                </span>
                Chọn hạng mục
              </h2>
              {errors.selectedDistanceId && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.selectedDistanceId}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {distances.map((d) => {
                  const registered = d.registeredCount ?? 0;
                  const soldOut = registered >= d.capacity;
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
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <p className="text-sm font-bold text-foreground">
                        {d.name || d.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.distanceKm} km • Còn {d.capacity - registered} chỗ
                      </p>
                      <div className="mt-2">
                        <TicketPriceDisplay
                          ticket={resolveDistanceTicketPrice(
                            event.ticketPricing,
                            d
                          )}
                          size="md"
                          align="left"
                        />
                      </div>
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
            ) : null}

            {/* Personal info */}
            {step === 2 ? (
            <>
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  2
                </span>
                Thông tin cá nhân
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <User className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={inputClass("fullName")}
                    disabled={submitting}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Mail className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={inputClass("email")}
                    disabled={submitting}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Phone className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClass("phone")}
                    disabled={submitting}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Giới tính *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    className={inputClass("gender")}
                    disabled={submitting}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Calendar className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Ngày sinh *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className={inputClass("dateOfBirth")}
                    disabled={submitting}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* ID Number */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Số CCCD / Hộ chiếu *
                  </label>
                  <input
                    type="text"
                    placeholder="079098001234"
                    value={formData.idNumber}
                    onChange={(e) => updateField("idNumber", e.target.value)}
                    className={inputClass("idNumber")}
                    disabled={submitting}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                    Nếu chưa đủ tuổi, có thể điền CCCD/hộ chiếu của người giám hộ
                    hoặc người liên hệ khẩn cấp.
                  </p>
                  {errors.idNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.idNumber}</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground">
                Thông tin bổ sung
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Shirt className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Size áo
                  </label>
                  <select
                    value={formData.shirtSize}
                    onChange={(e) => updateField("shirtSize", e.target.value)}
                    className={inputClass("shirtSize")}
                    disabled={submitting}
                  >
                    <option value="">Để trống / Chọn size</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Tên trên BIB
                  </label>
                  <input
                    type="text"
                    placeholder="Tên in trên số BIB"
                    value={formData.bibName}
                    onChange={(e) => updateField("bibName", e.target.value)}
                    className={inputClass("bibName")}
                    disabled={submitting}
                    maxLength={40}
                  />
                  {errors.bibName ? (
                    <p className="mt-1 text-xs text-red-500">{errors.bibName}</p>
                  ) : null}
                </div>
              </div>
            </section>
            </>
            ) : null}

            {/* Medical + health cert */}
            {step === 3 ? (
            <>
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  3
                </span>
                Thông tin y tế
              </h2>
              <p className="text-xs text-muted-foreground">
                Chọn tình trạng bệnh lý (có thể nhiều mục). Phiếu khám bắt buộc
                nếu có bệnh lý; không bắt buộc khi chọn «Không mắc bệnh lý đặc biệt».
              </p>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nhóm máu *
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => updateField("bloodType", e.target.value)}
                  className={inputClass("bloodType")}
                  disabled={submitting}
                >
                  <option value="">Chọn nhóm máu</option>
                  {BLOOD_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {errors.bloodType ? (
                  <p className="mt-1 text-xs text-red-500">{errors.bloodType}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MEDICAL_OPTIONS.map((opt) => (
                  <label
                    key={opt.code}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors ${
                      formData.medicalCodes.includes(opt.code)
                        ? "border-orange-500/40 bg-orange-500/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.medicalCodes.includes(opt.code)}
                      onChange={() => toggleMedical(opt.code)}
                      disabled={submitting}
                      className="h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {errors.medicalCodes && (
                <p className="text-xs text-red-500 font-medium">{errors.medicalCodes}</p>
              )}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  <FileUp className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                  Phiếu khám sức khỏe (PDF/JPG/PNG, ≤5MB)
                  {medicalNoneOnly ? " — không bắt buộc" : " *"}
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                  disabled={submitting}
                  onChange={(e) => {
                    setHealthCert(e.target.files?.[0] || null);
                    if (errors.healthCert) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.healthCert;
                        return n;
                      });
                    }
                  }}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-orange-600"
                />
                {healthCert && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Đã chọn: {healthCert.name} ({Math.round(healthCert.size / 1024)} KB)
                  </p>
                )}
                {errors.healthCert && (
                  <p className="mt-1 text-xs text-red-500">{errors.healthCert}</p>
                )}
              </div>
            </section>

            {/* Emergency Contact */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Liên hệ khẩn cấp
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <HeartPulse className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Tên người liên hệ *
                  </label>
                  <input
                    type="text"
                    placeholder="Tên người liên hệ khẩn cấp"
                    value={formData.emergencyName}
                    onChange={(e) => updateField("emergencyName", e.target.value)}
                    className={inputClass("emergencyName")}
                    disabled={submitting}
                  />
                  {errors.emergencyName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.emergencyName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Phone className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    SĐT liên hệ *
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={formData.emergencyPhone}
                    onChange={(e) => updateField("emergencyPhone", e.target.value)}
                    className={inputClass("emergencyPhone")}
                    disabled={submitting}
                  />
                  {errors.emergencyPhone && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.emergencyPhone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Mối quan hệ với người tham gia *
                  </label>
                  <select
                    value={formData.emergencyRelation}
                    onChange={(e) =>
                      updateField("emergencyRelation", e.target.value)
                    }
                    className={inputClass("emergencyRelation")}
                    disabled={submitting}
                  >
                    <option value="">- Chọn quan hệ -</option>
                    {EMERGENCY_RELATIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {errors.emergencyRelation ? (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.emergencyRelation}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Liability */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Điều khoản trách nhiệm
              </h2>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.liabilityAccepted}
                  onChange={(e) => updateField("liabilityAccepted", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
                  disabled={submitting}
                />
                <span className="text-sm text-muted-foreground">
                  Tôi chấp nhận điều khoản trách nhiệm, hiểu rủi ro khi tham gia giải chạy
                  và xác nhận đủ sức khỏe để thi đấu. *
                </span>
              </label>
              {errors.liabilityAccepted && (
                <p className="text-xs text-red-500">{errors.liabilityAccepted}</p>
              )}
            </section>
            </>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                      4
                    </span>
                    Xác nhận & thanh toán
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Kiểm tra thông tin trước khi mở cổng thanh toán PayOS (QR).
                  </p>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <h3 className="text-sm font-bold">Thông tin mua hàng</h3>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Sự kiện
                      </dt>
                      <dd className="font-medium">{event.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Hạng mục
                      </dt>
                      <dd className="font-medium">
                        {selectedDistance?.name ||
                          selectedDistance?.type ||
                          "—"}
                        {selectedDistance
                          ? ` · ${selectedDistance.distanceKm} km`
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Size áo
                      </dt>
                      <dd className="font-medium">
                        {formData.shirtSize || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Tên trên BIB
                      </dt>
                      <dd className="font-medium">
                        {formData.bibName.trim() || "—"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Tổng thanh toán
                      </dt>
                      <dd className="mt-0.5">
                        {selectedTicket ? (
                          <TicketPriceDisplay
                            ticket={selectedTicket}
                            size="md"
                            align="left"
                          />
                        ) : selectedDistance ? (
                          <span className="text-lg font-extrabold text-orange-600">
                            {formatPrice(
                              selectedDistance.basePrice ?? selectedDistance.price
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <h3 className="text-sm font-bold">Thông tin cá nhân</h3>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Họ tên
                      </dt>
                      <dd className="font-medium">{formData.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Email
                      </dt>
                      <dd className="font-medium break-all">{formData.email}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Số điện thoại
                      </dt>
                      <dd className="font-medium">{formData.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Giới tính · Ngày sinh
                      </dt>
                      <dd className="font-medium">
                        {formData.gender === "Male"
                          ? "Nam"
                          : formData.gender === "Female"
                            ? "Nữ"
                            : formData.gender || "—"}
                        {" · "}
                        {formData.dateOfBirth || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        CCCD / Hộ chiếu
                      </dt>
                      <dd className="font-medium">{formData.idNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Size áo · Tên BIB
                      </dt>
                      <dd className="font-medium">
                        {formData.shirtSize || "—"}
                        {" · "}
                        {formData.bibName.trim() || "—"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <h3 className="text-sm font-bold">Thông tin y tế & liên hệ</h3>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Nhóm máu
                      </dt>
                      <dd className="font-medium">
                        {formData.bloodType || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Bệnh lý
                      </dt>
                      <dd className="font-medium">
                        {formData.medicalCodes.includes("none")
                          ? "Không mắc bệnh lý đặc biệt"
                          : formData.medicalCodes
                              .map(
                                (c) =>
                                  MEDICAL_OPTIONS.find((o) => o.code === c)
                                    ?.label || c
                              )
                              .join(", ") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Phiếu khám
                      </dt>
                      <dd className="font-medium">
                        {healthCert
                          ? healthCert.name
                          : medicalNoneOnly
                            ? "Không đính kèm (không mắc bệnh lý)"
                            : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Liên hệ khẩn cấp
                      </dt>
                      <dd className="font-medium">
                        {formData.emergencyName}
                        {formData.emergencyRelation
                          ? ` (${formData.emergencyRelation})`
                          : ""}
                        <br />
                        {formData.emergencyPhone}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[10px] uppercase text-muted-foreground">
                        Điều khoản trách nhiệm
                      </dt>
                      <dd className="font-medium">
                        {formData.liabilityAccepted
                          ? "Đã chấp nhận"
                          : "Chưa chấp nhận"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <h3 className="text-sm font-bold">Phương thức thanh toán</h3>
                  <label className="flex items-center gap-3 rounded-xl border border-orange-500/40 bg-orange-500/5 px-3 py-3 text-sm font-medium">
                    <input
                      type="radio"
                      name="payMethod"
                      checked
                      readOnly
                      className="h-4 w-4 text-orange-500"
                    />
                    Quét mã QR ngân hàng (PayOS)
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    RaceDay thanh toán qua PayOS VietQR. Sau khi bấm Thanh toán,
                    hệ thống tạo đơn và mở mã QR.
                  </p>
                </section>

                <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.paymentTermsAccepted}
                      onChange={(e) =>
                        updateField("paymentTermsAccepted", e.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-muted-foreground">
                      Tôi đã đọc, hiểu và chấp nhận quy định sự kiện cùng điều
                      khoản thanh toán của RaceDay. *
                    </span>
                  </label>
                  {errors.paymentTermsAccepted ? (
                    <p className="text-xs text-red-500">
                      {errors.paymentTermsAccepted}
                    </p>
                  ) : null}
                </section>
              </div>
            ) : null}
          </div>

          {/* Sidebar summary */}
          <div className="min-w-0">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4">
                <h3 className="font-bold text-foreground text-base">
                  Tóm tắt đăng ký
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Giải chạy</span>
                    <span className="font-medium text-foreground text-right max-w-[160px] truncate">
                      {event.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày</span>
                    <span className="font-medium text-foreground">
                      {formatDate(event.date)}
                    </span>
                  </div>
                  {selectedDistance && (
                    <>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hạng mục</span>
                        <span className="font-medium text-foreground">
                          {selectedDistance.name || selectedDistance.type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cự ly</span>
                        <span className="font-medium text-foreground">
                          {selectedDistance.distanceKm} km
                        </span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-bold text-foreground pt-1">
                          Tổng cộng
                        </span>
                        {selectedTicket ? (
                          <TicketPriceDisplay
                            ticket={selectedTicket}
                            size="md"
                            align="right"
                          />
                        ) : (
                          <span className="text-xl font-extrabold text-orange-600">
                            {formatPrice(
                              selectedDistance.basePrice ?? selectedDistance.price
                            )}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {submitError ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/25 bg-red-500/5 p-3 flex items-start gap-2"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="min-w-0 text-xs font-medium text-red-600 leading-relaxed">
                      {submitError}
                    </p>
                  </div>
                ) : null}

                {pendingPayRegId ? (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/events/${eventId}/payment?regId=${pendingPayRegId}`
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Tiếp tục thanh toán
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="space-y-2">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={goBack}
                        disabled={submitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                      </button>
                    ) : null}
                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={step === 1 && !selectedDistance}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 disabled:opacity-50"
                      >
                        Tiếp tục
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        disabled={!selectedDistance || submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang tạo đơn & mở QR…
                          </>
                        ) : (
                          <>
                            Thanh toán
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {resumeHint && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed text-center">
                    {resumeHint}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="mt-3 text-sm text-muted-foreground">Đang tải…</p>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
