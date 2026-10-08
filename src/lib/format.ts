/** Format VND price: 199000 → "199.000đ" */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

/** Format ISO date to human-friendly: "Sat, November 15, 2026" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Map BE event status string to UI label */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "registration-open":
      return "Registration Open";
    case "approved":
      return "Approved";
    case "pending":
      return "Pending Review";
    case "draft":
      return "Draft";
    case "closed":
      return "Closed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

/** Map BE event status string to CSS class tokens */
export function getStatusColor(status: string): string {
  switch (status) {
    case "registration-open":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/25";
    case "approved":
      return "bg-blue-500/15 text-blue-700 border-blue-500/25";
    case "pending":
      return "bg-amber-500/15 text-amber-700 border-amber-500/25";
    case "draft":
      return "bg-gray-500/15 text-gray-600 border-gray-500/25";
    case "closed":
    case "completed":
      return "bg-gray-500/15 text-gray-600 border-gray-500/25";
    case "cancelled":
    case "rejected":
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
      return "Đã xác nhận";
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
