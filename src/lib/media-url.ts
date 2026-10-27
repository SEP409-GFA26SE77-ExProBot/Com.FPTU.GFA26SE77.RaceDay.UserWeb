import { BASE_URL } from "@/config/global-config";

/**
 * BE Local: `/uploads/{folder}/{file}` trên API.
 * BE R2: `{Storage:PublicBaseUrl}/{folder}/{file}`.
 * Một số bản ghi lưu nhầm `http://localhost:5080/event-docs/...` → rewrite CDN.
 */
const STORAGE_PUBLIC = (
  process.env.NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL || ""
).replace(/\/$/, "");

const STORAGE_FOLDER =
  /^\/(?:uploads\/)?(event-docs|event-banners|event-photos|health-certs|avatars)\/(.+)$/i;

export function absoluteFileUrl(fileUrl: string): string {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("blob:")) {
    return fileUrl;
  }
  const base = (BASE_URL || "").replace(/\/$/, "");
  if (!base) return fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${base}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

export function resolveStoredFileUrl(fileUrl: string): string {
  if (!fileUrl || fileUrl.startsWith("blob:")) return fileUrl || "";

  const abs = absoluteFileUrl(fileUrl);
  if (!STORAGE_PUBLIC) return abs;

  try {
    const u = new URL(abs);
    const match = u.pathname.match(STORAGE_FOLDER);
    if (!match) return abs;

    const folder = match[1];
    const rest = match[2];
    const apiOrigin = (BASE_URL || "").replace(/\/$/, "");
    const onApiHost =
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      (!!apiOrigin && u.origin === apiOrigin);

    if (u.origin === STORAGE_PUBLIC) return abs;
    if (onApiHost) {
      return `${STORAGE_PUBLIC}/${folder}/${rest}`;
    }
  } catch {
    /* keep */
  }
  return abs;
}

/**
 * Preview / mở file trên User FE.
 * Dùng URL tuyệt đối BE/R2 — không proxy qua Next `/api/media`
 * (static file đã serve từ API `UseStaticFiles` / CDN).
 */
export function mediaDisplayUrl(fileUrl: string): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("blob:")) return fileUrl;
  return resolveStoredFileUrl(fileUrl);
}
