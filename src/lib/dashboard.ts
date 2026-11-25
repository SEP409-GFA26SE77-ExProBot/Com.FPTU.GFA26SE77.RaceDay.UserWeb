export type DateRange = { from: string; to: string };

export function recentRange(days = 30, now = new Date()): DateRange {
  const to = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = new Date(to + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { from: start.toISOString().slice(0, 10), to };
}

export function rangeError(range: DateRange): string | null {
  const valid = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number(value.slice(0, 4)) >= 1900 &&
    Number(value.slice(0, 4)) <= 9998 &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(range.from) || !valid(range.to))
    return "Nhập ngày hợp lệ từ năm 1900 đến 9998.";
  const days = (Date.parse(range.to) - Date.parse(range.from)) / 86400000 + 1;
  if (days < 1) return "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.";
  if (days > 366) return "Vui lòng chọn tối đa 366 ngày.";
  return null;
}

export const numberLabel = (value: number) => value.toLocaleString("vi-VN");
export const dateLabel = (value: string) =>
  value.slice(0, 10).split("-").reverse().join("/");
export const updatedLabel = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
export const moneyLabel = (value: number, currency: string) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
  }).format(value);
