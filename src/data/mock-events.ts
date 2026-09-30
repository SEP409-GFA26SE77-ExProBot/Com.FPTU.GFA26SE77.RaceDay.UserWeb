export interface EventDistance {
  id: number;
  label: string;
  km: number;
  price: number;
  maxSlots: number;
  registeredSlots: number;
}

export interface RaceEvent {
  id: number;
  title: string;
  slug: string;
  description: string;
  location: string;
  city: string;
  date: string; // ISO date string
  endDate?: string;
  distances: EventDistance[];
  bannerGradient: string; // CSS gradient for mock banner
  bannerEmoji: string;
  /** Ảnh banner khớp giải — ưu tiên hơn gradient/emoji khi có */
  bannerImage?: string;
  status: "upcoming" | "registration-open" | "sold-out" | "completed";
  registeredCount: number;
  maxParticipants: number;
  organizer: string;
  tags: string[];
}

export const MOCK_EVENTS: RaceEvent[] = [
  {
    id: 1,
    title: "Vietnam Mountain Marathon 2026 — Sapa",
    slug: "vietnam-mountain-marathon-2026",
    description:
      "Trải nghiệm vẻ đẹp ruộng bậc thang Sapa và thử thách marathon núi hàng đầu Đông Nam Á. VĐV đi qua bản làng H'Mông, cầu tre và dãy Hoàng Liên Sơn.",
    location: "Sa Pa, Lào Cai",
    city: "Sa Pa",
    date: "2026-11-15",
    endDate: "2026-11-16",
    distances: [
      { id: 1, label: "10K Chạy vui", km: 10, price: 500000, maxSlots: 500, registeredSlots: 423 },
      { id: 2, label: "21K Bán marathon", km: 21, price: 900000, maxSlots: 800, registeredSlots: 654 },
      { id: 3, label: "42K Marathon", km: 42, price: 1500000, maxSlots: 400, registeredSlots: 312 },
      { id: 4, label: "70K Ultra Trail", km: 70, price: 2500000, maxSlots: 200, registeredSlots: 187 },
    ],
    bannerGradient: "linear-gradient(135deg, #1a5276 0%, #2e86c1 40%, #48c9b0 100%)",
    bannerEmoji: "🏔️",
    bannerImage: "/events/vietnam-mountain-marathon-2026.jpg",
    status: "registration-open",
    registeredCount: 1576,
    maxParticipants: 1900,
    organizer: "Vietnam Trail Series",
    tags: ["Trail", "Núi", "Ultra"],
  },
  {
    id: 2,
    title: "Marathon TP. Hồ Chí Minh 2026",
    slug: "hcmc-marathon-2026",
    description:
      "Chạy xuyên những cung đường sôi động của TP. Hồ Chí Minh. Từ Nhà thờ Đức Bà đến Landmark 81, cảm nhận nhịp sống đô thị dọc sông Sài Gòn và các quận trung tâm.",
    location: "Quận 1, TP. Hồ Chí Minh",
    city: "TP. Hồ Chí Minh",
    date: "2026-12-08",
    distances: [
      { id: 5, label: "5K Chạy vui", km: 5, price: 350000, maxSlots: 2000, registeredSlots: 1876 },
      { id: 6, label: "10K", km: 10, price: 600000, maxSlots: 1500, registeredSlots: 1234 },
      { id: 7, label: "21K Bán marathon", km: 21, price: 1000000, maxSlots: 1000, registeredSlots: 890 },
      { id: 8, label: "42K Marathon", km: 42, price: 1800000, maxSlots: 500, registeredSlots: 445 },
    ],
    bannerGradient: "linear-gradient(135deg, #e74c3c 0%, #f39c12 50%, #f1c40f 100%)",
    bannerEmoji: "🏙️",
    bannerImage: "/events/hcmc-marathon-2026.jpg",
    status: "registration-open",
    registeredCount: 4445,
    maxParticipants: 5000,
    organizer: "Sunrise Events Việt Nam",
    tags: ["Đường phố", "Đô thị", "Marathon"],
  },
  {
    id: 3,
    title: "Marathon Quốc tế Đà Nẵng 2026",
    slug: "danang-international-marathon-2026",
    description:
      "Chạy dọc bờ biển Mỹ Khê, qua Cầu Rồng và Ngũ Hành Sơn. Giải quốc tế tôn vinh vẻ đẹp miền Trung Việt Nam.",
    location: "Biển Mỹ Khê, Đà Nẵng",
    city: "Đà Nẵng",
    date: "2026-10-20",
    distances: [
      { id: 9, label: "5K Chạy vui", km: 5, price: 300000, maxSlots: 1500, registeredSlots: 1500 },
      { id: 10, label: "10K", km: 10, price: 550000, maxSlots: 1200, registeredSlots: 1200 },
      { id: 11, label: "21K Bán marathon", km: 21, price: 950000, maxSlots: 800, registeredSlots: 800 },
      { id: 12, label: "42K Marathon", km: 42, price: 1600000, maxSlots: 400, registeredSlots: 400 },
    ],
    bannerGradient: "linear-gradient(135deg, #0984e3 0%, #00cec9 50%, #55efc4 100%)",
    bannerEmoji: "🌊",
    bannerImage: "/events/danang-international-marathon-2026.jpg",
    status: "sold-out",
    registeredCount: 3900,
    maxParticipants: 3900,
    organizer: "Manulife Marathon Đà Nẵng",
    tags: ["Đường phố", "Ven biển", "Quốc tế"],
  },
  {
    id: 4,
    title: "Chạy Di sản Hà Nội 2026",
    slug: "hanoi-heritage-run-2026",
    description:
      "Khám phá Thủ đô nghìn năm tuổi qua phố cổ, Hồ Hoàn Kiếm và Văn Miếu. Giải chạy đậm chất văn hóa Hà Nội.",
    location: "Quận Hoàn Kiếm, Hà Nội",
    city: "Hà Nội",
    date: "2026-10-05",
    distances: [
      { id: 13, label: "5K Di sản", km: 5, price: 250000, maxSlots: 1000, registeredSlots: 678 },
      { id: 14, label: "10K Khám phá", km: 10, price: 500000, maxSlots: 800, registeredSlots: 534 },
      { id: 15, label: "21K Bán marathon", km: 21, price: 850000, maxSlots: 600, registeredSlots: 412 },
    ],
    bannerGradient: "linear-gradient(135deg, #6c3483 0%, #a569bd 50%, #d2b4de 100%)",
    bannerEmoji: "🏛️",
    bannerImage: "/events/hanoi-heritage-run-2026.jpg",
    status: "registration-open",
    registeredCount: 1624,
    maxParticipants: 2400,
    organizer: "CLB Chạy Hà Nội",
    tags: ["Đường phố", "Di sản", "Văn hóa"],
  },
  {
    id: 5,
    title: "Chạy Đảo Phú Quốc 2026",
    slug: "phu-quoc-island-run-2026",
    description:
      "Chạy trên đảo ngọc: rừng nhiệt đới, bãi cát trắng và làng chài. Trải nghiệm chạy bộ đảo độc đáo.",
    location: "Dương Đông, Phú Quốc",
    city: "Phú Quốc",
    date: "2027-01-18",
    distances: [
      { id: 16, label: "5K Biển", km: 5, price: 400000, maxSlots: 600, registeredSlots: 210 },
      { id: 17, label: "10K Đảo", km: 10, price: 700000, maxSlots: 400, registeredSlots: 145 },
      { id: 18, label: "21K Bán marathon", km: 21, price: 1200000, maxSlots: 300, registeredSlots: 98 },
    ],
    bannerGradient: "linear-gradient(135deg, #00b894 0%, #00cec9 50%, #81ecec 100%)",
    bannerEmoji: "🏝️",
    bannerImage: "/events/phu-quoc-island-run-2026.jpg",
    status: "upcoming",
    registeredCount: 453,
    maxParticipants: 1300,
    organizer: "Island Sports Việt Nam",
    tags: ["Đường phố", "Đảo", "Biển"],
  },
  {
    id: 6,
    title: "Đà Lạt Ultra Trail 2026",
    slug: "dalat-ultra-trail-2026",
    description:
      "Thử thách cao nguyên Đà Lạt: rừng thông, hồ nước và đồi núi trên 1.500m. Dành cho tín đồ trail.",
    location: "Hồ Xuân Hương, Đà Lạt",
    city: "Đà Lạt",
    date: "2026-12-22",
    distances: [
      { id: 19, label: "15K Trail", km: 15, price: 700000, maxSlots: 300, registeredSlots: 234 },
      { id: 20, label: "25K Trail", km: 25, price: 1100000, maxSlots: 250, registeredSlots: 198 },
      { id: 21, label: "55K Ultra", km: 55, price: 2200000, maxSlots: 150, registeredSlots: 112 },
      { id: 22, label: "100K Ultra", km: 100, price: 3500000, maxSlots: 80, registeredSlots: 67 },
    ],
    bannerGradient: "linear-gradient(135deg, #2d3436 0%, #636e72 40%, #b2bec3 100%)",
    bannerEmoji: "🌲",
    bannerImage: "/events/dalat-ultra-trail-2026.jpg",
    status: "registration-open",
    registeredCount: 611,
    maxParticipants: 780,
    organizer: "BTC Đà Lạt Ultra Trail",
    tags: ["Trail", "Ultra", "Cao nguyên"],
  },
  {
    id: 7,
    title: "Chạy đêm Kinh thành Huế",
    slug: "hue-night-run-2026",
    description:
      "Trải nghiệm Kinh thành Huế lung linh về đêm. Cung đường chạy qua di sản UNESCO, dọc sông Hương và tường thành cổ dưới bầu trời đầy sao.",
    location: "Kinh thành Huế",
    city: "Huế",
    date: "2026-11-28",
    distances: [
      { id: 23, label: "5K Chạy đêm", km: 5, price: 300000, maxSlots: 800, registeredSlots: 567 },
      { id: 24, label: "10K Ánh trăng", km: 10, price: 550000, maxSlots: 600, registeredSlots: 423 },
    ],
    bannerGradient: "linear-gradient(135deg, #2c3e50 0%, #3498db 50%, #9b59b6 100%)",
    bannerEmoji: "🌙",
    bannerImage: "/events/hue-night-run-2026.jpg",
    status: "registration-open",
    registeredCount: 990,
    maxParticipants: 1400,
    organizer: "Hiệp hội Chạy Huế",
    tags: ["Đường phố", "Chạy đêm", "Di sản"],
  },
  {
    id: 8,
    title: "Marathon Vịnh Nha Trang",
    slug: "nha-trang-bay-marathon-2027",
    description:
      "Chạy dọc bờ biển Nha Trang với tầm nhìn vịnh xanh. Xuất phát lúc bình minh, tận hưởng gió biển mát khi chinh phục marathon ven biển.",
    location: "Biển Trần Phú, Nha Trang",
    city: "Nha Trang",
    date: "2027-02-14",
    distances: [
      { id: 25, label: "5K Bình minh", km: 5, price: 350000, maxSlots: 1000, registeredSlots: 312 },
      { id: 26, label: "10K Ven biển", km: 10, price: 600000, maxSlots: 700, registeredSlots: 234 },
      { id: 27, label: "21K Bán marathon", km: 21, price: 1000000, maxSlots: 500, registeredSlots: 178 },
      { id: 28, label: "42K Marathon", km: 42, price: 1700000, maxSlots: 300, registeredSlots: 89 },
    ],
    bannerGradient: "linear-gradient(135deg, #e17055 0%, #fdcb6e 50%, #ffeaa7 100%)",
    bannerEmoji: "☀️",
    bannerImage: "/events/nha-trang-bay-marathon-2027.jpg",
    status: "upcoming",
    registeredCount: 813,
    maxParticipants: 2500,
    organizer: "VnExpress Marathon",
    tags: ["Đường phố", "Ven biển", "Bình minh"],
  },
  {
    id: 9,
    title: "Thử thách Đồng bằng sông Cửu Long",
    slug: "mekong-delta-challenge-2027",
    description:
      "Khám phá kênh rạch và cảnh quan Đồng bằng sông Cửu Long. Qua cầu kênh, chạy giữa vườn trái cây và cảm nhận sự hiếu khách miền Tây.",
    location: "TP. Cần Thơ",
    city: "Cần Thơ",
    date: "2027-03-08",
    distances: [
      { id: 29, label: "5K Khám phá", km: 5, price: 250000, maxSlots: 500, registeredSlots: 87 },
      { id: 30, label: "10K Khám phá", km: 10, price: 450000, maxSlots: 400, registeredSlots: 56 },
      { id: 31, label: "21K Thử thách", km: 21, price: 800000, maxSlots: 250, registeredSlots: 34 },
    ],
    bannerGradient: "linear-gradient(135deg, #27ae60 0%, #2ecc71 50%, #a3cb38 100%)",
    bannerEmoji: "🌴",
    bannerImage: "/events/mekong-delta-challenge-2027.jpg",
    status: "upcoming",
    registeredCount: 177,
    maxParticipants: 1150,
    organizer: "Mekong Sports",
    tags: ["Đường phố", "Nông thôn", "Thử thách"],
  },
  {
    id: 10,
    title: "Trail Đèo Hải Vân",
    slug: "hai-van-pass-trail-2026",
    description:
      "Chinh phục Đèo Hải Vân huyền thoại! Trail thử thách qua đèo giữa Huế và Đà Nẵng với tầm nhìn biển và địa hình rừng rậm.",
    location: "Đèo Hải Vân, Thừa Thiên Huế",
    city: "Huế – Đà Nẵng",
    date: "2026-11-01",
    distances: [
      { id: 32, label: "15K Trail", km: 15, price: 800000, maxSlots: 200, registeredSlots: 178 },
      { id: 33, label: "30K Trail núi", km: 30, price: 1400000, maxSlots: 150, registeredSlots: 132 },
    ],
    bannerGradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #74b9ff 100%)",
    bannerEmoji: "⛰️",
    bannerImage: "/events/hai-van-pass-trail-2026.jpg",
    status: "registration-open",
    registeredCount: 310,
    maxParticipants: 350,
    organizer: "Central Trail Việt Nam",
    tags: ["Trail", "Núi", "Phong cảnh"],
  },
  {
    id: 11,
    title: "Saigon Color Run 2026",
    slug: "saigon-color-run-2026",
    description:
      "Giải chạy đầy màu sắc nhất Việt Nam! Tham gia cùng hàng nghìn runner trong 5K Color Run vui vẻ trên phố Sài Gòn — bột màu rực rỡ mỗi kilomet.",
    location: "Phú Mỹ Hưng, Quận 7, TP.HCM",
    city: "TP. Hồ Chí Minh",
    date: "2026-10-12",
    distances: [
      { id: 34, label: "5K Color Run", km: 5, price: 450000, maxSlots: 3000, registeredSlots: 2890 },
    ],
    bannerGradient: "linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%)",
    bannerEmoji: "🎨",
    bannerImage: "/events/saigon-color-run-2026.jpg",
    status: "registration-open",
    registeredCount: 2890,
    maxParticipants: 3000,
    organizer: "Saigon Chạy vui",
    tags: ["Chạy vui", "Màu sắc", "Lễ hội"],
  },
  {
    id: 12,
    title: "Chạy biển Quy Nhơn",
    slug: "quy-nhon-beach-run-2027",
    description:
      "Khám phá Quy Nhơn qua bãi biển và đường ven biển. Giải chạy biển mang trải nghiệm gần gũi tại điểm đến đang lên ngôi của Việt Nam.",
    location: "Biển Quy Nhơn, Bình Định",
    city: "Quy Nhơn",
    date: "2027-04-05",
    distances: [
      { id: 35, label: "5K Chạy biển", km: 5, price: 300000, maxSlots: 400, registeredSlots: 45 },
      { id: 36, label: "10K Ven biển", km: 10, price: 500000, maxSlots: 300, registeredSlots: 32 },
      { id: 37, label: "21K Bán marathon", km: 21, price: 900000, maxSlots: 200, registeredSlots: 18 },
    ],
    bannerGradient: "linear-gradient(135deg, #0abde3 0%, #10ac84 50%, #01a3a4 100%)",
    bannerEmoji: "🐚",
    bannerImage: "/events/quy-nhon-beach-run-2027.jpg",
    status: "upcoming",
    registeredCount: 95,
    maxParticipants: 900,
    organizer: "Thể thao Bình Định",
    tags: ["Đường phố", "Biển", "Ven biển"],
  },
  {
    id: 13,
    title: "Trail thách thức đảo Cát Bà",
    slug: "cat-ba-trail-challenge-2026",
    description:
      "Băng qua địa hình đảo Cát Bà — Vịnh Hạ Long. Trail kết hợp đường rừng, karst đá vôi và đường ven biển cho cuộc phiêu lưu đáng nhớ.",
    location: "VQG Cát Bà, Hải Phòng",
    city: "Cát Bà",
    date: "2026-12-01",
    distances: [
      { id: 38, label: "10K Rừng", km: 10, price: 650000, maxSlots: 200, registeredSlots: 156 },
      { id: 39, label: "25K Ultra đảo", km: 25, price: 1300000, maxSlots: 120, registeredSlots: 98 },
    ],
    bannerGradient: "linear-gradient(135deg, #20bf6b 0%, #26de81 40%, #0fb9b1 100%)",
    bannerEmoji: "🦎",
    bannerImage: "/events/cat-ba-trail-challenge-2026.jpg",
    status: "registration-open",
    registeredCount: 254,
    maxParticipants: 320,
    organizer: "Halong Bay Adventures",
    tags: ["Trail", "Đảo", "Rừng"],
  },
  {
    id: 14,
    title: "Chạy đồi cát Mũi Né",
    slug: "mui-ne-sand-dunes-run-2027",
    description:
      "Trải nghiệm độc đáo trên đồi cát đỏ và trắng Mũi Né. Thử thách chạy trên cát với cảnh quan hoang mạc và tầm nhìn biển.",
    location: "Mũi Né, Bình Thuận",
    city: "Mũi Né",
    date: "2027-02-28",
    distances: [
      { id: 40, label: "5K Đồi cát", km: 5, price: 400000, maxSlots: 300, registeredSlots: 67 },
      { id: 41, label: "10K Cát", km: 10, price: 700000, maxSlots: 200, registeredSlots: 43 },
    ],
    bannerGradient: "linear-gradient(135deg, #f9ca24 0%, #f0932b 50%, #eb4d4b 100%)",
    bannerEmoji: "🏜️",
    bannerImage: "/events/mui-ne-sand-dunes-run-2027.jpg",
    status: "upcoming",
    registeredCount: 110,
    maxParticipants: 500,
    organizer: "Desert Run Việt Nam",
    tags: ["Đường phố", "Cát", "Phiêu lưu"],
  },
  {
    id: 15,
    title: "Giải núi Ba Vì",
    slug: "ba-vi-mountain-race-2026",
    description:
      "Tackle the majestic Ba Vi Mountain just outside Hanoi. This challenging mountain race takes runners through national park trails, bamboo forests, and misty peaks rising 1,296 meters above sea level.",
    location: "Ba Vi National Park, Hanoi",
    city: "Hà Nội",
    date: "2026-10-25",
    distances: [
      { id: 42, label: "12K Núi", km: 12, price: 600000, maxSlots: 250, registeredSlots: 213 },
      { id: 43, label: "21K Đỉnh", km: 21, price: 1000000, maxSlots: 150, registeredSlots: 134 },
      { id: 44, label: "42K Đỉnh núi", km: 42, price: 1800000, maxSlots: 80, registeredSlots: 72 },
    ],
    bannerGradient: "linear-gradient(135deg, #2c3e50 0%, #4a6741 40%, #6ab04c 100%)",
    bannerEmoji: "🌿",
    bannerImage: "/events/ba-vi-mountain-race-2026.jpg",
    status: "registration-open",
    registeredCount: 419,
    maxParticipants: 480,
    organizer: "Mountain Runners VN",
    tags: ["Trail", "Núi", "National Park"],
  },
  {
    id: 16,
    title: "Bán marathon biển Vũng Tàu",
    slug: "vung-tau-half-marathon-2027",
    description:
      "Enjoy the coastal charm of Vung Tau in this seaside half marathon. Run along the scenic Back Beach and Front Beach, past the iconic Christ statue, and through charming seaside streets.",
    location: "Back Beach, Vung Tau",
    city: "Vung Tau",
    date: "2027-01-25",
    distances: [
      { id: 45, label: "5K Ven biển", km: 5, price: 280000, maxSlots: 800, registeredSlots: 234 },
      { id: 46, label: "10K Biển", km: 10, price: 500000, maxSlots: 600, registeredSlots: 178 },
      { id: 47, label: "21K Bán marathon", km: 21, price: 900000, maxSlots: 400, registeredSlots: 123 },
    ],
    bannerGradient: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #dfe6e9 100%)",
    bannerEmoji: "⛵",
    bannerImage: "/events/vung-tau-half-marathon-2027.jpg",
    status: "upcoming",
    registeredCount: 535,
    maxParticipants: 1800,
    organizer: "Vung Tau Athletics",
    tags: ["Đường phố", "Seaside", "Phong cảnh"],
  },
  {
    id: 17,
    title: "Marathon đêm Cần Thơ",
    slug: "can-tho-midnight-marathon-2027",
    description:
      "Run under the stars in the heart of the Mekong Delta! This midnight marathon starts at the stroke of midnight and takes you through the illuminated streets of Can Tho, past floating markets, and along riverfront promenades.",
    location: "Ninh Kieu Wharf, Can Tho",
    city: "Cần Thơ",
    date: "2027-03-22",
    distances: [
      { id: 48, label: "5K Nửa đêm", km: 5, price: 300000, maxSlots: 500, registeredSlots: 34 },
      { id: 49, label: "10K Đêm", km: 10, price: 550000, maxSlots: 400, registeredSlots: 23 },
      { id: 50, label: "42K Marathon đêm", km: 42, price: 1500000, maxSlots: 200, registeredSlots: 12 },
    ],
    bannerGradient: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 40%, #3d3d6b 100%)",
    bannerEmoji: "🌃",
    bannerImage: "/events/can-tho-midnight-marathon-2027.jpg",
    status: "upcoming",
    registeredCount: 69,
    maxParticipants: 1100,
    organizer: "Night Run Vietnam",
    tags: ["Đường phố", "Chạy đêm", "Marathon"],
  },
  {
    id: 18,
    title: "Chạy khám phá hang Phong Nha",
    slug: "phong-nha-explorer-run-2026",
    description:
      "An adventure run near the world-famous Phong Nha-Ke Bang caves. Race through lush jungle trails, alongside underground rivers, and past towering limestone karsts in this UNESCO World Heritage setting.",
    location: "Phong Nha, Quang Binh",
    city: "Phong Nha",
    date: "2026-11-08",
    distances: [
      { id: 51, label: "10K Khám phá", km: 10, price: 650000, maxSlots: 250, registeredSlots: 189 },
      { id: 52, label: "21K Hang động", km: 21, price: 1100000, maxSlots: 180, registeredSlots: 145 },
    ],
    bannerGradient: "linear-gradient(135deg, #2d3436 0%, #636e72 50%, #b8e994 100%)",
    bannerEmoji: "🦇",
    bannerImage: "/events/phong-nha-explorer-run-2026.jpg",
    status: "registration-open",
    registeredCount: 334,
    maxParticipants: 430,
    organizer: "Quang Binh Adventure Sports",
    tags: ["Trail", "Cave", "Phiêu lưu"],
  },
  {
    id: 19,
    title: "Marathon di sản Ninh Bình",
    slug: "ninh-binh-heritage-marathon-2026",
    description:
      "Run through the breathtaking landscapes of Ninh Binh - the 'Ha Long Bay on land'. This marathon showcases limestone karsts, ancient temples, and vast rice paddies that have been featured in Hollywood blockbusters.",
    location: "Trang An, Ninh Binh",
    city: "Ninh Binh",
    date: "2026-12-15",
    distances: [
      { id: 53, label: "5K Di sản", km: 5, price: 300000, maxSlots: 600, registeredSlots: 234 },
      { id: 54, label: "10K Karst", km: 10, price: 550000, maxSlots: 400, registeredSlots: 189 },
      { id: 55, label: "21K Bán marathon", km: 21, price: 950000, maxSlots: 300, registeredSlots: 156 },
      { id: 56, label: "42K Marathon", km: 42, price: 1600000, maxSlots: 200, registeredSlots: 123 },
    ],
    bannerGradient: "linear-gradient(135deg, #44bd32 0%, #4cd137 40%, #c4e538 100%)",
    bannerEmoji: "🐉",
    bannerImage: "/events/ninh-binh-heritage-marathon-2026.jpg",
    status: "registration-open",
    registeredCount: 702,
    maxParticipants: 1500,
    organizer: "Heritage Runners Việt Nam",
    tags: ["Đường phố", "Di sản", "Phong cảnh"],
  },
  {
    id: 20,
    title: "Trail mùa đông Sa Pa",
    slug: "sapa-winter-trail-2027",
    description:
      "Brave the winter chill of Sapa in this exciting trail run. Run through frosted rice terraces, misty mountain passes, and traditional Hmong villages in the cool winter air of northern Vietnam.",
    location: "Sapa Town, Lao Cai",
    city: "Sapa",
    date: "2027-01-10",
    distances: [
      { id: 57, label: "10K Lạnh", km: 10, price: 550000, maxSlots: 300, registeredSlots: 78 },
      { id: 58, label: "25K Trail đông", km: 25, price: 1200000, maxSlots: 200, registeredSlots: 45 },
      { id: 59, label: "50K Ultra lạnh", km: 50, price: 2000000, maxSlots: 100, registeredSlots: 23 },
    ],
    bannerGradient: "linear-gradient(135deg, #dfe6e9 0%, #b2bec3 40%, #636e72 100%)",
    bannerEmoji: "❄️",
    bannerImage: "/events/sapa-winter-trail-2027.jpg",
    status: "upcoming",
    registeredCount: 146,
    maxParticipants: 600,
    organizer: "Vietnam Trail Series",
    tags: ["Trail", "Núi", "Winter"],
  },
  {
    id: 21,
    title: "Chạy đèn lồng Hội An",
    slug: "hoi-an-lantern-run-2026",
    description:
      "Run under the enchanting glow of Hoi An's famous lanterns! This magical evening run takes you through the UNESCO Ancient Town, across the Japanese Covered Bridge, and along the Thu Bon River decorated with thousands of colorful lanterns.",
    location: "Ancient Town, Hoi An",
    city: "Hoi An",
    date: "2026-11-22",
    distances: [
      { id: 60, label: "5K Đèn lồng", km: 5, price: 350000, maxSlots: 500, registeredSlots: 389 },
      { id: 61, label: "10K Ánh trăng", km: 10, price: 600000, maxSlots: 400, registeredSlots: 312 },
    ],
    bannerGradient: "linear-gradient(135deg, #fdcb6e 0%, #e17055 40%, #d63031 100%)",
    bannerEmoji: "🏮",
    bannerImage: "/events/hoi-an-lantern-run-2026.jpg",
    status: "registration-open",
    registeredCount: 701,
    maxParticipants: 900,
    organizer: "Hoi An Sports Tourism",
    tags: ["Đường phố", "Chạy đêm", "Văn hóa"],
  },
  {
    id: 22,
    title: "Ultra đảo Côn Đảo",
    slug: "con-dao-island-ultra-2027",
    description:
      "Take on the ultimate island ultra challenge in Con Dao. This remote archipelago offers pristine nature, challenging terrain, and a deeply meaningful running experience on this historically significant island.",
    location: "Con Dao National Park",
    city: "Con Dao",
    date: "2027-04-19",
    distances: [
      { id: 62, label: "10K Vòng đảo", km: 10, price: 700000, maxSlots: 150, registeredSlots: 23 },
      { id: 63, label: "30K Ultra ven biển", km: 30, price: 1500000, maxSlots: 100, registeredSlots: 12 },
      { id: 64, label: "60K Ultra đảo", km: 60, price: 2800000, maxSlots: 50, registeredSlots: 8 },
    ],
    bannerGradient: "linear-gradient(135deg, #0984e3 0%, #00b894 50%, #55efc4 100%)",
    bannerEmoji: "🐢",
    bannerImage: "/events/con-dao-island-ultra-2027.jpg",
    status: "upcoming",
    registeredCount: 43,
    maxParticipants: 300,
    organizer: "Offshore Racing Vietnam",
    tags: ["Trail", "Đảo", "Ultra"],
  },
  {
    id: 23,
    title: "Sky Race Lang Biang",
    slug: "lang-biang-sky-race-2026",
    description:
      "Reach for the sky in this vertical race up Lang Biang Peak, the highest point of the Dalat Plateau at 2,167m. This intense mountain race rewards finishers with 360-degree panoramic views of the Central Highlands.",
    location: "Lang Biang Peak, Lac Duong",
    city: "Da Lat",
    date: "2026-12-06",
    distances: [
      { id: 65, label: "10K Leo dốc", km: 10, price: 750000, maxSlots: 200, registeredSlots: 167 },
      { id: 66, label: "21K Sky Run", km: 21, price: 1300000, maxSlots: 120, registeredSlots: 98 },
    ],
    bannerGradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ee5a24 100%)",
    bannerEmoji: "🦅",
    bannerImage: "/events/lang-biang-sky-race-2026.jpg",
    status: "registration-open",
    registeredCount: 265,
    maxParticipants: 320,
    organizer: "Highland Trail Runners",
    tags: ["Trail", "Vertical", "Sky Race"],
  },
  {
    id: 24,
    title: "Bán marathon ven sông Sài Gòn",
    slug: "saigon-riverside-half-2027",
    description:
      "Run along the scenic Saigon River from Thu Thiem to District 2, enjoying views of the city skyline and modern waterfront developments. This fast and flat course is perfect for personal bests!",
    location: "Thu Thiem, Thu Duc City",
    city: "TP. Hồ Chí Minh",
    date: "2027-03-15",
    distances: [
      { id: 67, label: "5K Chạy vui", km: 5, price: 300000, maxSlots: 1500, registeredSlots: 45 },
      { id: 68, label: "10K Ven sông", km: 10, price: 550000, maxSlots: 1000, registeredSlots: 23 },
      { id: 69, label: "21K Bán marathon", km: 21, price: 950000, maxSlots: 600, registeredSlots: 12 },
    ],
    bannerGradient: "linear-gradient(135deg, #e55039 0%, #eb2f06 40%, #b71540 100%)",
    bannerEmoji: "🌅",
    bannerImage: "/events/saigon-riverside-half-2027.jpg",
    status: "upcoming",
    registeredCount: 80,
    maxParticipants: 3100,
    organizer: "Techcombank Running",
    tags: ["Đường phố", "Đô thị", "Đường phẳng"],
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getStatusLabel(status: RaceEvent["status"]): string {
  switch (status) {
    case "registration-open":
      return "Đang mở đăng ký";
    case "upcoming":
      return "Sắp mở";
    case "sold-out":
      return "Hết slot";
    case "completed":
      return "Đã kết thúc";
  }
}

/** Solid badges — readable on banner photos and light card surfaces */
export function getStatusColor(status: RaceEvent["status"]): string {
  switch (status) {
    case "registration-open":
      return "bg-emerald-600 text-white border-emerald-700/40 shadow-md shadow-black/20";
    case "upcoming":
      return "bg-sky-600 text-white border-sky-700/40 shadow-md shadow-black/20";
    case "sold-out":
      return "bg-red-600 text-white border-red-700/40 shadow-md shadow-black/20";
    case "completed":
      return "bg-zinc-800 text-white border-zinc-900/50 shadow-md shadow-black/25";
  }
}

export interface RaceScheduleItem {
  time: string;
  activity: string;
}

export interface RacePrize {
  category: string;
  reward: string;
}

/** Full race-day detail blocks (rules / guide / prizes / penalties) */
export interface RaceDetails {
  kitPickup: string;
  startTime: string;
  cutOff: string;
  schedule: RaceScheduleItem[];
  rules: string[];
  guidelines: string[];
  prizes: RacePrize[];
  penalties: string[];
}

export function getRaceDetails(event: RaceEvent): RaceDetails {
  const isTrail = event.tags.some((t) =>
    /trail|núi|ultra|cao nguyên|vertical|sky/i.test(t)
  );
  const maxKm = Math.max(...event.distances.map((d) => d.km));

  return {
    kitPickup: `Ngày ${formatDate(event.date).replace(/^[^,]*,\s*/, "")} −1 và sáng race day tại khu vực race village (${event.location}). Mang CCCD/hộ chiếu khớp form đăng ký.`,
    startTime: isTrail
      ? "Wave xuất phát từ 04:30–06:00 tùy cự ly (xem bảng lịch bên dưới)"
      : "Xuất phát chính lúc 05:00; wave fun run / 5K khoảng 05:30–06:00",
    cutOff:
      maxKm >= 70
        ? "Cut-off tổng 16–18 giờ tùy hạng mục ultra; các điểm kiểm soát có giờ đóng riêng."
        : maxKm >= 42
          ? "Cut-off marathon 6 giờ 30 phút; bán marathon 3 giờ 30 phút."
          : "Cut-off theo hạng mục (thường 2–3 giờ với cự ly ngắn).",
    schedule: [
      { time: "Race day −1 · 14:00–20:00", activity: "Nhận BIB / race kit + kiểm tra giấy tờ" },
      { time: "Race day · 03:30", activity: "Mở cổng race village & gửi đồ" },
      { time: "Race day · 04:30–05:00", activity: "Warm-up / vào corral xuất phát" },
      {
        time: "Race day · 05:00+",
        activity: isTrail
          ? "Xuất phát theo wave trail / ultra"
          : "Xuất phát chính thức các hạng mục chính",
      },
      { time: "Sau về đích", activity: "Nhận huy chương finisher + khu vực phục hồi" },
    ],
    rules: [
      "Bắt buộc mang BIB phía trước rõ ràng; không che BIB / chip timing.",
      "Chỉ được chạy đúng hạng mục đã đăng ký; đổi cự ly phải được BTC duyệt trước race day.",
      "Cấm dùng xe đạp, xe máy, scooter hoặc hỗ trợ bên ngoài ngoài trạm cứu hộ chính thức.",
      "Tuân thủ hướng dẫn tình nguyện viên / giám sát viên tại mọi điểm kiểm soát.",
      isTrail
        ? "Không cắt đường (short-cutting). Phải đi qua toàn bộ checkpoint theo thứ tự."
        : "Chạy đúng làn đường được phân làn; không đi ngược chiều.",
      "Người dưới 18 tuổi cần sự đồng ý người giám hộ theo quy định hạng mục.",
    ],
    guidelines: [
      `Địa điểm: ${event.location}. Có mặt sớm ít nhất 60–90 phút trước giờ xuất phát.`,
      "Trang phục & giày phù hợp địa hình; mang theo áo mưa nhẹ nếu thời tiết xấu.",
      isTrail
        ? "Bắt buộc mang theo nước / gel cá nhân với ultra; trạm tiếp nước cách ~5–8 km."
        : "Trạm nước / điện giải dọc cung đường khoảng mỗi 3–5 km.",
      "Gửi đồ miễn phí tại race village — không để vật có giá trị lớn.",
      "Theo dõi thông báo BTC trên RaceDay / fanpage nếu có thay đổi lịch do thời tiết.",
      "Khai báo y tế trung thực; BTC có quyền từ chối VĐV không đủ điều kiện sức khỏe.",
    ],
    prizes: [
      {
        category: "Finisher",
        reward: "Huy chương finisher + e-certificate trên RaceDay (sau khi công bố kết quả)",
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
    penalties: [
      "Không hoàn thành đủ checkpoint → DNF / không được xếp hạng chính thức.",
      "Che BIB cố ý hoặc chuyển BIB cho người khác → hủy kết quả + cấm tham dự giải thuộc hệ thống.",
      "Cắt đường / dùng phương tiện hỗ trợ → DSQ (disqualification).",
      "Ứng xử thiếu tôn trọng BTC / VĐV khác → cảnh cáo hoặc loại khỏi giải.",
      "Không về đích trước cut-off tại điểm kiểm soát → buộc dừng (DNF).",
      "Vi phạm an toàn giao thông nghiêm trọng trên cung đường mở → DSQ ngay lập tức.",
    ],
  };
}

export interface PaginatedResult {
  events: RaceEvent[];
  totalCount: number;
  hasMore: boolean;
  page: number;
}

export async function getEventsByPage(
  page: number,
  pageSize: number = 6
): Promise<PaginatedResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const events = MOCK_EVENTS.slice(start, end);

  return {
    events,
    totalCount: MOCK_EVENTS.length,
    hasMore: end < MOCK_EVENTS.length,
    page,
  };
}

export function getEventById(id: number): RaceEvent | undefined {
  return MOCK_EVENTS.find((e) => e.id === id);
}

export function getFeaturedEvents(): RaceEvent[] {
  const open = MOCK_EVENTS.filter((e) => e.status === "registration-open");
  const rest = MOCK_EVENTS.filter((e) => e.status !== "registration-open");
  return [...open, ...rest].slice(0, 10);
}
