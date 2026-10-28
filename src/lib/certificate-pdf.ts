const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

/** Wrap only the certificate canvas JPEG in a single landscape A4 PDF. */
export function createCertificatePdf(jpeg: Uint8Array, width: number, height: number): Uint8Array<ArrayBuffer> {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new Error("Kích thước chứng nhận không hợp lệ.");
  }
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8 || jpeg.at(-2) !== 0xff || jpeg.at(-1) !== 0xd9) {
    throw new Error("Không thể tạo ảnh chứng nhận.");
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const append = (value: string | Uint8Array) => {
    const bytes = typeof value === "string" ? encoder.encode(value) : value;
    chunks.push(bytes);
    length += bytes.byteLength;
  };
  const object = (id: number, content: string) => {
    offsets[id] = length;
    append(`${id} 0 obj\n${content}\nendobj\n`);
  };

  append("%PDF-1.4\n");
  append(new Uint8Array([37, 226, 227, 207, 211, 10]));
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Certificate 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = length;
  append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.byteLength} >>\nstream\n`);
  append(jpeg);
  append("\nendstream\nendobj\n");
  const paint = `q\n${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm\n/Certificate Do\nQ\n`;
  object(5, `<< /Length ${encoder.encode(paint).byteLength} >>\nstream\n${paint}endstream`);

  const xrefOffset = length;
  append("xref\n0 6\n0000000000 65535 f \n");
  for (let id = 1; id <= 5; id++) append(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  const pdf = new Uint8Array(length);
  let position = 0;
  for (const chunk of chunks) {
    pdf.set(chunk, position);
    position += chunk.byteLength;
  }
  return pdf;
}

export function certificateFileName(runnerName: string, identifier: string): string {
  const slug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return `chung-nhan-${slug(runnerName) || "van-dong-vien"}-${slug(identifier) || "raceday"}.pdf`;
}
