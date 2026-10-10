import { RaceEventDto } from "@/dto/event.dto";
import { formatDate } from "@/lib/format";

export interface RaceScheduleItem {
  time: string;
  activity: string;
}

export interface RacePrize {
  category: string;
  reward: string;
}

/** Khối chi tiết race-day (giống OLD FE getRaceDetails) — ưu tiên field API, còn thiếu thì fallback hợp lý. */
export interface RaceDetails {
  kitPickup: string;
  startTime: string;
  cutOff: string;
  schedule: RaceScheduleItem[];
  rules: string[];
  guidelines: string[];
  prizes: RacePrize[];
  penalties: string[];
  tags: string[];
}

function asStringList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x : (x as { text?: string })?.text))
      .filter((x): x is string => Boolean(x && String(x).trim()));
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["items", "list", "rules", "guidelines", "penalties"]) {
      if (Array.isArray(o[key])) return asStringList(o[key]);
    }
  }
  return [];
}

function asPrizeList(raw: unknown): RacePrize[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const arr = Array.isArray(o.prizes)
    ? o.prizes
    : Array.isArray(o.items)
      ? o.items
      : Array.isArray(raw)
        ? raw
        : null;
  if (!arr) {
    // rewards.finisherMedal kiểu boolean/seed
    const out: RacePrize[] = [];
    if (o.finisherMedal) {
      out.push({
        category: "Finisher",
        reward: "Huy chương finisher + e-certificate trên RaceDay",
      });
    }
    if (typeof o.topOverall === "string") {
      out.push({ category: "Top overall", reward: o.topOverall });
    }
    return out;
  }
  return arr
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const row = p as Record<string, unknown>;
      const category = String(row.category || row.name || "").trim();
      const reward = String(row.reward || row.description || "").trim();
      if (!category || !reward) return null;
      return { category, reward };
    })
    .filter((x): x is RacePrize => Boolean(x));
}

function asSchedule(raw: unknown): RaceScheduleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (!s || typeof s !== "object") return null;
      const row = s as Record<string, unknown>;
      const time = String(row.time || row.when || "").trim();
      const activity = String(row.activity || row.title || row.description || "").trim();
      if (!time || !activity) return null;
      return { time, activity };
    })
    .filter((x): x is RaceScheduleItem => Boolean(x));
}

function isTrailEvent(event: RaceEventDto): boolean {
  const blob = `${event.name} ${event.tagline || ""} ${event.description || ""}`.toLowerCase();
  return /trail|núi|ultra|cao nguyên|vertical|sky|đồi|mountain/.test(blob);
}

function deriveTags(event: RaceEventDto): string[] {
  const tags = new Set<string>();
  for (const d of event.distances || []) {
    if (d.distanceKm <= 5) tags.add("5K");
    else if (d.distanceKm <= 10) tags.add("10K");
    else if (d.distanceKm <= 21.2) tags.add("Half Marathon");
    else if (d.distanceKm <= 42.3) tags.add("Marathon");
    else tags.add("Ultra");
    if ((d.elevationGainM ?? 0) > 500 || isTrailEvent(event)) tags.add("Trail");
  }
  if (tags.size === 0) tags.add("Road");
  return Array.from(tags);
}

export function getRaceDetails(event: RaceEventDto): RaceDetails {
  const rulesObj = event.rules as Record<string, unknown> | undefined;
  const rewardsObj = event.rewards as Record<string, unknown> | undefined;
  const isTrail = isTrailEvent(event);
  const maxKm = Math.max(0, ...(event.distances || []).map((d) => d.distanceKm));
  const dateLabel = formatDate(event.date).replace(/^[^,]*,\s*/, "");

  const apiRules = asStringList(rulesObj?.items ?? rulesObj?.list ?? rulesObj);
  const apiGuidelines = asStringList(rulesObj?.guidelines ?? rewardsObj?.guidelines);
  const apiPenalties = asStringList(rulesObj?.penalties ?? rewardsObj?.penalties);
  const apiSchedule = asSchedule(rulesObj?.schedule ?? rewardsObj?.schedule);
  const apiPrizes = asPrizeList(rewardsObj);

  const kitPickup =
    (typeof rulesObj?.kitPickup === "string" && rulesObj.kitPickup) ||
    `Ngày ${dateLabel} −1 và sáng race day tại khu vực race village (${event.location}). Mang CCCD/hộ chiếu khớp form đăng ký.`;

  const startTime =
    (typeof rulesObj?.startTimeNote === "string" && rulesObj.startTimeNote) ||
    event.startTime ||
    (isTrail
      ? "Wave xuất phát từ 04:30–06:00 tùy cự ly (xem bảng lịch bên dưới)"
      : "Xuất phát chính lúc 05:00; wave fun run / 5K khoảng 05:30–06:00");

  const cutOff =
    (typeof rulesObj?.cutOff === "string" && rulesObj.cutOff) ||
    (maxKm >= 70
      ? "Cut-off tổng 16–18 giờ tùy hạng mục ultra; các điểm kiểm soát có giờ đóng riêng."
      : maxKm >= 42
        ? "Cut-off marathon 6 giờ 30 phút; bán marathon 3 giờ 30 phút."
        : "Cut-off theo hạng mục (thường 2–3 giờ với cự ly ngắn).");

  return {
    kitPickup,
    startTime,
    cutOff,
    tags: deriveTags(event),
    schedule:
      apiSchedule.length > 0
        ? apiSchedule
        : [
            {
              time: "Race day −1 · 14:00–20:00",
              activity: "Nhận BIB / race kit + kiểm tra giấy tờ",
            },
            { time: "Race day · 03:30", activity: "Mở cổng race village & gửi đồ" },
            { time: "Race day · 04:30–05:00", activity: "Warm-up / vào corral xuất phát" },
            {
              time: "Race day · 05:00+",
              activity: isTrail
                ? "Xuất phát theo wave trail / ultra"
                : "Xuất phát chính thức các hạng mục chính",
            },
            {
              time: "Sau về đích",
              activity: "Nhận huy chương finisher + khu vực phục hồi",
            },
          ],
    rules:
      apiRules.length > 0
        ? apiRules
        : [
            "Bắt buộc mang BIB phía trước rõ ràng; không che BIB / chip timing.",
            "Chỉ được chạy đúng hạng mục đã đăng ký; đổi cự ly phải được BTC duyệt trước race day.",
            "Cấm dùng xe đạp, xe máy, scooter hoặc hỗ trợ bên ngoài ngoài trạm cứu hộ chính thức.",
            "Tuân thủ hướng dẫn tình nguyện viên / giám sát viên tại mọi điểm kiểm soát.",
            isTrail
              ? "Không cắt đường (short-cutting). Phải đi qua toàn bộ checkpoint theo thứ tự."
              : "Chạy đúng làn đường được phân làn; không đi ngược chiều.",
            "Người dưới 18 tuổi cần sự đồng ý người giám hộ theo quy định hạng mục.",
          ],
    guidelines:
      apiGuidelines.length > 0
        ? apiGuidelines
        : [
            `Địa điểm: ${event.location}. Có mặt sớm ít nhất 60–90 phút trước giờ xuất phát.`,
            "Trang phục & giày phù hợp địa hình; mang theo áo mưa nhẹ nếu thời tiết xấu.",
            isTrail
              ? "Bắt buộc mang theo nước / gel cá nhân với ultra; trạm tiếp nước cách ~5–8 km."
              : "Trạm nước / điện giải dọc cung đường khoảng mỗi 3–5 km.",
            "Gửi đồ miễn phí tại race village — không để vật có giá trị lớn.",
            "Theo dõi thông báo BTC trên RaceDay / fanpage nếu có thay đổi lịch do thời tiết.",
            "Khai báo y tế trung thực; BTC có quyền từ chối VĐV không đủ điều kiện sức khỏe.",
          ],
    prizes:
      apiPrizes.length > 0
        ? apiPrizes
        : [
            {
              category: "Finisher",
              reward:
                "Huy chương finisher + e-certificate trên RaceDay (sau khi công bố kết quả)",
            },
            {
              category: "Top 3 overall (nam / nữ)",
              reward: isTrail
                ? "Cúp + tiền thưởng / hiện vật theo công bố BTC (tùy hạng mục trail)"
                : "Cúp + tiền thưởng theo bảng giải thưởng công bố trước race day",
            },
            {
              category: "Top 3 nhóm tuổi",
              reward: "Hiện vật / voucher đối tác (áp dụng các cự ly chính)",
            },
            {
              category: "Race kit",
              reward: "Áo race (size đã chọn) + BIB + chip / QR check-in + phiếu gửi đồ",
            },
          ],
    penalties:
      apiPenalties.length > 0
        ? apiPenalties
        : [
            "Không hoàn thành đủ checkpoint → DNF / không được xếp hạng chính thức.",
            "Che BIB cố ý hoặc chuyển BIB cho người khác → hủy kết quả + cấm tham dự giải thuộc hệ thống.",
            "Cắt đường / dùng phương tiện hỗ trợ → DSQ (disqualification).",
            "Ứng xử thiếu tôn trọng BTC / VĐV khác → cảnh cáo hoặc loại khỏi giải.",
            "Không về đích trước cut-off tại điểm kiểm soát → buộc dừng (DNF).",
            "Vi phạm an toàn giao thông nghiêm trọng trên cung đường mở → DSQ ngay lập tức.",
          ],
  };
}
