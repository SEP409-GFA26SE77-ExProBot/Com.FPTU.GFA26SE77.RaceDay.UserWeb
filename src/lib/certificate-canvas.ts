export const CERTIFICATE_WIDTH = 2400;
export const CERTIFICATE_HEIGHT = 1697;

export interface CertificateDetails {
  runnerName: string;
  eventName: string;
  bib: string;
  distance: string;
  raceDate: string;
  status: string;
  registrationId: string;
  finishTime: string;
  pace: string;
}

/** Measure every line, including long unbroken names, without clipping or losing characters. */
function wrapText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of value.trim().split(/\s+/u)) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    for (const character of Array.from(word)) {
      if (line && ctx.measureText(line + character).width > maxWidth) {
        lines.push(line);
        line = "";
      }
      line += character;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawParticipationCertificate(canvas: HTMLCanvasElement, details: CertificateDetails, fontFamily: string): void {
  canvas.width = CERTIFICATE_WIDTH;
  canvas.height = CERTIFICATE_HEIGHT;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Trình duyệt chưa hỗ trợ tạo chứng nhận. Vui lòng thử bằng Chrome hoặc Edge.");

  const ink = "#192333";
  const muted = "#625e58";
  const orange = "#c2410c";
  const text = (value: string, x: number, y: number, size: number, weight = 400, color = ink, align: CanvasTextAlign = "center") => {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
  };
  const fittedText = (value: string, x: number, centerY: number, maxWidth: number, size: number, weight = 700, color = ink) => {
    let lines: string[];
    do {
      ctx.font = `${weight} ${size}px ${fontFamily}`;
      lines = wrapText(ctx, value, maxWidth);
      if (lines.length <= 2 || size <= 12) break;
      size -= 2;
    } while (true);
    const lineHeight = size * 1.35;
    lines.forEach((line, index) => text(line, x, centerY + (index - (lines.length - 1) / 2) * lineHeight, size, weight, color));
  };

  ctx.fillStyle = "#fffcf7";
  ctx.fillRect(0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);
  ctx.strokeStyle = "#dfcdb4";
  ctx.lineWidth = 2;
  ctx.strokeRect(62, 62, 2276, 1573);
  ctx.strokeStyle = "#eee3d4";
  ctx.strokeRect(82, 82, 2236, 1533);

  // Track-inspired accents are part of the certificate artwork, never the site shell.
  ctx.save();
  ctx.beginPath();
  ctx.rect(84, 84, 2232, 1529);
  ctx.clip();
  [0, 26, 52, 78].forEach((offset) => {
    ctx.beginPath();
    ctx.arc(2310, 90, 240 + offset, 0, Math.PI * 2);
    ctx.strokeStyle = offset === 0 ? "#f97316" : "#f3d2ad";
    ctx.lineWidth = offset === 0 ? 18 : 3;
    ctx.stroke();
  });
  ctx.fillStyle = orange;
  ctx.beginPath();
  ctx.moveTo(84, 1430);
  ctx.lineTo(260, 1613);
  ctx.lineTo(84, 1613);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // RaceDay's existing flag mark, drawn locally so exports need no remote images.
  ctx.fillStyle = orange;
  ctx.fillRect(172, 157, 78, 78);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(196, 214);
  ctx.lineTo(196, 176);
  ctx.lineTo(218, 182);
  ctx.lineTo(230, 178);
  ctx.lineTo(230, 199);
  ctx.lineTo(216, 203);
  ctx.lineTo(196, 197);
  ctx.stroke();
  text("RaceDay", 274, 215, 64, 800, orange, "left");
  text("MỖI BƯỚC CHẠY, MỘT DẤU ẤN", 174, 280, 21, 600, muted, "left");
  text("PARTICIPATION CERTIFICATE", 1200, 400, 27, 600, orange);
  text("CHỨNG NHẬN THAM GIA", 1200, 512, 88, 800);
  text("Trân trọng ghi nhận", 1200, 606, 29, 400, muted);
  fittedText(details.runnerName, 1200, 710, 1860, 94, 700);

  ctx.strokeStyle = "#ddc7aa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(910, 802);
  ctx.lineTo(1490, 802);
  ctx.stroke();
  text("đã hoàn thành cự ly đăng ký tại giải chạy", 1200, 875, 29, 400, muted);
  fittedText(details.eventName, 1200, 980, 1850, 54, 700, orange);

  ctx.fillStyle = "#f6efe5";
  ctx.fillRect(210, 1115, 1980, 211);
  const fields = [
    { label: "SỐ BIB", value: details.bib },
    { label: "CỰ LY ĐĂNG KÝ", value: details.distance },
    { label: "NGÀY THI ĐẤU", value: details.raceDate },
  ];
  fields.forEach(({ label, value }, index) => {
    const x = 540 + index * 660;
    text(label, x, 1176, 22, 600, muted);
    fittedText(value, x, 1252, 570, index === 0 ? 49 : 36, 700);
    if (index < 2) {
      ctx.fillStyle = "#dfd2c1";
      ctx.fillRect(869 + index * 660, 1160, 2, 115);
    }
  });

  text(`Thời gian hoàn thành: ${details.finishTime} · ${details.status}`, 1200, 1415, 26, 600);
  text(`Pace trung bình: ${details.pace} phút/km`, 1200, 1455, 26, 600);
  text("Dựa trên kết quả hoàn thành đã ghi nhận. Không thay thế chứng nhận thành tích chính thức của BTC.", 1200, 1500, 23, 400, muted);
  text(`MÃ ĐĂNG KÝ: ${details.registrationId}`, 320, 1562, 20, 500, muted, "left");
  text("RACEDAY · VIỆT NAM", 2190, 1562, 20, 700, orange, "right");
}
