/**
 * Danh mục hồ sơ giải — đồng bộ checklist gửi duyệt (BE bắt buộc
 * `official-letter` + `security`). Optional gộp thành một slot `other`.
 */

export type ProfileDocType = {
  id: string;
  title: string;
  description: string;
  required: boolean;
};

export const PROFILE_DOC_TYPES: readonly ProfileDocType[] = [
  {
    id: "official-letter",
    title: "Công văn đề nghị cấp phép",
    description:
      "Văn bản của doanh nghiệp gửi UBND Thành phố/Sở Văn hóa và Thể thao.",
    required: true,
  },
  {
    id: "security",
    title: "Phương án an ninh, trật tự và PCCC",
    description:
      "Bảo vệ, phân luồng, y tế, phòng cháy chữa cháy và môi trường.",
    required: true,
  },
  {
    id: "other",
    title: "Các loại tài liệu khác có liên quan",
    description:
      "Kế hoạch tổ chức, chương trình thi đấu, điều lệ, danh sách người nước ngoài… (nếu có). Hệ thống chỉ cần xác minh file có tồn tại — Admin không duyệt nội dung pháp lý.",
    required: false,
  },
] as const;

/** Key tùy chọn cũ — giữ khi lưu để không mất file đã upload trước đó. */
export const LEGACY_OPTIONAL_DOC_KEYS = [
  "plan",
  "program",
  "rules",
  "foreign-list",
] as const;

export const LEGACY_OPTIONAL_DOC_META: Record<
  (typeof LEGACY_OPTIONAL_DOC_KEYS)[number],
  { title: string }
> = {
  plan: { title: "Kế hoạch tổ chức sự kiện" },
  program: { title: "Chương trình và nội dung thi đấu" },
  rules: { title: "Điều lệ giải và trọng tài" },
  "foreign-list": { title: "Danh sách người nước ngoài tham dự" },
};

export function isPlanRelatedDocument(doc: {
  documentKey?: string | null;
  title?: string | null;
}): boolean {
  const key = (doc.documentKey || "").toLowerCase();
  if (key === "plan" || key === "other") return true;
  return /kế hoạch|ke hoach|plan/i.test(doc.title || "");
}
