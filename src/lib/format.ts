/** Format VND price: 199000 → "199.000đ" */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

/** Format ISO date to human-friendly VI */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format ISO datetime to VI (ngày + giờ) */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Map BE event status string to UI label (tiếng Việt) — góc nhìn VĐV */
export function getStatusLabel(status: string): string {
  const key = (status || "").toLowerCase().replace(/_/g, "-");
  switch (key) {
    case "registration-open":
      return "Đang mở";
    case "approved":
    case "published":
      // User FE: chưa mở ĐK → “Sắp mở” (không dùng wording admin “Đã duyệt”)
      return "Sắp mở";
    case "pending":
    case "pending-approval":
    case "draft":
      return "Chờ mở";
    case "upcoming":
      return "Sắp mở";
    case "closed":
      return "Đã đóng";
    case "completed":
      return "Đã kết thúc";
    case "cancelled":
      return "Đã hủy";
    case "suspended":
      return "Hết hạn gói";
    case "rejected":
      return "Từ chối";
    case "sold-out":
      return "Hết slot";
    case "in-progress":
      return "Đang diễn ra";
    default:
      return status;
  }
}

/** Status giải — góc nhìn BTC (hồ sơ / chi tiết). List “Giải của tôi” dùng getMyEventsCardStatusLabel. */
export function getOrganizerStatusLabel(status: string): string {
  const key = (status || "").toLowerCase().replace(/_/g, "-");
  switch (key) {
    case "draft":
      return "Chưa duyệt";
    case "pending":
    case "pending-approval":
      return "Chờ duyệt";
    case "suspended":
      return "Hết hạn gói";
    case "approved":
    case "published":
    case "registration-open":
    case "closed":
      return "Đã duyệt";
    case "completed":
      return "Đã kết thúc";
    case "cancelled":
      return "Đã hủy";
    case "rejected":
      return "Đã từ chối";
    case "in-progress":
      return "Đã bắt đầu";
    default:
      return getStatusLabel(status);
  }
}

/** Map BE event status string to CSS class tokens */
export function getStatusColor(status: string): string {
  const key = (status || "").toLowerCase().replace(/_/g, "-");
  switch (key) {
    case "registration-open":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/25";
    case "approved":
    case "published":
    case "pending":
    case "pending-approval":
    case "upcoming":
    case "draft":
      return "bg-amber-500/15 text-amber-700 border-amber-500/25";
    case "in-progress":
      return "bg-orange-500/15 text-orange-700 border-orange-500/25";
    case "closed":
    case "completed":
    case "suspended":
      return "bg-gray-500/15 text-gray-600 border-gray-500/25";
    case "cancelled":
    case "rejected":
    case "sold-out":
      return "bg-red-500/15 text-red-700 border-red-500/25";
    default:
      return "bg-gray-500/15 text-gray-600 border-gray-500/25";
  }
}

/** Map BE registration status to UI label */
export function getRegistrationStatusLabel(status: string): string {
  switch (status) {
    case "pending_payment":
      return "Chờ thanh toán";
    case "pending_approval":
      return "Chờ duyệt";
    case "confirmed":
      return "Đã đăng ký";
    case "finished":
      return "Đã hoàn thành";
    case "rejected":
      return "Bị từ chối";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
}

/** Map BE registration status to CSS class tokens */
export function getRegistrationStatusColor(status: string): string {
  switch (status) {
    case "pending_payment":
      return "bg-amber-500/15 text-amber-700 border-amber-500/25";
    case "pending_approval":
      return "bg-blue-500/15 text-blue-700 border-blue-500/25";
    case "confirmed":
    case "finished":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/25";
    case "rejected":
      return "bg-red-500/15 text-red-700 border-red-500/25";
    case "cancelled":
      return "bg-gray-500/15 text-gray-600 border-gray-500/25";
    default:
      return "bg-gray-500/15 text-gray-600 border-gray-500/25";
  }
}

/** Map BE payment status to UI label */
export function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Chờ thanh toán";
    case "paid":
      return "Đã thanh toán";
    case "failed":
      return "Thất bại";
    case "cancelled":
      return "Đã hủy";
    case "expired":
      return "Hết hạn";
    case "refunded":
      return "Đã hoàn tiền";
    case "refund_requested":
    case "refund_processing":
      return "Đang hoàn tiền";
    default:
      return status;
  }
}

/** Trạng thái yêu cầu giải ngân (escrow) */
export function getPayoutStatusLabel(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "Chờ duyệt";
    case "approved":
      return "Đã duyệt";
    case "transferred":
      return "Đã chuyển khoản";
    case "rejected":
      return "Từ chối";
    default:
      return status;
  }
}

/** Trạng thái yêu cầu hoàn tiền runner */
export function getRefundStatusLabel(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "eligible":
      return "Có thể hoàn";
    case "requested":
      return "Đã gửi yêu cầu";
    case "processing":
      return "Đang xử lý";
    case "refunded":
      return "Đã hoàn tiền";
    case "rejected":
      return "Từ chối hoàn";
    case "none":
      return "—";
    default:
      return status;
  }
}
