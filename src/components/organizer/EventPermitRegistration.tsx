"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Info,
  Loader2,
  Plus,
  Route,
  ShieldCheck,
  Trash2,
  Upload,
  Building2,
} from "lucide-react";
import { getEventById } from "@/api/events";
import {
  createRaceEvent,
  submitRaceEvent,
  uploadOrganizerFile,
} from "@/api/organizer";
import type { EventDistanceDto, RaceEventDto } from "@/dto/event.dto";
import type {
  CreateRaceEventDistanceInput,
  CreateRaceEventDocumentInput,
  CreateRaceEventRequest,
} from "@/dto/organizer.dto";
import { getApiErrorMessage } from "@/lib/error";
import {
  mediaDisplayUrl,
  resolveStoredFileUrl,
} from "@/lib/media-url";

const requiredDocuments = [
  {
    id: "plan",
    title: "Kế hoạch tổ chức sự kiện",
    description: "Mục tiêu, quy mô, thời gian, địa điểm và các đơn vị phối hợp.",
    required: true,
  },
  {
    id: "program",
    title: "Chương trình và nội dung thi đấu",
    description: "Lịch trình, nội dung cự ly, khung giờ xuất phát và đích.",
    required: true,
  },
  {
    id: "rules",
    title: "Điều lệ giải và trọng tài",
    description: "Điều lệ thi đấu, bộ phận chuyên môn và danh sách trọng tài.",
    required: true,
  },
  {
    id: "official-letter",
    title: "Công văn đề nghị cấp phép",
    description: "Văn bản của doanh nghiệp gửi UBND Thành phố/Sở Văn hóa và Thể thao.",
    required: true,
  },
  {
    id: "foreign-list",
    title: "Danh sách người nước ngoài tham dự",
    description: "Họ tên, quốc tịch, hộ chiếu và đơn vị liên hệ (nếu có).",
    required: false,
  },
  {
    id: "security",
    title: "Phương án an ninh, trật tự và PCCC",
    description: "Bảo vệ, phân luồng, y tế, phòng cháy chữa cháy và môi trường.",
    required: true,
  },
];

const safetyConditions = [
  "Đã có phương án bảo đảm an ninh, trật tự và phân luồng giao thông.",
  "Đã chuẩn bị phương án phòng cháy, chữa cháy và lối thoát hiểm.",
  "Đã bố trí y tế, xe cấp cứu và điểm hỗ trợ trên đường chạy.",
  "Đã có phương án thu gom rác và hoàn trả mặt bằng sau sự kiện.",
  "Đã lập danh sách người nước ngoài và đầu mối làm việc với cơ quan chức năng (nếu có).",
];

const STEP_LABELS = [
  "Thông tin giải",
  "Hồ sơ bắt buộc",
  "Điều kiện an toàn",
  "Rà soát & gửi",
] as const;

type InfoTab = "chung" | "cu-ly" | "don-vi";

type EventForm = {
  title: string;
  tagline: string;
  organizer: string;
  legalEntity: string;
  website: string;
  date: string;
  startTime: string;
  location: string;
  scale: string;
  contactName: string;
  phone: string;
  email: string;
  description: string;
  bannerImage: string;
  /** TK giải ngân BTC ← hệ thống (không phải TK nhận PayOS) */
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankName: string;
  bankBranch: string;
  bankTransferNote: string;
  authorityContact: string;
  medicalPartner: string;
  securityPosts: string;
  aidStations: string;
};

type DistanceDraft = {
  key: string;
  type: string;
  name: string;
  distanceKm: string;
  capacity: string;
  price: string;
  currency: string;
};

/** Tọa độ mặc định (BE bắt buộc) — FE không thu từ user */
const DEFAULT_LAT = 16.047079;
const DEFAULT_LNG = 108.20623;

type UploadedDoc = { fileName: string; fileUrl: string };

type Props = {
  backHref?: string;
  backLabel?: string;
  /** Tiếp tục hoàn thiện nháp đã tạo */
  draftId?: string | null;
};

const EMPTY_FORM: EventForm = {
  title: "",
  tagline: "",
  organizer: "",
  legalEntity: "",
  website: "",
  date: "",
  startTime: "",
  location: "",
  scale: "",
  contactName: "",
  phone: "",
  email: "",
  description: "",
  bannerImage: "",
  bankAccountHolder: "",
  bankAccountNumber: "",
  bankName: "",
  bankBranch: "",
  bankTransferNote: "",
  authorityContact: "",
  medicalPartner: "",
  securityPosts: "",
  aidStations: "",
};

function newDistanceKey() {
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyDistance(): DistanceDraft {
  return {
    key: newDistanceKey(),
    type: "road",
    name: "",
    distanceKm: "",
    capacity: "",
    price: "",
    currency: "VND",
  };
}

/** Lưu DB / payload: URL object thật (R2 public nếu cấu hình). */
function absoluteUrl(fileUrl: string): string {
  return resolveStoredFileUrl(fileUrl);
}

function mapEventToForm(event: RaceEventDto): EventForm {
  const org = event.organizer;
  const bank = org?.beneficiaryAccount;
  const rules = (event.rules || {}) as Record<string, unknown>;
  const start = event.startTime || "";
  return {
    title: event.name || "",
    tagline: event.tagline || "",
    organizer: org?.name || "",
    legalEntity: org?.legalEntity || "",
    website: org?.website || "",
    date: (event.date || "").slice(0, 10),
    startTime: start.length >= 5 ? start.slice(0, 5) : start,
    location: event.location || "",
    scale: event.totalRunners != null ? String(event.totalRunners) : "",
    contactName: String(rules.contactName || ""),
    phone: org?.phone || "",
    email: org?.email || "",
    description: event.description || "",
    bannerImage: event.bannerImage ? absoluteUrl(event.bannerImage) : "",
    bankAccountHolder: bank?.accountHolder || "",
    bankAccountNumber: bank?.accountNumber || "",
    bankName: bank?.bankName || "",
    bankBranch: bank?.branch || "",
    bankTransferNote: bank?.transferNote || "",
    authorityContact: String(rules.authorityContact || ""),
    medicalPartner: String(rules.medicalPartner || ""),
    securityPosts: String(rules.securityPosts || ""),
    aidStations: String(rules.aidStations || ""),
  };
}

function mapEventDistances(distances: EventDistanceDto[]): DistanceDraft[] {
  if (!distances.length) return [emptyDistance()];
  return distances.map((d) => ({
    key: d.id || newDistanceKey(),
    type: d.type || "road",
    name: d.name || "",
    distanceKm: d.distanceKm != null ? String(d.distanceKm) : "",
    capacity: d.capacity != null ? String(d.capacity) : "",
    price: d.price != null ? String(d.price) : "",
    currency: d.currency || "VND",
  }));
}

function mapEventFiles(
  event: RaceEventDto
): Record<string, UploadedDoc> {
  const out: Record<string, UploadedDoc> = {};
  for (const doc of event.documents || []) {
    if (!doc.documentKey || !doc.fileUrl) continue;
    out[doc.documentKey] = {
      fileName: doc.fileName || doc.title || doc.documentKey,
      fileUrl: absoluteUrl(doc.fileUrl),
    };
  }
  return out;
}

function mapEventConditions(event: RaceEventDto): boolean[] {
  const rules = (event.rules || {}) as {
    safetyChecklist?: { label?: string; checked?: boolean }[];
  };
  const checklist = rules.safetyChecklist;
  if (!Array.isArray(checklist) || !checklist.length) {
    return safetyConditions.map(() => false);
  }
  return safetyConditions.map((label, i) => {
    const row = checklist[i];
    if (row && typeof row.checked === "boolean") return row.checked;
    const byLabel = checklist.find((c) => c.label === label);
    return Boolean(byLabel?.checked);
  });
}

function parseTotalRunners(scale: string, distances: DistanceDraft[]): number {
  const digits = scale.replace(/[^\d]/g, "");
  const n = Number(digits);
  if (Number.isFinite(n) && n > 0) return n;
  const sum = distances.reduce((s, d) => s + (Number(d.capacity) || 0), 0);
  return sum > 0 ? sum : 1000;
}

function num(v: string, fallback = 0): number {
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : fallback;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 12;
}

/** Tối thiểu để tạo/nháp — start/finish kế thừa tọa độ mặc định */
function isDistanceCoreValid(d: DistanceDraft): boolean {
  return (
    d.name.trim().length > 0 &&
    num(d.distanceKm) >= 0.1 &&
    num(d.capacity) >= 1 &&
    num(d.price) >= 0
  );
}

type FieldErrorKey =
  | "title"
  | "date"
  | "startTime"
  | "location"
  | "organizer"
  | "phone"
  | "email"
  | "distances"
  | "bankAccountHolder"
  | "bankAccountNumber"
  | "bankName";

const FIELD_ERROR_LABEL: Record<FieldErrorKey, string> = {
  title: "Tên giải",
  date: "Ngày tổ chức",
  startTime: "Giờ bắt đầu",
  location: "Địa điểm",
  organizer: "Đơn vị tổ chức",
  phone: "SĐT liên hệ",
  email: "Email",
  distances: "Cự ly (≥1: tên, km, slot, giá)",
  bankAccountHolder: "Chủ TK giải ngân",
  bankAccountNumber: "Số TK giải ngân",
  bankName: "Ngân hàng",
};

/** FE → BE CreateRaceEventRequest — field bắt buộc để tạo/nháp */
function collectDraftErrors(
  form: EventForm,
  distances: DistanceDraft[]
): { keys: FieldErrorKey[]; tab: InfoTab; message: string } {
  const keys: FieldErrorKey[] = [];
  if (!form.title.trim()) keys.push("title");
  if (!form.date) keys.push("date");
  if (!form.startTime) keys.push("startTime");
  if (!form.location.trim()) keys.push("location");
  if (!form.organizer.trim()) keys.push("organizer");
  if (!form.phone.trim() || !isValidPhone(form.phone)) keys.push("phone");
  if (!form.email.trim() || !isValidEmail(form.email)) keys.push("email");
  if (!(distances.length > 0 && distances.every(isDistanceCoreValid))) {
    keys.push("distances");
  }

  let tab: InfoTab = "chung";
  if (keys.includes("distances")) tab = "cu-ly";
  else if (
    keys.some((k) => k === "organizer" || k === "phone" || k === "email") &&
    !keys.some((k) =>
      (["title", "date", "startTime", "location"] as FieldErrorKey[]).includes(k)
    )
  ) {
    tab = "don-vi";
  }

  const message = keys.length
    ? `Thiếu hoặc không hợp lệ: ${keys.map((k) => FIELD_ERROR_LABEL[k]).join(", ")}.`
    : "";
  return { keys, tab, message };
}

function collectBankErrors(form: EventForm): FieldErrorKey[] {
  const keys: FieldErrorKey[] = [];
  if (!form.bankAccountHolder.trim()) keys.push("bankAccountHolder");
  if (!form.bankAccountNumber.trim()) keys.push("bankAccountNumber");
  if (!form.bankName.trim()) keys.push("bankName");
  return keys;
}

function buildPayload(
  form: EventForm,
  distances: DistanceDraft[],
  docs: Record<string, UploadedDoc>,
  conditions: boolean[],
  submitForApproval: boolean
): CreateRaceEventRequest {
  const totalRunners = parseTotalRunners(form.scale, distances);
  const placeFallback = form.location.trim() || "Địa điểm giải";
  const distanceInputs: CreateRaceEventDistanceInput[] = distances.map((d) => ({
    type: d.type.trim() || "road",
    name: d.name.trim(),
    distanceKm: num(d.distanceKm),
    elevationGainM: 0,
    maxElevationM: 50,
    minElevationM: 0,
    capacity: Math.max(1, Math.floor(num(d.capacity, 1))),
    price: Math.max(0, num(d.price)),
    currency: d.currency.trim() || "VND",
    color: "#f97316",
    startLocation: {
      name: placeFallback,
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
    },
    finishLocation: {
      name: placeFallback,
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
    },
    checkpoints: null,
    osrmWaypoints: null,
    leafletPolyline: null,
    geoJson: null,
  }));

  const documents: CreateRaceEventDocumentInput[] = requiredDocuments
    .filter((d) => docs[d.id])
    .map((d) => ({
      documentKey: d.id,
      title: d.title,
      fileName: docs[d.id].fileName,
      fileUrl: docs[d.id].fileUrl,
      required: d.required,
    }));

  const startTime = form.startTime
    ? form.startTime.length === 5
      ? `${form.startTime}:00`
      : form.startTime
    : null;

  const hasBank =
    form.bankAccountHolder.trim() &&
    form.bankAccountNumber.trim() &&
    form.bankName.trim();

  return {
    name: form.title.trim(),
    tagline: form.tagline.trim() || null,
    bannerImage: form.bannerImage.trim() || null,
    location: form.location.trim(),
    coordinates: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
    date: form.date,
    startTime,
    description: form.description.trim() || null,
    totalRunners,
    organizer: {
      name: form.organizer.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      legalEntity: form.legalEntity.trim() || form.organizer.trim(),
      website: form.website.trim() || null,
      verified: false,
      beneficiaryAccount: hasBank
        ? {
            accountHolder: form.bankAccountHolder.trim(),
            accountNumber: form.bankAccountNumber.trim(),
            bankName: form.bankName.trim(),
            branch: form.bankBranch.trim() || null,
            swiftCode: null,
            transferNote:
              form.bankTransferNote.trim() ||
              "Giai ngan BTC sau su kien (RaceDay)",
          }
        : null,
    },
    weather: null,
    permitDocument: null,
    ticketPricing: null,
    merchandise: null,
    rules: {
      safetyChecklist: safetyConditions.map((label, i) => ({
        label,
        checked: Boolean(conditions[i]),
      })),
      authorityContact: form.authorityContact,
      medicalPartner: form.medicalPartner,
      securityPosts: form.securityPosts,
      aidStations: form.aidStations,
      contactName: form.contactName,
      settlementNote:
        "Phí VĐV thu qua PayOS về tài khoản hệ thống RaceDay; BTC nhận giải ngân sau theo TK khai báo.",
    },
    rewards: null,
    distances: distanceInputs,
    documents: documents.length ? documents : null,
    submitForApproval,
  };
}

export default function EventPermitRegistration({
  backHref = "/events",
  backLabel = "Quay lại danh sách giải",
  draftId = null,
}: Props) {
  const [step, setStep] = useState(1);
  const [infoTab, setInfoTab] = useState<InfoTab>("chung");
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [distances, setDistances] = useState<DistanceDraft[]>(() => [
    emptyDistance(),
  ]);
  const [files, setFiles] = useState<Record<string, UploadedDoc>>({});
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [conditions, setConditions] = useState<boolean[]>(
    safetyConditions.map(() => false)
  );
  const [toast, setToast] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Set<FieldErrorKey>>(
    () => new Set()
  );
  const [submitting, setSubmitting] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [createdAsDraft, setCreatedAsDraft] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(
    draftId || null
  );
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftId));

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  useEffect(() => {
    if (!draftId) {
      setLoadingDraft(false);
      return;
    }
    let cancelled = false;
    setLoadingDraft(true);
    setEditingDraftId(draftId);
    (async () => {
      try {
        const event = await getEventById(draftId);
        if (cancelled) return;
        setForm(mapEventToForm(event));
        setDistances(mapEventDistances(event.distances || []));
        setFiles(mapEventFiles(event));
        setConditions(mapEventConditions(event));
        setStep(1);
        setInfoTab("chung");
        setCreatedEventId(null);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(e, "Không tải được bản nháp để tiếp tục.")
          );
        }
      } finally {
        if (!cancelled) setLoadingDraft(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const clearFieldError = (key: FieldErrorKey) => {
    setFieldErrors((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const patchForm = (key: keyof EventForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (
      key === "title" ||
      key === "date" ||
      key === "startTime" ||
      key === "location" ||
      key === "organizer" ||
      key === "phone" ||
      key === "email" ||
      key === "bankAccountHolder" ||
      key === "bankAccountNumber" ||
      key === "bankName"
    ) {
      clearFieldError(key);
    }
  };

  const patchDistance = (
    key: string,
    patch: Partial<DistanceDraft>
  ) => {
    setDistances((cur) =>
      cur.map((d) => (d.key === key ? { ...d, ...patch } : d))
    );
    clearFieldError("distances");
  };

  const uploadDoc = async (id: string, file?: File) => {
    if (!file) return;
    setUploadingDocId(id);
    setError(null);
    try {
      const stored = await uploadOrganizerFile(file, "document");
      setFiles((current) => ({
        ...current,
        [id]: {
          fileName: stored.fileName || file.name,
          fileUrl: absoluteUrl(stored.fileUrl),
        },
      }));
    } catch (e) {
      setError(getApiErrorMessage(e, "Upload hồ sơ thất bại."));
    } finally {
      setUploadingDocId(null);
    }
  };

  const requiredDocsOk = requiredDocuments
    .filter((item) => item.required)
    .every((item) => files[item.id]);

  const draftCheck = collectDraftErrors(form, distances);
  const createOk = draftCheck.keys.length === 0;
  const bankErrorKeys = collectBankErrors(form);
  const bankOk = bankErrorKeys.length === 0;

  const canContinue =
    (step === 1 && createOk) ||
    step === 2 ||
    step === 3 ||
    step === 4;

  const applyDraftValidation = (): boolean => {
    const check = collectDraftErrors(form, distances);
    if (check.keys.length === 0) {
      setFieldErrors(new Set());
      setError(null);
      return true;
    }
    setFieldErrors(new Set(check.keys));
    setInfoTab(check.tab);
    setStep(1);
    setError(check.message);
    return false;
  };

  const goNextFromStep1 = () => {
    if (!applyDraftValidation()) return;
    setStep(2);
  };

  const submit = async (submitForApproval: boolean) => {
    if (!applyDraftValidation()) return;

    if (submitForApproval && !bankOk) {
      setFieldErrors(new Set(bankErrorKeys));
      setError(
        `Trước khi gửi duyệt cần TK giải ngân BTC: ${bankErrorKeys
          .map((k) => FIELD_ERROR_LABEL[k])
          .join(", ")}.`
      );
      setStep(1);
      setInfoTab("don-vi");
      return;
    }
    if (submitForApproval && !requiredDocsOk) {
      setError("Cần upload đủ hồ sơ bắt buộc trước khi gửi duyệt.");
      setStep(2);
      return;
    }
    if (submitForApproval && !conditions.every(Boolean)) {
      setError("Cần xác nhận đủ điều kiện an toàn.");
      setStep(3);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (editingDraftId) {
        if (!submitForApproval) {
          setCreatedEventId(editingDraftId);
          setCreatedAsDraft(true);
          showToast("Nháp đã có trên hệ thống");
          return;
        }
        const submitted = await submitRaceEvent(editingDraftId);
        setCreatedEventId(submitted.id);
        setCreatedAsDraft(false);
        showToast("Đã gửi hồ sơ thẩm định");
        return;
      }

      const payload = buildPayload(
        form,
        distances,
        files,
        conditions,
        submitForApproval
      );
      const created = await createRaceEvent(payload);
      setCreatedEventId(created.id);
      setEditingDraftId(created.id);
      setCreatedAsDraft(!submitForApproval);
      showToast(
        submitForApproval ? "Đã gửi hồ sơ thẩm định" : "Đã lưu bản nháp"
      );
    } catch (e) {
      setError(
        getApiErrorMessage(
          e,
          submitForApproval ? "Không gửi được hồ sơ." : "Không tạo được giải."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const distanceSummary = useMemo(
    () =>
      distances
        .filter((d) => d.name.trim())
        .map((d) => `${d.name.trim()} (${d.distanceKm || "?"}K)`)
        .join(" · ") || "Chưa có cự ly",
    [distances]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {toast && (
        <div className="fixed right-5 top-24 z-50 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Link
            href={backHref}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
          </Link>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            Tạo giải chạy
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Đăng ký tổ chức giải chạy
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Tạo nhanh với thông tin tối thiểu → lưu nháp. Hồ sơ pháp lý, an toàn
            và TK giải ngân chỉ bắt buộc khi gửi duyệt. Phí VĐV qua PayOS về hệ
            thống RaceDay.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-3 md:grid-cols-4">
          {STEP_LABELS.map((label, index) => {
            const current = index + 1;
            return (
              <button
                key={label}
                type="button"
                onClick={() => current <= step && setStep(current)}
                className={`flex items-center gap-3 rounded-xl p-3 text-left transition ${
                  step === current
                    ? "bg-orange-50 text-orange-700"
                    : current < step
                      ? "text-emerald-700 hover:bg-emerald-50"
                      : "text-slate-400"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    step === current
                      ? "bg-orange-500 text-white"
                      : current < step
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {current < step ? <Check className="h-4 w-4" /> : current}
                </span>
                <span>
                  <strong className="block text-xs">{label}</strong>
                  <small className="mt-0.5 block text-[10px] opacity-70">
                    Bước {current}/4
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loadingDraft ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm font-bold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          Đang tải bản nháp…
        </div>
      ) : null}

      {createdEventId ? (
        <SuccessState
          eventName={form.title.trim() || "Giải chạy"}
          draft={createdAsDraft}
          listHref="/my-events"
          onContinueDraft={
            createdAsDraft
              ? () => {
                  setCreatedEventId(null);
                  setCreatedAsDraft(false);
                  setStep(1);
                  setInfoTab("chung");
                  setError(null);
                }
              : undefined
          }
          detailHref={
            createdAsDraft ? undefined : `/organizer/events/${createdEventId}`
          }
        />
      ) : !loadingDraft ? (
        <>
          {/* Giữ mount khi đổi step — tránh mất preview banner (blob URL) */}
          <div className={step === 1 ? undefined : "hidden"}>
            <BasicInfoStep
              form={form}
              onChange={patchForm}
              infoTab={infoTab}
              onInfoTab={setInfoTab}
              distances={distances}
              fieldErrors={fieldErrors}
              onAddDistance={() =>
                setDistances((cur) => [...cur, emptyDistance()])
              }
              onRemoveDistance={(key) =>
                setDistances((cur) =>
                  cur.length <= 1 ? cur : cur.filter((d) => d.key !== key)
                )
              }
              onPatchDistance={patchDistance}
            />
          </div>
          <div className={step === 2 ? undefined : "hidden"}>
            <DocumentsStep
              files={files}
              uploadingDocId={uploadingDocId}
              onUpload={uploadDoc}
            />
          </div>
          <div className={step === 3 ? undefined : "hidden"}>
            <SafetyStep
              form={form}
              onChangeForm={patchForm}
              conditions={conditions}
              onToggle={(index) =>
                setConditions((current) =>
                  current.map((checked, item) =>
                    item === index ? !checked : checked
                  )
                )
              }
            />
          </div>
          <div className={step === 4 ? undefined : "hidden"}>
            <ReviewStep
              form={form}
              files={files}
              conditions={conditions}
              distanceSummary={distanceSummary}
            />
          </div>

          <div className="flex flex-col-reverse flex-wrap justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              {step > 1 ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-orange-300 hover:text-orange-600 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Quay lại
                </button>
              ) : null}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-800 hover:bg-orange-100 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu…
                  </>
                ) : (
                  "Lưu bản nháp"
                )}
              </button>
            </div>
            <button
              type="button"
              disabled={submitting || (step > 1 && !canContinue)}
              onClick={() => {
                if (step === 1) {
                  goNextFromStep1();
                  return;
                }
                if (step < 4) setStep(step + 1);
                else void submit(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang gửi…
                </>
              ) : step < 4 ? (
                <>
                  Tiếp tục <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Gửi hồ sơ thẩm định <ClipboardCheck className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function BasicInfoStep({
  form,
  onChange,
  infoTab,
  onInfoTab,
  distances,
  fieldErrors,
  onAddDistance,
  onRemoveDistance,
  onPatchDistance,
}: {
  form: EventForm;
  onChange: (key: keyof EventForm, value: string) => void;
  infoTab: InfoTab;
  onInfoTab: (tab: InfoTab) => void;
  distances: DistanceDraft[];
  fieldErrors: Set<FieldErrorKey>;
  onAddDistance: () => void;
  onRemoveDistance: (key: string) => void;
  onPatchDistance: (key: string, patch: Partial<DistanceDraft>) => void;
}) {
  const invalid = (key: FieldErrorKey) => fieldErrors.has(key);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerBroken, setBannerBroken] = useState(false);

  useEffect(() => {
    setBannerError(null);
    setBannerBroken(false);
  }, [form.bannerImage, bannerPreview]);

  const onPickBanner = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBannerError("Chỉ chọn file ảnh (JPG, PNG, WebP…).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBannerError("Ảnh tối đa 8MB.");
      return;
    }
    setUploadingBanner(true);
    setBannerError(null);
    const localUrl = URL.createObjectURL(file);
    setBannerPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return localUrl;
    });
    try {
      const stored = await uploadOrganizerFile(file, "banner");
      onChange("bannerImage", absoluteUrl(stored.fileUrl));
    } catch (e) {
      setBannerError(
        e instanceof Error ? e.message : "Upload ảnh thất bại."
      );
    } finally {
      setUploadingBanner(false);
    }
  };

  const previewSrc = bannerPreview
    ? bannerPreview
    : form.bannerImage
      ? mediaDisplayUrl(form.bannerImage)
      : "";

  const tabs: { id: InfoTab; label: string; icon: typeof Info }[] = [
    { id: "chung", label: "Thông tin chung", icon: Info },
    { id: "cu-ly", label: "Cự ly & giá", icon: Route },
    { id: "don-vi", label: "Đơn vị & tài khoản", icon: Building2 },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <Info className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Thông tin giải chạy
          </h2>
          <p className="mt-1 text-xs text-slate-500">* bắt buộc</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = infoTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onInfoTab(tab.id)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:flex-none ${
                active
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {infoTab === "chung" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Tên giải chạy *"
            value={form.title}
            invalid={invalid("title")}
            onChange={(v) => onChange("title", v)}
          />
          <Field
            label="Tagline (slogan ngắn)"
            value={form.tagline}
            onChange={(v) => onChange("tagline", v)}
            placeholder="vd. Chạy ven biển · BIB điện tử"
          />
          <div className="md:col-span-2 space-y-2">
            <Field
              label="Ảnh banner giải (URL)"
              value={form.bannerImage}
              onChange={(v) => onChange("bannerImage", v)}
              placeholder="https://... hoặc chọn ảnh từ máy"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:border-orange-400 hover:bg-orange-50">
              <Upload className="h-3.5 w-3.5 text-orange-600" />
              {uploadingBanner ? "Đang upload…" : "Chọn ảnh từ máy"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingBanner}
                onChange={(e) => void onPickBanner(e.target.files?.[0])}
              />
            </label>
            {bannerError && (
              <p className="text-xs text-red-600">{bannerError}</p>
            )}
            {previewSrc && !bannerBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={previewSrc}
                src={previewSrc}
                alt="Banner preview"
                referrerPolicy="no-referrer"
                className="mt-1 h-36 w-full rounded-xl border border-slate-200 object-cover"
                onLoad={() => {
                  setBannerBroken(false);
                  setBannerError(null);
                }}
                onError={() => {
                  if (bannerPreview) return;
                  setBannerBroken(true);
                  setBannerError(
                    "Không tải được ảnh từ URL. Thử chọn lại ảnh từ máy."
                  );
                }}
              />
            ) : null}
          </div>
          <Field
            label="Ngày tổ chức *"
            value={form.date}
            type="date"
            invalid={invalid("date")}
            onChange={(v) => onChange("date", v)}
          />
          <Field
            label="Thời gian bắt đầu *"
            value={form.startTime}
            type="time"
            invalid={invalid("startTime")}
            onChange={(v) => onChange("startTime", v)}
          />
          <Field
            label="Địa điểm / tỉnh thành *"
            value={form.location}
            invalid={invalid("location")}
            onChange={(v) => onChange("location", v)}
          />
          <Field
            label="Quy mô dự kiến (số VĐV)"
            value={form.scale}
            onChange={(v) => onChange("scale", v)}
            placeholder="Để trống = tổng slot các cự ly"
          />
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-bold text-slate-600">
              Mô tả và mục tiêu sự kiện
            </span>
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        </div>
      )}

      {infoTab === "cu-ly" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {invalid("distances") ? (
              <p className="mr-auto text-xs font-bold text-red-600">
                Cần đủ tên, km, slot và giá cho mỗi cự ly.
              </p>
            ) : null}
            <button
              type="button"
              onClick={onAddDistance}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm cự ly
            </button>
          </div>
          {distances.map((d, index) => (
            <div
              key={d.key}
              className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-900">
                  Cự ly #{index + 1}
                  {!isDistanceCoreValid(d) && (
                    <span className="ml-2 text-[10px] font-bold text-amber-600">
                      thiếu tên/km/slot/giá
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  disabled={distances.length <= 1}
                  onClick={() => onRemoveDistance(d.key)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa
                </button>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cơ bản
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <Field
                  label="Tên cự ly *"
                  value={d.name}
                  invalid={invalid("distances") && !d.name.trim()}
                  onChange={(v) => onPatchDistance(d.key, { name: v })}
                  placeholder="5K Coastal"
                />
                <Field
                  label="Loại (type)"
                  value={d.type}
                  onChange={(v) => onPatchDistance(d.key, { type: v })}
                  placeholder="road / trail / ultra"
                />
                <Field
                  label="Km *"
                  value={d.distanceKm}
                  invalid={invalid("distances") && num(d.distanceKm) < 0.1}
                  onChange={(v) => onPatchDistance(d.key, { distanceKm: v })}
                  placeholder="5"
                />
                <Field
                  label="Slot (capacity) *"
                  value={d.capacity}
                  invalid={invalid("distances") && num(d.capacity) < 1}
                  onChange={(v) => onPatchDistance(d.key, { capacity: v })}
                />
                <Field
                  label="Giá (VND) *"
                  value={d.price}
                  invalid={
                    invalid("distances") &&
                    (d.price.trim() === "" || num(d.price) < 0)
                  }
                  onChange={(v) => onPatchDistance(d.key, { price: v })}
                  placeholder="299000"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {infoTab === "don-vi" && (
        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Đơn vị tổ chức (hiển thị) *"
              value={form.organizer}
              invalid={invalid("organizer")}
              onChange={(v) => onChange("organizer", v)}
            />
            <Field
              label="Pháp nhân / legal entity"
              value={form.legalEntity}
              onChange={(v) => onChange("legalEntity", v)}
            />
            <Field
              label="Website"
              value={form.website}
              onChange={(v) => onChange("website", v)}
              placeholder="https://"
            />
            <Field
              label="Người phụ trách hồ sơ"
              value={form.contactName}
              onChange={(v) => onChange("contactName", v)}
            />
            <Field
              label="Số điện thoại liên hệ *"
              value={form.phone}
              invalid={invalid("phone")}
              hint="9–12 chữ số"
              onChange={(v) => onChange("phone", v)}
            />
            <Field
              label="Email nhận phản hồi *"
              value={form.email}
              type="email"
              invalid={invalid("email")}
              onChange={(v) => onChange("email", v)}
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tài khoản giải ngân BTC (bắt buộc khi gửi duyệt)
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Chủ tài khoản *"
              value={form.bankAccountHolder}
              invalid={invalid("bankAccountHolder")}
              onChange={(v) => onChange("bankAccountHolder", v)}
            />
            <Field
              label="Số tài khoản *"
              value={form.bankAccountNumber}
              invalid={invalid("bankAccountNumber")}
              onChange={(v) => onChange("bankAccountNumber", v)}
            />
            <Field
              label="Ngân hàng *"
              value={form.bankName}
              invalid={invalid("bankName")}
              onChange={(v) => onChange("bankName", v)}
            />
            <Field
              label="Chi nhánh"
              value={form.bankBranch}
              onChange={(v) => onChange("bankBranch", v)}
            />
            <Field
              label="Nội dung CK giải ngân (gợi ý)"
              value={form.bankTransferNote}
              onChange={(v) => onChange("bankTransferNote", v)}
              placeholder="Giai ngan BTC + ten giai"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function DocumentsStep({
  files,
  uploadingDocId,
  onUpload,
}: {
  files: Record<string, UploadedDoc>;
  uploadingDocId: string | null;
  onUpload: (id: string, file?: File) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Hồ sơ và giấy tờ
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Bắt buộc đủ file đánh dấu đỏ trước khi gửi duyệt.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {requiredDocuments.map((document) => (
          <div
            key={document.id}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-800">
                  {document.title}
                </p>
                {document.required ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    Bắt buộc
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    Nếu có
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {document.description}
              </p>
              {files[document.id] && (
                <p className="mt-2 truncate text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                  {files[document.id].fileName}
                </p>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-orange-300 hover:text-orange-600">
              {uploadingDocId === document.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {files[document.id] ? "Đổi file" : "Tải lên"}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                disabled={uploadingDocId === document.id}
                onChange={(event) =>
                  void onUpload(document.id, event.target.files?.[0])
                }
              />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}

function SafetyStep({
  form,
  onChangeForm,
  conditions,
  onToggle,
}: {
  form: EventForm;
  onChangeForm: (key: keyof EventForm, value: string) => void;
  conditions: boolean[];
  onToggle: (index: number) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Điều kiện an toàn và phối hợp
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Tick đủ mới được gửi duyệt.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {safetyConditions.map((condition, index) => (
          <label
            key={condition}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
              conditions[index]
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-slate-200 hover:border-orange-200"
            }`}
          >
            <input
              type="checkbox"
              checked={conditions[index]}
              onChange={() => onToggle(index)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span className="text-sm leading-6 text-slate-700">{condition}</span>
            {conditions[index] && (
              <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />
            )}
          </label>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field
          label="Đầu mối làm việc với cơ quan chức năng"
          value={form.authorityContact}
          onChange={(v) => onChangeForm("authorityContact", v)}
        />
        <Field
          label="Đơn vị y tế phối hợp"
          value={form.medicalPartner}
          onChange={(v) => onChangeForm("medicalPartner", v)}
        />
        <Field
          label="Số chốt an ninh / phân luồng"
          value={form.securityPosts}
          onChange={(v) => onChangeForm("securityPosts", v)}
        />
        <Field
          label="Số điểm tiếp nước / hỗ trợ"
          value={form.aidStations}
          onChange={(v) => onChangeForm("aidStations", v)}
        />
      </div>
    </section>
  );
}

function ReviewStep({
  form,
  files,
  conditions,
  distanceSummary,
}: {
  form: EventForm;
  files: Record<string, UploadedDoc>;
  conditions: boolean[];
  distanceSummary: string;
}) {
  const uploaded = requiredDocuments.filter((item) => files[item.id]).length;
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-950">Rà soát hồ sơ</h2>
            <p className="mt-1 text-xs text-slate-500">
              Kiểm tra lại trước khi gửi yêu cầu thẩm định.
            </p>
          </div>
        </div>
        <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
          <p className="font-bold text-slate-900">{form.title || "—"}</p>
          {form.tagline ? (
            <p className="mt-0.5 text-xs text-orange-700">{form.tagline}</p>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            {form.date || "—"} · {form.startTime || "—"} · {form.location || "—"}{" "}
            · {form.scale || "—"} VĐV
          </p>
          <p className="mt-2 text-xs text-slate-600">{distanceSummary}</p>
          <p className="mt-2 text-[11px] text-slate-500">
            Giải ngân BTC: {form.bankName || "—"} · {form.bankAccountNumber || "—"}{" "}
            ({form.bankAccountHolder || "—"})
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Summary
            label="Thông tin giải"
            value={form.title ? "Đã hoàn tất" : "Thiếu"}
          />
          <Summary label="Tài liệu" value={`${uploaded}/6 tài liệu`} />
          <Summary
            label="Điều kiện an toàn"
            value={`${conditions.filter(Boolean).length}/${safetyConditions.length} đã xác nhận`}
          />
        </div>
      </div>
      <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-sm leading-6 text-orange-950">
        <strong>Cam kết:</strong> Chịu trách nhiệm về tính chính xác hồ sơ, an
        ninh, PCCC, y tế và môi trường. Phí VĐV qua PayOS về hệ thống RaceDay;
        BTC nhận giải ngân theo TK đã khai.
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-black text-emerald-700">{value}</p>
    </div>
  );
}

function Field({
  label,
  value = "",
  type = "text",
  placeholder,
  invalid,
  hint,
  onChange,
}: {
  label: string;
  value?: string;
  type?: string;
  placeholder?: string;
  invalid?: boolean;
  hint?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span
        className={`text-xs font-bold ${
          invalid ? "text-red-600" : "text-slate-600"
        }`}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 ${
          invalid
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-200 focus:border-orange-400 focus:ring-orange-100"
        }`}
      />
      {invalid && hint ? (
        <span className="text-[11px] text-red-600">{hint}</span>
      ) : null}
    </label>
  );
}

function SuccessState({
  eventName,
  draft,
  listHref,
  onContinueDraft,
  detailHref,
}: {
  eventName: string;
  draft: boolean;
  listHref: string;
  onContinueDraft?: () => void;
  detailHref?: string;
}) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-2xl font-black text-emerald-950">
        {draft ? "Đã lưu bản nháp" : "Đã gửi hồ sơ thành công"}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-emerald-800">
        Giải <strong>{eventName}</strong>
        {draft
          ? " đã được lưu. Bạn có thể hoàn thiện hồ sơ và gửi duyệt sau."
          : " đang chờ thẩm định. Bạn sẽ nhận thông báo khi có cập nhật."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {draft && onContinueDraft ? (
          <button
            type="button"
            onClick={onContinueDraft}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Tiếp tục đăng ký <ArrowRight className="h-4 w-4" />
          </button>
        ) : detailHref ? (
          <Link
            href={detailHref}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Xem chi tiết giải <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
        <Link
          href={listHref}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
        >
          Danh sách giải của tôi
        </Link>
      </div>
    </section>
  );
}
