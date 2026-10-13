/** yyyy-MM-dd local hôm nay */
export function todayYmdLocal(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Ngày mai (không cho chọn hôm nay / quá khứ). */
export function tomorrowYmdLocal(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return todayYmdLocal(d);
}

function statusKey(status: string): string {
  return (status || "").toLowerCase().replace(/_/g, "-");
}

export type EventLifecycleDates = {
  date?: string | null;
  endDate?: string | null;
  status?: string;
  registrationOpensAtUtc?: string | null;
  registrationClosesAtUtc?: string | null;
};

/** Đã qua ngày kết thúc (hoặc ngày tổ chức nếu không có endDate). */
export function isEventEnded(event: EventLifecycleDates, now = new Date()): boolean {
  const sk = statusKey(event.status || "");
  if (sk === "completed" || sk === "cancelled") return true;
  const end = (event.endDate || event.date || "").slice(0, 10);
  if (!end) return false;
  return todayYmdLocal(now) > end;
}

/** Đã tới/qua ngày tổ chức và chưa kết thúc. */
export function isEventStarted(event: EventLifecycleDates, now = new Date()): boolean {
  if (isEventEnded(event, now)) return false;
  const start = (event.date || "").slice(0, 10);
  if (!start) return false;
  return todayYmdLocal(now) >= start;
}

/**
 * Public: Đang mở ĐK thực sự (status + cửa sổ thời gian).
 * Approved / chưa tới giờ mở → coi như sắp mở.
 */
export function isPublicRegistrationLive(
  event: EventLifecycleDates,
  now = new Date()
): boolean {
  const sk = statusKey(event.status || "");
  if (sk !== "registration-open") return false;
  if (isEventEnded(event, now)) return false;
  const t = now.getTime();
  if (
    event.registrationOpensAtUtc &&
    t < new Date(event.registrationOpensAtUtc).getTime()
  ) {
    return false;
  }
  if (
    event.registrationClosesAtUtc &&
    t >= new Date(event.registrationClosesAtUtc).getTime()
  ) {
    return false;
  }
  return true;
}

/**
 * Badge thẻ “Giải của tôi” — khớp bộ lọc:
 * Chưa duyệt / Chờ duyệt / Đã duyệt / Đã từ chối / Đã bắt đầu / Đã kết thúc
 */
export function getMyEventsCardStatusLabel(
  event: EventLifecycleDates & { status: string },
  now = new Date()
): string {
  const sk = statusKey(event.status || "");
  if (sk === "draft") return "Chưa duyệt";
  if (sk === "pending" || sk === "pending-approval") return "Chờ duyệt";
  if (sk === "rejected") return "Đã từ chối";
  if (sk === "cancelled") return "Đã hủy";
  if (sk === "suspended") return "Hết hạn gói";
  if (isEventEnded(event, now) || sk === "completed") return "Đã kết thúc";
  if (isEventStarted(event, now) || sk === "in-progress") return "Đã bắt đầu";
  // approved / registration-open / closed (chưa tới race day)
  if (
    sk === "approved" ||
    sk === "published" ||
    sk === "registration-open" ||
    sk === "closed"
  ) {
    return "Đã duyệt";
  }
  return "Chưa duyệt";
}

export function getMyEventsCardStatusColor(label: string): string {
  switch (label) {
    case "Đã duyệt":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/25";
    case "Chờ duyệt":
    case "Chưa duyệt":
      return "bg-amber-500/15 text-amber-700 border-amber-500/25";
    case "Đã bắt đầu":
      return "bg-orange-500/15 text-orange-700 border-orange-500/25";
    case "Đã kết thúc":
    case "Hết hạn gói":
      return "bg-gray-500/15 text-gray-600 border-gray-500/25";
    case "Đã từ chối":
    case "Đã hủy":
      return "bg-red-500/15 text-red-700 border-red-500/25";
    default:
      return "bg-gray-500/15 text-gray-600 border-gray-500/25";
  }
}

/** Label status góc nhìn VĐV (public list/detail). */
export function getPublicEventStatusLabel(
  event: EventLifecycleDates,
  now = new Date()
): string {
  const sk = statusKey(event.status || "");
  if (isEventEnded(event, now) || sk === "completed") return "Đã kết thúc";
  if (isEventStarted(event, now) || sk === "in-progress") return "Đang diễn ra";
  if (isPublicRegistrationLive(event, now)) return "Đang mở";
  if (
    sk === "approved" ||
    sk === "published" ||
    sk === "upcoming" ||
    sk === "registration-open"
  ) {
    // registration-open nhưng chưa tới giờ mở → Sắp mở
    return "Sắp mở";
  }
  if (sk === "closed") return "Đã đóng";
  if (sk === "cancelled") return "Đã hủy";
  if (sk === "sold-out") return "Hết slot";
  return "Sắp mở";
}
