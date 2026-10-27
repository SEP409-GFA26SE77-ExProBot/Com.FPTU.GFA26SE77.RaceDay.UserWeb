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

export {
  PROFILE_DOC_TYPES,
  LEGACY_OPTIONAL_DOC_KEYS,
  LEGACY_OPTIONAL_DOC_META,
  isPlanRelatedDocument,
} from "@/lib/event-profile-docs";
