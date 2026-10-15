/**
 * Decode QR từ ảnh (file / canvas). Webcam màn↔màn thường fail;
 * ảnh PNG đã tải từ vé decode ổn định hơn.
 */
export async function decodeQrFromBlob(blob: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(blob);
  try {
    const hit = await detectOnSource(bitmap);
    if (hit) return hit;

    // Upscale + tăng tương phản (QR chụp mờ / glare)
    const boosted = boostContrastCanvas(bitmap, 2);
    return await detectOnSource(boosted);
  } finally {
    bitmap.close();
  }
}

async function detectOnSource(
  source: ImageBitmap | HTMLCanvasElement
): Promise<string | null> {
  const Detector =
    typeof window !== "undefined" && "BarcodeDetector" in window
      ? (
          window as unknown as {
            BarcodeDetector: new (opts?: {
              formats?: string[];
            }) => {
              detect: (
                src: ImageBitmap | HTMLCanvasElement
              ) => Promise<{ rawValue?: string }[]>;
            };
          }
        ).BarcodeDetector
      : (
          await import("barcode-detector/ponyfill")
        ).BarcodeDetector;

  const detector = new Detector({ formats: ["qr_code"] });
  const codes = await detector.detect(source);
  const raw = codes?.[0]?.rawValue?.trim();
  return raw || null;
}

function boostContrastCanvas(
  bitmap: ImageBitmap,
  scale: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(bitmap.width * scale));
  canvas.height = Math.max(1, Math.floor(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const v = y > 140 ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
