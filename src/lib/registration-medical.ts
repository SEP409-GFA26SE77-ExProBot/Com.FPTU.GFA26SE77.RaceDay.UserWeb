/** Medical option codes from runner registration form */
export const MEDICAL_OPTIONS = [
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

const LABEL_BY_CODE = Object.fromEntries(
  MEDICAL_OPTIONS.map((o) => [o.code, o.label])
) as Record<string, string>;

export function normalizeMedicalCodes(
  codes: string[] | unknown | null | undefined
): string[] {
  if (!codes) return [];
  if (Array.isArray(codes)) {
    return codes.map((c) => String(c).trim()).filter(Boolean);
  }
  if (typeof codes === "string") {
    const t = codes.trim();
    if (!t) return [];
    try {
      const parsed = JSON.parse(t) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((c) => String(c).trim()).filter(Boolean);
      }
    } catch {
      /* plain string */
    }
    return t.split(/[,;|]/).map((c) => c.trim()).filter(Boolean);
  }
  return [];
}

/** true khi có bệnh lý đặc biệt (không chỉ "none") */
export function hasSpecialMedical(
  codes: string[] | unknown | null | undefined
): boolean {
  const list = normalizeMedicalCodes(codes);
  if (list.length === 0) return false;
  return list.some((c) => c.toLowerCase() !== "none");
}

export function formatMedicalLabels(
  codes: string[] | unknown | null | undefined
): string {
  const list = normalizeMedicalCodes(codes);
  if (list.length === 0) return "—";
  return list
    .map((c) => LABEL_BY_CODE[c.toLowerCase()] || LABEL_BY_CODE[c] || c)
    .join(", ");
}

export function registrationReviewerLabel(r: {
  reviewedByName?: string | null;
  reviewedBy?: string | null;
}): string | null {
  const name = (r.reviewedByName || r.reviewedBy || "").trim();
  return name || null;
}

export function registrationReviewedAt(r: {
  reviewedAtUtc?: string | null;
  updatedAtUtc?: string | null;
  updatedAt?: string | null;
}): string | null {
  return r.reviewedAtUtc || r.updatedAtUtc || r.updatedAt || null;
}
