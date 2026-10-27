import api from "@/config/axios";

/**
 * Tải ảnh qua BE proxy (`/photos/{id}/download`) — tránh CORS R2 trên trình duyệt.
 */
export async function downloadPhotoById(
  photoId: string,
  fallbackFileName = "raceday-photo.jpg"
): Promise<void> {
  if (!photoId) throw new Error("Thiếu photoId.");

  const blob = (await api.get(`api/v1/photo/photos/${photoId}/download`, {
    responseType: "blob",
    timeout: 120_000,
  })) as Blob;

  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("Không nhận được file ảnh.");
  }

  // BE trả lỗi JSON nhưng axios blob → detect content-type
  if (blob.type.includes("application/json") || blob.type.includes("text/")) {
    const text = await blob.text();
    let msg = "Tải ảnh thất bại.";
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string; title?: string };
      msg = parsed.error || parsed.message || parsed.title || msg;
    } catch {
      if (text.trim()) msg = text.slice(0, 200);
    }
    throw new Error(msg);
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fallbackFileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
