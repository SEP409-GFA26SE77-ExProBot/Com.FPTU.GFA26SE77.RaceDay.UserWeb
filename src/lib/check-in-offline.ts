import type {
  CheckInListItem,
  CheckInResult,
  StaffAssignmentDto,
} from "@/api/check-in";

const LIST_KEY = (eventId: string) => `rd_ci_list_${eventId}`;
const QUEUE_KEY = (eventId: string) => `rd_ci_queue_${eventId}`;
const ASSIGN_KEY = "rd_ci_assignment";

export type PendingCheckIn = {
  id: string;
  eventId: string;
  bib: string;
  registrationId: string;
  fullName: string;
  distanceLabel?: string | null;
  createdAtUtc: string;
  qrPayload?: string;
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isProbablyOffline(err?: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }
  if (!err || typeof err !== "object") return false;
  const e = err as {
    message?: string;
    code?: string;
    response?: unknown;
  };
  if (e.response) return false; // có HTTP response = có mạng
  const msg = (e.message || "").toLowerCase();
  return (
    e.code === "ERR_NETWORK" ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("failed to fetch")
  );
}

export function cacheAssignment(a: StaffAssignmentDto | null) {
  if (typeof window === "undefined") return;
  if (!a) {
    localStorage.removeItem(ASSIGN_KEY);
    return;
  }
  localStorage.setItem(ASSIGN_KEY, JSON.stringify(a));
}

export function readCachedAssignment(): StaffAssignmentDto | null {
  if (typeof window === "undefined") return null;
  return safeParse<StaffAssignmentDto>(localStorage.getItem(ASSIGN_KEY));
}

export function cacheCheckInList(eventId: string, list: CheckInListItem[]) {
  if (typeof window === "undefined" || !eventId) return;
  localStorage.setItem(
    LIST_KEY(eventId),
    JSON.stringify({ at: Date.now(), list })
  );
}

export function readCachedCheckInList(eventId: string): CheckInListItem[] {
  if (typeof window === "undefined" || !eventId) return [];
  const wrap = safeParse<{ list: CheckInListItem[] }>(
    localStorage.getItem(LIST_KEY(eventId))
  );
  return Array.isArray(wrap?.list) ? wrap.list : [];
}

export function readQueue(eventId: string): PendingCheckIn[] {
  if (typeof window === "undefined" || !eventId) return [];
  const q = safeParse<PendingCheckIn[]>(localStorage.getItem(QUEUE_KEY(eventId)));
  return Array.isArray(q) ? q : [];
}

function writeQueue(eventId: string, q: PendingCheckIn[]) {
  localStorage.setItem(QUEUE_KEY(eventId), JSON.stringify(q));
}

export function enqueuePending(item: PendingCheckIn) {
  const q = readQueue(item.eventId);
  if (q.some((x) => x.registrationId === item.registrationId || x.bib === item.bib)) {
    return;
  }
  writeQueue(item.eventId, [item, ...q]);
}

export function removePending(eventId: string, id: string) {
  writeQueue(
    eventId,
    readQueue(eventId).filter((x) => x.id !== id)
  );
}

/** Gộp trạng thái pending vào list để UI hiện “Đã check-in (chờ sync)”. */
export function mergeListWithPending(
  list: CheckInListItem[],
  eventId: string
): CheckInListItem[] {
  const q = readQueue(eventId);
  if (q.length === 0) return list;
  const byReg = new Map(q.map((p) => [p.registrationId, p]));
  const byBib = new Map(q.map((p) => [p.bib.trim().toLowerCase(), p]));
  return list.map((row) => {
    const p =
      byReg.get(row.registrationId) ||
      byBib.get((row.bibNumber || "").trim().toLowerCase());
    if (!p) return row;
    if (row.checkedIn) return row;
    return {
      ...row,
      checkedIn: true,
      checkedInAtUtc: p.createdAtUtc,
      status: "pending_sync",
    };
  });
}

export function extractBibAndEventFromQr(raw: string): {
  bib: string | null;
  eventId: string | null;
} {
  const t = raw.trim();
  if (!t) return { bib: null, eventId: null };
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    const bibRaw = o.bib ?? o.Bib ?? o.bibNumber;
    let bib: string | null = null;
    if (typeof bibRaw === "string" && bibRaw.trim()) bib = bibRaw.trim();
    else if (typeof bibRaw === "number") bib = String(bibRaw);

    const ev = o.event_id ?? o.eventId;
    let eventId: string | null = null;
    if (typeof ev === "string" && ev.trim()) eventId = ev.trim();
    return { bib, eventId };
  } catch {
    if (/^\d{1,8}$/.test(t)) return { bib: t, eventId: null };
    return { bib: null, eventId: null };
  }
}

/**
 * Check-in local khi mất mạng — cần đã cache list confirmed trước đó.
 */
export function offlineCheckIn(opts: {
  eventId: string;
  bib?: string;
  qrPayload?: string;
}): CheckInResult {
  const { eventId } = opts;
  let bib = opts.bib?.trim() || "";
  if (!bib && opts.qrPayload) {
    const parsed = extractBibAndEventFromQr(opts.qrPayload);
    if (parsed.eventId && parsed.eventId.toLowerCase() !== eventId.toLowerCase()) {
      throw new Error("QR không thuộc giải đang check-in.");
    }
    bib = parsed.bib || "";
  }
  if (!bib) throw new Error("Offline: cần số BIB (hoặc QR có bib).");

  const list = mergeListWithPending(readCachedCheckInList(eventId), eventId);
  const row = list.find(
    (x) => (x.bibNumber || "").trim().toLowerCase() === bib.toLowerCase()
  );
  if (!row) {
    throw new Error(
      `Offline: không thấy BIB ${bib} trong cache. Cần tải list khi còn mạng trước.`
    );
  }

  const at = new Date().toISOString();
  if (row.checkedIn) {
    return {
      registrationId: row.registrationId,
      eventId,
      bibNumber: row.bibNumber,
      fullName: row.fullName,
      status: row.status,
      checkedInAtUtc: row.checkedInAtUtc || at,
      alreadyCheckedIn: true,
      distanceLabel: row.distanceLabel,
      distanceKm: row.distanceKm,
    };
  }

  enqueuePending({
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventId,
    bib: row.bibNumber,
    registrationId: row.registrationId,
    fullName: row.fullName,
    distanceLabel: row.distanceLabel,
    createdAtUtc: at,
    qrPayload: opts.qrPayload,
  });

  // cập nhật cache list để F5 vẫn thấy
  const next = list.map((x) =>
    x.registrationId === row.registrationId
      ? { ...x, checkedIn: true, checkedInAtUtc: at, status: "pending_sync" }
      : x
  );
  cacheCheckInList(eventId, next);

  return {
    registrationId: row.registrationId,
    eventId,
    bibNumber: row.bibNumber,
    fullName: row.fullName,
    status: "pending_sync",
    checkedInAtUtc: at,
    alreadyCheckedIn: false,
    distanceLabel: row.distanceLabel,
    distanceKm: row.distanceKm,
  };
}
