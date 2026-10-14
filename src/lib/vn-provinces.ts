/**
 * 34 tỉnh/thành sau sáp nhập (Nghị quyết 202/2025/QH15, hiệu lực từ 12/6/2025).
 * Filter public dùng list này — không dùng bản 63 tỉnh trước sáp nhập.
 *
 * `aliases` gồm tên mới + tên tỉnh cũ / địa danh phổ biến để match `event.location`
 * (organizer vẫn có thể ghi “Quy Nhơn, Bình Định”, “Vũng Tàu”,…).
 */

export type VnProvince = {
  key: string;
  label: string;
  aliases: string[];
};

/** Đúng 34 ĐVHC cấp tỉnh (6 TP + 28 tỉnh). */
export const VN_PROVINCES: VnProvince[] = [
  // —— 6 thành phố ——
  {
    key: "ha-noi",
    label: "Hà Nội",
    aliases: ["hà nội", "ha noi", "hanoi", "hoàn kiếm", "hoan kiem"],
  },
  {
    key: "hai-phong",
    label: "Hải Phòng",
    aliases: ["hải phòng", "hai phong", "hải dương", "hai duong"], // + Hải Dương
  },
  {
    key: "hue",
    label: "Huế",
    aliases: ["huế", "hue", "thừa thiên", "thua thien"],
  },
  {
    key: "da-nang",
    label: "Đà Nẵng",
    aliases: [
      "đà nẵng",
      "da nang",
      "danang",
      "quảng nam",
      "quang nam",
      "hội an",
      "hoi an",
      "tam kỳ",
      "tam ky",
    ], // + Quảng Nam
  },
  {
    key: "tp-hcm",
    label: "TP. Hồ Chí Minh",
    aliases: [
      "tp.hcm",
      "tp hcm",
      "tphcm",
      "hcm",
      "hồ chí minh",
      "ho chi minh",
      "sài gòn",
      "sai gon",
      "thủ đức",
      "thu duc",
      "bình dương",
      "binh duong",
      "bà rịa",
      "ba ria",
      "vũng tàu",
      "vung tau",
    ], // + Bình Dương, BR-VT
  },
  {
    key: "can-tho",
    label: "Cần Thơ",
    aliases: [
      "cần thơ",
      "can tho",
      "sóc trăng",
      "soc trang",
      "hậu giang",
      "hau giang",
    ], // + Sóc Trăng, Hậu Giang
  },

  // —— 28 tỉnh ——
  {
    key: "an-giang",
    label: "An Giang",
    aliases: ["an giang", "kiên giang", "kien giang", "phú quốc", "phu quoc"], // + Kiên Giang
  },
  {
    key: "bac-ninh",
    label: "Bắc Ninh",
    aliases: ["bắc ninh", "bac ninh", "bắc giang", "bac giang"], // + Bắc Giang
  },
  {
    key: "ca-mau",
    label: "Cà Mau",
    aliases: ["cà mau", "ca mau", "bạc liêu", "bac lieu"], // + Bạc Liêu
  },
  {
    key: "cao-bang",
    label: "Cao Bằng",
    aliases: ["cao bằng", "cao bang"],
  },
  {
    key: "dak-lak",
    label: "Đắk Lắk",
    aliases: [
      "đắk lắk",
      "dak lak",
      "đăk lăk",
      "buôn ma thuột",
      "buon ma thuot",
      "phú yên",
      "phu yen",
    ], // + Phú Yên
  },
  {
    key: "dien-bien",
    label: "Điện Biên",
    aliases: ["điện biên", "dien bien"],
  },
  {
    key: "dong-nai",
    label: "Đồng Nai",
    aliases: [
      "đồng nai",
      "dong nai",
      "biên hòa",
      "bien hoa",
      "bình phước",
      "binh phuoc",
    ], // + Bình Phước
  },
  {
    key: "dong-thap",
    label: "Đồng Tháp",
    aliases: [
      "đồng tháp",
      "dong thap",
      "tiền giang",
      "tien giang",
      "mỹ tho",
      "my tho",
    ], // + Tiền Giang
  },
  {
    key: "gia-lai",
    label: "Gia Lai",
    aliases: [
      "gia lai",
      "pleiku",
      "bình định",
      "binh dinh",
      "quy nhơn",
      "quy nhon",
    ], // + Bình Định
  },
  {
    key: "ha-tinh",
    label: "Hà Tĩnh",
    aliases: ["hà tĩnh", "ha tinh"],
  },
  {
    key: "hung-yen",
    label: "Hưng Yên",
    aliases: ["hưng yên", "hung yen", "thái bình", "thai binh"], // + Thái Bình
  },
  {
    key: "khanh-hoa",
    label: "Khánh Hòa",
    aliases: [
      "khánh hòa",
      "khanh hoa",
      "nha trang",
      "cam ranh",
      "ninh thuận",
      "ninh thuan",
      "phan rang",
    ], // + Ninh Thuận
  },
  {
    key: "lai-chau",
    label: "Lai Châu",
    aliases: ["lai châu", "lai chau"],
  },
  {
    key: "lam-dong",
    label: "Lâm Đồng",
    aliases: [
      "lâm đồng",
      "lam dong",
      "đà lạt",
      "da lat",
      "dalat",
      "đắk nông",
      "dak nong",
      "bình thuận",
      "binh thuan",
      "phan thiết",
      "phan thiet",
    ], // + Đắk Nông, Bình Thuận
  },
  {
    key: "lang-son",
    label: "Lạng Sơn",
    aliases: ["lạng sơn", "lang son"],
  },
  {
    key: "lao-cai",
    label: "Lào Cai",
    aliases: ["lào cai", "lao cai", "sapa", "sa pa", "yên bái", "yen bai"], // + Yên Bái
  },
  {
    key: "nghe-an",
    label: "Nghệ An",
    aliases: ["nghệ an", "nghe an", "vinh"],
  },
  {
    key: "ninh-binh",
    label: "Ninh Bình",
    aliases: [
      "ninh bình",
      "ninh binh",
      "hà nam",
      "ha nam",
      "nam định",
      "nam dinh",
    ], // + Hà Nam, Nam Định
  },
  {
    key: "phu-tho",
    label: "Phú Thọ",
    aliases: [
      "phú thọ",
      "phu tho",
      "việt trì",
      "viet tri",
      "vĩnh phúc",
      "vinh phuc",
      "hòa bình",
      "hoa binh",
    ], // + Vĩnh Phúc, Hòa Bình
  },
  {
    key: "quang-ngai",
    label: "Quảng Ngãi",
    aliases: ["quảng ngãi", "quang ngai", "kon tum", "kontum"], // + Kon Tum
  },
  {
    key: "quang-ninh",
    label: "Quảng Ninh",
    aliases: ["quảng ninh", "quang ninh", "hạ long", "ha long"],
  },
  {
    key: "quang-tri",
    label: "Quảng Trị",
    aliases: [
      "quảng trị",
      "quang tri",
      "quảng bình",
      "quang binh",
      "đồng hới",
      "dong hoi",
    ], // + Quảng Bình
  },
  {
    key: "son-la",
    label: "Sơn La",
    aliases: ["sơn la", "son la"],
  },
  {
    key: "tay-ninh",
    label: "Tây Ninh",
    aliases: ["tây ninh", "tay ninh", "long an"], // + Long An
  },
  {
    key: "thai-nguyen",
    label: "Thái Nguyên",
    aliases: [
      "thái nguyên",
      "thai nguyen",
      "bắc kạn",
      "bac kan",
      "bắc cạn",
    ], // + Bắc Kạn
  },
  {
    key: "thanh-hoa",
    label: "Thanh Hóa",
    aliases: ["thanh hóa", "thanh hoa"],
  },
  {
    key: "tuyen-quang",
    label: "Tuyên Quang",
    aliases: ["tuyên quang", "tuyen quang", "hà giang", "ha giang"], // + Hà Giang
  },
  {
    key: "vinh-long",
    label: "Vĩnh Long",
    aliases: [
      "vĩnh long",
      "vinh long",
      "bến tre",
      "ben tre",
      "trà vinh",
      "tra vinh",
    ], // + Bến Tre, Trà Vinh
  },
];

function norm(s: string): string {
  return (s || "").toLowerCase().normalize("NFC").trim();
}

/** Tỉnh/thành khớp location (ưu tiên alias dài hơn). */
export function matchVnProvince(location: string): VnProvince | null {
  const loc = norm(location);
  if (!loc) return null;

  let best: VnProvince | null = null;
  let bestLen = 0;
  for (const p of VN_PROVINCES) {
    for (const a of p.aliases) {
      if (a.length >= bestLen && loc.includes(a)) {
        best = p;
        bestLen = a.length;
      }
    }
  }
  return best;
}

export function eventMatchesProvince(
  location: string,
  provinceKey: string
): boolean {
  if (provinceKey === "all") return true;
  const matched = matchVnProvince(location);
  return matched?.key === provinceKey;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Ghép địa chỉ chi tiết + tỉnh → 1 string `location` (BE). */
export function composeLocation(
  detail: string,
  provinceKey: string
): string {
  const p = VN_PROVINCES.find((x) => x.key === provinceKey);
  const label = p?.label?.trim() || "";
  const d = (detail || "").trim();
  if (!label && !d) return "";
  if (!label) return d;
  if (!d) return label;
  const dn = norm(d);
  if (dn.includes(norm(label)) || p!.aliases.some((a) => dn.includes(a))) {
    return d;
  }
  return `${d}, ${label}`;
}

/** Tách `location` BE → tỉnh (key) + phần địa chỉ chi tiết. */
export function splitLocation(location: string): {
  provinceKey: string;
  detail: string;
} {
  const raw = (location || "").trim();
  if (!raw) return { provinceKey: "", detail: "" };

  const matched = matchVnProvince(raw);
  if (!matched) return { provinceKey: "", detail: raw };

  let detail = raw;
  const patterns = [matched.label, ...matched.aliases].sort(
    (a, b) => b.length - a.length
  );
  for (const a of patterns) {
    const re = new RegExp(`[,\\-–]?\\s*${escapeRegExp(a)}\\s*$`, "i");
    if (re.test(detail)) {
      detail = detail.replace(re, "").trim().replace(/[,\-–]\s*$/, "").trim();
      break;
    }
  }

  const dn = norm(detail);
  if (
    !dn ||
    dn === norm(matched.label) ||
    matched.aliases.some((a) => dn === a)
  ) {
    return { provinceKey: matched.key, detail: "" };
  }

  return { provinceKey: matched.key, detail };
}
