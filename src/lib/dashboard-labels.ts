const labels: Record<string, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  "registration-open": "Đang mở đăng ký",
  closed: "Đã đóng đăng ký",
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

type Count = { status: string; count: number };
export function groupedDashboardStatuses(items: Count[], kind: "event" | "registration") {
  const groups: { label: string; statuses: string[] }[] = kind === "event"
    ? [
        { label: "Đang chuẩn bị", statuses: ["draft", "approved"] },
        { label: "Chờ duyệt", statuses: ["pending"] },
        { label: "Đang mở đăng ký", statuses: ["registration-open"] },
        { label: "Đã đóng đăng ký", statuses: ["closed"] },
        { label: "Đã hoàn thành", statuses: ["completed"] },
        { label: "Cần chú ý", statuses: ["rejected", "suspended", "cancelled"] },
      ]
    : [
        { label: "Chờ thanh toán", statuses: ["pending_payment"] },
        { label: "Chờ duyệt", statuses: ["pending_approval"] },
        { label: "Đăng ký đã xác nhận", statuses: ["confirmed", "finished"] },
        { label: "Hủy / từ chối", statuses: ["cancelled", "rejected"] },
      ];
  const known = new Set(groups.flatMap((group) => group.statuses));
  return [
    ...groups.map((group) => ({
      label: group.label,
      count: items.filter((item) => group.statuses.includes(item.status)).reduce((sum, item) => sum + item.count, 0),
    })),
    ...items.filter((item) => !known.has(item.status)).map((item) => ({ label: dashboardStatusLabel(item.status), count: item.count })),
  ].filter((item) => item.count > 0);
}
