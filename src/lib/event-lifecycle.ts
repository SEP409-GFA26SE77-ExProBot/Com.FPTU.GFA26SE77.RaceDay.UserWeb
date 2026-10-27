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

/** Badge trên ảnh banner/card list — nền đặc + chữ sáng (không dùng /15 translucent). */
export function getPublicEventStatusBadgeClass(label: string): string {
  switch (label) {
    case "Đang mở":
      return "bg-emerald-600 text-white";
    case "Sắp mở":
    case "Chờ mở":
      return "bg-amber-500 text-zinc-950";
    case "Đang diễn ra":
      return "bg-rose-600 text-white";
    case "Hết slot":
    case "Đã hủy":
    case "Từ chối":
      return "bg-red-600 text-white";
    case "Đã đóng":
    case "Đã kết thúc":
      return "bg-zinc-800 text-white";
    default:
      return "bg-zinc-950 text-white";
  }
}

/** Badge trên banner — nền đặc + chữ sáng (giống EventCard public). */
export function getMyEventsCardStatusColor(label: string): string {
  switch (label) {
    case "Đã duyệt":
      return "bg-emerald-600 text-white";
    case "Chờ duyệt":
    case "Chưa duyệt":
      return "bg-amber-500 text-zinc-950";
    case "Đã bắt đầu":
      return "bg-orange-600 text-white";
    case "Đã kết thúc":
    case "Hết hạn gói":
      return "bg-zinc-800 text-white";
    case "Đã từ chối":
    case "Đã hủy":
      return "bg-red-600 text-white";
    default:
      return "bg-zinc-950 text-white";
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
