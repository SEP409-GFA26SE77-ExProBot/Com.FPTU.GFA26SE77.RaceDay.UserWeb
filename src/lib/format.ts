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

/** Map BE event status string to UI label (tiếng Việt) — góc nhìn VĐV */
export function getStatusLabel(status: string): string {
  const key = (status || "").toLowerCase().replace(/_/g, "-");
  switch (key) {
    case "registration-open":
      return "Đang mở đăng ký";
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

/** Status giải — góc nhìn BTC / quản lý giải của tôi */
export function getOrganizerStatusLabel(status: string): string {
  const key = (status || "").toLowerCase().replace(/_/g, "-");
  switch (key) {
    case "draft":
      return "Nháp";
    case "pending":
    case "pending-approval":
      return "Chờ duyệt";
    case "approved":
    case "published":
      return "Đã duyệt";
    case "registration-open":
      return "Đang mở ĐK";
    case "closed":
      return "Đã đóng ĐK";
    case "completed":
      return "Đã kết thúc";
    case "cancelled":
      return "Đã hủy";
    case "rejected":
      return "Bị từ chối";
    case "in-progress":
      return "Đang diễn ra";
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
      return "Hoàn tiền";
    default:
      return status;
  }
}
