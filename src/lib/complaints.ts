import type { ComplaintStatus, CreateComplaintDto } from "@/dto/complaint.dto";

export function normalizeComplaintStatus(status: string): ComplaintStatus {
  switch (status.toLowerCase()) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      throw new Error("Trạng thái khiếu nại không hợp lệ.");
  }
}

export function safeEvidenceUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function isComplaintId(value: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    ) && value !== "00000000-0000-0000-0000-000000000000"
  );
}

export function complaintFormError(
  input: Pick<CreateComplaintDto, "title" | "content" | "evidenceLinks">,
): string | null {
  if (!input.title.trim() || input.title.trim().length > 200)
    return "Tiêu đề phải có từ 1 đến 200 ký tự.";
  if (!input.content.trim() || input.content.trim().length > 2000)
    return "Nội dung phải có từ 1 đến 2000 ký tự.";
  const links = input.evidenceLinks.map((link) => link.trim()).filter(Boolean);
  if (links.length < 1 || links.length > 5)
    return "Cần từ 1 đến 5 link bằng chứng.";
  if (links.some((link) => !safeEvidenceUrl(link)))
    return "Link bằng chứng phải là URL http hoặc https hợp lệ.";
  return null;
}

export function complaintDetailHref(
  complaintId: string,
  eventId?: string,
  organizer = false,
): string {
  const params = new URLSearchParams({ complaintId });
  if (organizer && eventId) params.set("eventId", eventId);
  return `${organizer ? "/organizer/disputes/resolve" : "/disputes/detail"}?${params}`;
}

export function formatComplaintDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
