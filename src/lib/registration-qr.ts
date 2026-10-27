/** Khớp BE BuildQrJson / check-in ResolveRegistration. */

export type RegistrationQrSource = {
  userId?: string | null;
  bibNumber?: string | null;
  eventId?: string | null;
  distanceKm?: number | null;
  qrPayload?: unknown;
};

/** Chuẩn hóa qrPayload API (object hoặc string) → chuỗi JSON cho QRCode. */
export function buildCheckInQrValue(reg: RegistrationQrSource): string {
  const fromApi = normalizeQrPayload(reg.qrPayload);
  if (fromApi) return fromApi;

  return JSON.stringify({
    user_id: reg.userId ?? "",
    bib: reg.bibNumber ?? "",
    event_id: reg.eventId ?? "",
    distance: reg.distanceKm ?? 0,
  });
}

function normalizeQrPayload(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t || t === "[object Object]") return null;
    return t;
  }
  if (typeof raw === "object") {
    try {
      return JSON.stringify(raw);
    } catch {
      return null;
    }
  }
  return null;
}

/** Lấy bib từ chuỗi QR đã quét (hỗ trợ snake/camel). */
export function extractBibFromQrPayload(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    const bib = o.bib ?? o.Bib ?? o.bibNumber;
    if (typeof bib === "string" && bib.trim()) return bib.trim();
    if (typeof bib === "number" && Number.isFinite(bib)) return String(bib);
  } catch {
    /* plain text bib */
    if (/^\d{1,8}$/.test(t)) return t;
  }
  return null;
}
