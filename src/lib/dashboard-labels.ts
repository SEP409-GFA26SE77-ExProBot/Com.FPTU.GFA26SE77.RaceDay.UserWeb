const labels: Record<string, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  "pending-approval": "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  published: "Đã công bố",
  "registration-open": "Đang mở đăng ký",
  closed: "Đã đóng đăng ký",
  "in-progress": "Đang diễn ra",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
  suspended: "Tạm đình chỉ",
  pending_payment: "Chờ thanh toán",
  pending_approval: "Chờ duyệt",
  confirmed: "Đã xác nhận",
  finished: "Đã hoàn thành",
  not_started: "Chưa xuất phát",
  running: "Đang chạy",
  dns: "Không xuất phát (DNS)",
  dnf: "Không hoàn thành (DNF)",
  dq: "Bị loại (DQ)",
};
export const dashboardStatusLabel = (status: string) =>
  labels[status.toLowerCase()] ?? status;
export const documentLabel = (key: string) =>
  ({ "official-letter": "Công văn tổ chức", security: "Phương án an ninh" })[
    key
  ] ?? key;
