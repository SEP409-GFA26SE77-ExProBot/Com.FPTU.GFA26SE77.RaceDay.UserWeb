export function statusKey(status: string) {
  return (status || "").toLowerCase().replace(/_/g, "-");
}

export function canEditProfile(status: string) {
  const k = statusKey(status);
  return k === "draft" || k === "rejected";
}

export function canSubmitForApproval(status: string) {
  const k = statusKey(status);
  return k === "draft" || k === "rejected";
}

export function canOpenRegistration(status: string) {
  const k = statusKey(status);
  return k === "approved" || k === "closed";
}

/** ISO UTC → value for datetime-local (local timezone) */
export function utcToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local → ISO UTC */
export function localInputToUtcIso(local: string): string | null {
  if (!local.trim()) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** TimeOnly "HH:mm:ss" or "HH:mm" → "HH:mm" for input */
export function timeOnlyToInput(t: string | null | undefined): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export function inputToTimeOnly(t: string): string | null {
  if (!t.trim()) return null;
  return t.length === 5 ? `${t}:00` : t;
}

export const PROFILE_DOC_TYPES = [
  {
    id: "official-letter",
    title: "Công văn đề nghị cấp phép",
    description: "Văn bản của doanh nghiệp gửi UBND Thành phố/Sở Văn hóa và Thể thao.",
    required: true,
  },
  {
    id: "security",
    title: "Phương án an ninh, trật tự và PCCC",
    description: "Bảo vệ, phân luồng, y tế, phòng cháy chữa cháy và môi trường.",
    required: true,
  },
  {
    id: "other-documents",
    title: "Các tài liệu khác",
    description: "Kế hoạch tổ chức, chương trình thi đấu, điều lệ giải và các tài liệu bổ sung (nếu có).",
    required: false,
  },
] as const;
