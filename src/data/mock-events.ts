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
  status: "upcoming" | "registration-open" | "sold-out" | "completed";
  registeredCount: number;
  maxParticipants: number;
  organizer: string;
  tags: string[];
}

export const MOCK_EVENTS: RaceEvent[] = [
  {
    id: 1,
    title: "Vietnam Mountain Marathon 2026",
    slug: "vietnam-mountain-marathon-2026",
    description:
      "Experience the breathtaking beauty of Sapa's terraced rice fields while conquering one of Southeast Asia's most challenging mountain marathons. Runners will traverse through H'Mong villages, cross bamboo bridges, and climb the majestic Hoang Lien Son range. This iconic race has attracted thousands of runners worldwide and offers a truly unforgettable adventure.",
    location: "Sapa, Lao Cai",
    city: "Sapa",
    date: "2026-11-15",
    endDate: "2026-11-16",
    distances: [
      { id: 1, label: "10K Fun Run", km: 10, price: 500000, maxSlots: 500, registeredSlots: 423 },
      { id: 2, label: "21K Half Marathon", km: 21, price: 900000, maxSlots: 800, registeredSlots: 654 },
      { id: 3, label: "42K Full Marathon", km: 42, price: 1500000, maxSlots: 400, registeredSlots: 312 },
      { id: 4, label: "70K Ultra Trail", km: 70, price: 2500000, maxSlots: 200, registeredSlots: 187 },
    ],
    bannerGradient: "linear-gradient(135deg, #1a5276 0%, #2e86c1 40%, #48c9b0 100%)",
    bannerEmoji: "🏔️",
    status: "registration-open",
    registeredCount: 1576,
    maxParticipants: 1900,
    organizer: "Vietnam Trail Series",
    tags: ["Trail", "Mountain", "Ultra"],
  },
  {
    id: 2,
    title: "Ho Chi Minh City Marathon",
    slug: "hcmc-marathon-2026",
    description:
      "Run through the vibrant streets of Ho Chi Minh City in this premier urban marathon. From the historic Notre-Dame Cathedral to the modern Landmark 81, experience the city's dynamic energy as you race along the Saigon River and through iconic districts.",
    location: "District 1, HCMC",
    city: "Ho Chi Minh City",
    date: "2026-12-08",
    distances: [
      { id: 5, label: "5K Fun Run", km: 5, price: 350000, maxSlots: 2000, registeredSlots: 1876 },
      { id: 6, label: "10K", km: 10, price: 600000, maxSlots: 1500, registeredSlots: 1234 },
      { id: 7, label: "21K Half Marathon", km: 21, price: 1000000, maxSlots: 1000, registeredSlots: 890 },
      { id: 8, label: "42K Full Marathon", km: 42, price: 1800000, maxSlots: 500, registeredSlots: 445 },
    ],
    bannerGradient: "linear-gradient(135deg, #e74c3c 0%, #f39c12 50%, #f1c40f 100%)",
    bannerEmoji: "🏙️",
    status: "registration-open",
    registeredCount: 4445,
    maxParticipants: 5000,
    organizer: "Sunrise Events Vietnam",
    tags: ["Road", "City", "Marathon"],
  },
  {
    id: 3,
    title: "Da Nang International Marathon",
    slug: "danang-international-marathon-2026",
    description:
      "Run along the stunning coastline of Da Nang, crossing the iconic Dragon Bridge and Marble Mountains. This internationally acclaimed marathon showcases the best of Central Vietnam's natural beauty and vibrant culture.",
    location: "My Khe Beach, Da Nang",
    city: "Da Nang",
    date: "2026-10-20",
    distances: [
      { id: 9, label: "5K Fun Run", km: 5, price: 300000, maxSlots: 1500, registeredSlots: 1500 },
      { id: 10, label: "10K", km: 10, price: 550000, maxSlots: 1200, registeredSlots: 1200 },
      { id: 11, label: "21K Half Marathon", km: 21, price: 950000, maxSlots: 800, registeredSlots: 800 },
      { id: 12, label: "42K Full Marathon", km: 42, price: 1600000, maxSlots: 400, registeredSlots: 400 },
    ],
    bannerGradient: "linear-gradient(135deg, #0984e3 0%, #00cec9 50%, #55efc4 100%)",
    bannerEmoji: "🌊",
    status: "sold-out",
    registeredCount: 3900,
    maxParticipants: 3900,
    organizer: "Manulife Da Nang Marathon",
    tags: ["Road", "Coastal", "International"],
  },
  {
    id: 4,
    title: "Hanoi Heritage Run",
    slug: "hanoi-heritage-run-2026",
    description:
      "Discover the thousand-year-old capital through its ancient streets and historic landmarks. Run past Hoan Kiem Lake, the Temple of Literature, and the Old Quarter in this culturally rich running event.",
    location: "Hoan Kiem District, Hanoi",
    city: "Hanoi",
    date: "2026-10-05",
    distances: [
      { id: 13, label: "5K Heritage Walk", km: 5, price: 250000, maxSlots: 1000, registeredSlots: 678 },
      { id: 14, label: "10K Discovery", km: 10, price: 500000, maxSlots: 800, registeredSlots: 534 },
      { id: 15, label: "21K Half Marathon", km: 21, price: 850000, maxSlots: 600, registeredSlots: 412 },
    ],
    bannerGradient: "linear-gradient(135deg, #6c3483 0%, #a569bd 50%, #d2b4de 100%)",
    bannerEmoji: "🏛️",
    status: "registration-open",
    registeredCount: 1624,
    maxParticipants: 2400,
    organizer: "Hanoi Running Club",
    tags: ["Road", "Heritage", "Cultural"],
  },
  {
    id: 5,
    title: "Phu Quoc Island Run",
    slug: "phu-quoc-island-run-2026",
    description:
      "Run on the pristine tropical island of Phu Quoc. This unique race takes you through lush forests, along white sand beaches, and past traditional fishing villages for an unforgettable island running experience.",
    location: "Duong Dong, Phu Quoc",
    city: "Phu Quoc",
    date: "2027-01-18",
    distances: [
      { id: 16, label: "5K Beach Run", km: 5, price: 400000, maxSlots: 600, registeredSlots: 210 },
      { id: 17, label: "10K Island Explorer", km: 10, price: 700000, maxSlots: 400, registeredSlots: 145 },
      { id: 18, label: "21K Half Marathon", km: 21, price: 1200000, maxSlots: 300, registeredSlots: 98 },
    ],
    bannerGradient: "linear-gradient(135deg, #00b894 0%, #00cec9 50%, #81ecec 100%)",
    bannerEmoji: "🏝️",
    status: "upcoming",
    registeredCount: 453,
    maxParticipants: 1300,
    organizer: "Island Sports Vietnam",
    tags: ["Road", "Island", "Beach"],
  },
  {
    id: 6,
    title: "Dalat Ultra Trail 2026",
    slug: "dalat-ultra-trail-2026",
    description:
      "Challenge yourself in the cool highlands of Dalat. This ultra trail event takes runners through pine forests, around pristine lakes, and across rolling hills at elevations above 1,500 meters. A must-do for trail running enthusiasts.",
    location: "Xuan Huong Lake, Dalat",
    city: "Da Lat",
    date: "2026-12-22",
    distances: [
      { id: 19, label: "15K Trail", km: 15, price: 700000, maxSlots: 300, registeredSlots: 234 },
      { id: 20, label: "25K Trail", km: 25, price: 1100000, maxSlots: 250, registeredSlots: 198 },
      { id: 21, label: "55K Ultra", km: 55, price: 2200000, maxSlots: 150, registeredSlots: 112 },
      { id: 22, label: "100K Ultra", km: 100, price: 3500000, maxSlots: 80, registeredSlots: 67 },
    ],
    bannerGradient: "linear-gradient(135deg, #2d3436 0%, #636e72 40%, #b2bec3 100%)",
    bannerEmoji: "🌲",
    status: "registration-open",
    registeredCount: 611,
    maxParticipants: 780,
    organizer: "Dalat Ultra Trail Org",
    tags: ["Trail", "Ultra", "Highland"],
  },
  {
    id: 7,
    title: "Hue Imperial City Night Run",
    slug: "hue-night-run-2026",
    description:
      "Experience the magic of Hue's Imperial City illuminated at night. This unique night run takes you through the UNESCO World Heritage Site, along the Perfume River, and past ancient citadel walls under the stars.",
    location: "Imperial Citadel, Hue",
    city: "Hue",
    date: "2026-11-28",
    distances: [
      { id: 23, label: "5K Night Fun Run", km: 5, price: 300000, maxSlots: 800, registeredSlots: 567 },
      { id: 24, label: "10K Moonlight Run", km: 10, price: 550000, maxSlots: 600, registeredSlots: 423 },
    ],
    bannerGradient: "linear-gradient(135deg, #2c3e50 0%, #3498db 50%, #9b59b6 100%)",
    bannerEmoji: "🌙",
    status: "registration-open",
    registeredCount: 990,
    maxParticipants: 1400,
    organizer: "Hue Running Association",
    tags: ["Road", "Night Run", "Heritage"],
  },
  {
    id: 8,
    title: "Nha Trang Bay Marathon",
    slug: "nha-trang-bay-marathon-2027",
    description:
      "Run along the stunning Nha Trang coastline with panoramic views of the turquoise bay. Start at sunrise and enjoy the cool sea breeze as you conquer this scenic coastal marathon.",
    location: "Tran Phu Beach, Nha Trang",
    city: "Nha Trang",
    date: "2027-02-14",
    distances: [
      { id: 25, label: "5K Sunrise Run", km: 5, price: 350000, maxSlots: 1000, registeredSlots: 312 },
      { id: 26, label: "10K Coastal", km: 10, price: 600000, maxSlots: 700, registeredSlots: 234 },
      { id: 27, label: "21K Half Marathon", km: 21, price: 1000000, maxSlots: 500, registeredSlots: 178 },
      { id: 28, label: "42K Full Marathon", km: 42, price: 1700000, maxSlots: 300, registeredSlots: 89 },
    ],
    bannerGradient: "linear-gradient(135deg, #e17055 0%, #fdcb6e 50%, #ffeaa7 100%)",
    bannerEmoji: "☀️",
    status: "upcoming",
    registeredCount: 813,
    maxParticipants: 2500,
    organizer: "VnExpress Marathon",
    tags: ["Road", "Coastal", "Sunrise"],
  },
  {
    id: 9,
    title: "Mekong Delta Challenge",
    slug: "mekong-delta-challenge-2027",
    description:
      "Explore the waterways and lush landscapes of the Mekong Delta in this unique running challenge. Cross bridges over canals, run through tropical orchards, and experience the warmth of southern Vietnam hospitality.",
    location: "Can Tho City",
    city: "Can Tho",
    date: "2027-03-08",
    distances: [
      { id: 29, label: "5K Discovery", km: 5, price: 250000, maxSlots: 500, registeredSlots: 87 },
      { id: 30, label: "10K Explorer", km: 10, price: 450000, maxSlots: 400, registeredSlots: 56 },
      { id: 31, label: "21K Challenge", km: 21, price: 800000, maxSlots: 250, registeredSlots: 34 },
    ],
    bannerGradient: "linear-gradient(135deg, #27ae60 0%, #2ecc71 50%, #a3cb38 100%)",
    bannerEmoji: "🌴",
    status: "upcoming",
    registeredCount: 177,
    maxParticipants: 1150,
    organizer: "Mekong Sports",
    tags: ["Road", "Countryside", "Challenge"],
  },
  {
    id: 10,
    title: "Hai Van Pass Trail Run",
    slug: "hai-van-pass-trail-2026",
    description:
      "Conquer the legendary Hai Van Pass on foot! This challenging trail run takes you over the famous mountain pass between Hue and Da Nang, offering panoramic ocean views and dense jungle terrain.",
    location: "Hai Van Pass, Thua Thien Hue",
    city: "Hue - Da Nang",
    date: "2026-11-01",
    distances: [
      { id: 32, label: "15K Trail", km: 15, price: 800000, maxSlots: 200, registeredSlots: 178 },
      { id: 33, label: "30K Mountain Trail", km: 30, price: 1400000, maxSlots: 150, registeredSlots: 132 },
    ],
    bannerGradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #74b9ff 100%)",
    bannerEmoji: "⛰️",
    status: "registration-open",
    registeredCount: 310,
    maxParticipants: 350,
    organizer: "Central Trail Vietnam",
    tags: ["Trail", "Mountain", "Scenic"],
  },
  {
    id: 11,
    title: "Saigon Color Run 2026",
    slug: "saigon-color-run-2026",
    description:
      "The most colorful running event in Vietnam! Join thousands of runners in this fun, non-competitive 5K color run through the streets of Saigon. Get doused with vibrant colored powder at every kilometer!",
    location: "Phu My Hung, District 7, HCMC",
    city: "Ho Chi Minh City",
    date: "2026-10-12",
    distances: [
      { id: 34, label: "5K Color Run", km: 5, price: 450000, maxSlots: 3000, registeredSlots: 2890 },
    ],
    bannerGradient: "linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%)",
    bannerEmoji: "🎨",
    status: "registration-open",
    registeredCount: 2890,
    maxParticipants: 3000,
    organizer: "Saigon Fun Run",
    tags: ["Fun Run", "Color", "Festival"],
  },
  {
    id: 12,
    title: "Quy Nhon Beach Run",
    slug: "quy-nhon-beach-run-2027",
    description:
      "Discover the hidden gem of Quy Nhon through its pristine beaches and coastal roads. This scenic beach run offers an intimate racing experience in one of Vietnam's most beautiful emerging destinations.",
    location: "Quy Nhon Beach, Binh Dinh",
    city: "Quy Nhon",
    date: "2027-04-05",
    distances: [
      { id: 35, label: "5K Beach Jog", km: 5, price: 300000, maxSlots: 400, registeredSlots: 45 },
      { id: 36, label: "10K Coastal", km: 10, price: 500000, maxSlots: 300, registeredSlots: 32 },
      { id: 37, label: "21K Half Marathon", km: 21, price: 900000, maxSlots: 200, registeredSlots: 18 },
    ],
    bannerGradient: "linear-gradient(135deg, #0abde3 0%, #10ac84 50%, #01a3a4 100%)",
    bannerEmoji: "🐚",
    status: "upcoming",
    registeredCount: 95,
    maxParticipants: 900,
    organizer: "Binh Dinh Sports",
    tags: ["Road", "Beach", "Coastal"],
  },
  {
    id: 13,
    title: "Cat Ba Island Trail Challenge",
    slug: "cat-ba-trail-challenge-2026",
    description:
      "Navigate the rugged terrain of Cat Ba Island in Halong Bay. This trail challenge combines jungle paths, limestone karst landscapes, and coastal trails for an epic adventure run.",
    location: "Cat Ba National Park, Hai Phong",
    city: "Cat Ba",
    date: "2026-12-01",
    distances: [
      { id: 38, label: "10K Jungle Trail", km: 10, price: 650000, maxSlots: 200, registeredSlots: 156 },
      { id: 39, label: "25K Island Ultra", km: 25, price: 1300000, maxSlots: 120, registeredSlots: 98 },
    ],
    bannerGradient: "linear-gradient(135deg, #20bf6b 0%, #26de81 40%, #0fb9b1 100%)",
    bannerEmoji: "🦎",
    status: "registration-open",
    registeredCount: 254,
    maxParticipants: 320,
    organizer: "Halong Bay Adventures",
    tags: ["Trail", "Island", "Jungle"],
  },
  {
    id: 14,
    title: "Mui Ne Sand Dunes Run",
    slug: "mui-ne-sand-dunes-run-2027",
    description:
      "A one-of-a-kind running experience across the famous red and white sand dunes of Mui Ne. Feel the challenge of running on sand while enjoying spectacular desert-like landscapes and ocean views.",
    location: "Mui Ne, Binh Thuan",
    city: "Mui Ne",
    date: "2027-02-28",
    distances: [
      { id: 40, label: "5K Dune Dash", km: 5, price: 400000, maxSlots: 300, registeredSlots: 67 },
      { id: 41, label: "10K Sand Storm", km: 10, price: 700000, maxSlots: 200, registeredSlots: 43 },
    ],
    bannerGradient: "linear-gradient(135deg, #f9ca24 0%, #f0932b 50%, #eb4d4b 100%)",
    bannerEmoji: "🏜️",
    status: "upcoming",
    registeredCount: 110,
    maxParticipants: 500,
    organizer: "Desert Run Vietnam",
    tags: ["Road", "Desert", "Adventure"],
  },
  {
    id: 15,
    title: "Ba Vi Mountain Race",
    slug: "ba-vi-mountain-race-2026",
    description:
      "Tackle the majestic Ba Vi Mountain just outside Hanoi. This challenging mountain race takes runners through national park trails, bamboo forests, and misty peaks rising 1,296 meters above sea level.",
    location: "Ba Vi National Park, Hanoi",
    city: "Hanoi",
    date: "2026-10-25",
    distances: [
      { id: 42, label: "12K Mountain", km: 12, price: 600000, maxSlots: 250, registeredSlots: 213 },
      { id: 43, label: "21K Summit Run", km: 21, price: 1000000, maxSlots: 150, registeredSlots: 134 },
      { id: 44, label: "42K Peak Challenge", km: 42, price: 1800000, maxSlots: 80, registeredSlots: 72 },
    ],
    bannerGradient: "linear-gradient(135deg, #2c3e50 0%, #4a6741 40%, #6ab04c 100%)",
    bannerEmoji: "🌿",
    status: "registration-open",
    registeredCount: 419,
    maxParticipants: 480,
    organizer: "Mountain Runners VN",
    tags: ["Trail", "Mountain", "National Park"],
  },
  {
    id: 16,
    title: "Vung Tau Seaside Half Marathon",
    slug: "vung-tau-half-marathon-2027",
    description:
      "Enjoy the coastal charm of Vung Tau in this seaside half marathon. Run along the scenic Back Beach and Front Beach, past the iconic Christ statue, and through charming seaside streets.",
    location: "Back Beach, Vung Tau",
    city: "Vung Tau",
    date: "2027-01-25",
    distances: [
      { id: 45, label: "5K Seaside Jog", km: 5, price: 280000, maxSlots: 800, registeredSlots: 234 },
      { id: 46, label: "10K Ocean Run", km: 10, price: 500000, maxSlots: 600, registeredSlots: 178 },
      { id: 47, label: "21K Half Marathon", km: 21, price: 900000, maxSlots: 400, registeredSlots: 123 },
    ],
    bannerGradient: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #dfe6e9 100%)",
    bannerEmoji: "⛵",
    status: "upcoming",
    registeredCount: 535,
    maxParticipants: 1800,
    organizer: "Vung Tau Athletics",
    tags: ["Road", "Seaside", "Scenic"],
  },
  {
    id: 17,
    title: "Can Tho Midnight Marathon",
    slug: "can-tho-midnight-marathon-2027",
    description:
      "Run under the stars in the heart of the Mekong Delta! This midnight marathon starts at the stroke of midnight and takes you through the illuminated streets of Can Tho, past floating markets, and along riverfront promenades.",
    location: "Ninh Kieu Wharf, Can Tho",
    city: "Can Tho",
    date: "2027-03-22",
    distances: [
      { id: 48, label: "5K Midnight Dash", km: 5, price: 300000, maxSlots: 500, registeredSlots: 34 },
      { id: 49, label: "10K Night Owl", km: 10, price: 550000, maxSlots: 400, registeredSlots: 23 },
      { id: 50, label: "42K Midnight Marathon", km: 42, price: 1500000, maxSlots: 200, registeredSlots: 12 },
    ],
    bannerGradient: "linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 40%, #3d3d6b 100%)",
    bannerEmoji: "🌃",
    status: "upcoming",
    registeredCount: 69,
    maxParticipants: 1100,
    organizer: "Night Run Vietnam",
    tags: ["Road", "Night Run", "Marathon"],
  },
  {
    id: 18,
    title: "Phong Nha Cave Explorer Run",
    slug: "phong-nha-explorer-run-2026",
    description:
      "An adventure run near the world-famous Phong Nha-Ke Bang caves. Race through lush jungle trails, alongside underground rivers, and past towering limestone karsts in this UNESCO World Heritage setting.",
    location: "Phong Nha, Quang Binh",
    city: "Phong Nha",
    date: "2026-11-08",
    distances: [
      { id: 51, label: "10K Explorer", km: 10, price: 650000, maxSlots: 250, registeredSlots: 189 },
      { id: 52, label: "21K Cave Run", km: 21, price: 1100000, maxSlots: 180, registeredSlots: 145 },
    ],
    bannerGradient: "linear-gradient(135deg, #2d3436 0%, #636e72 50%, #b8e994 100%)",
    bannerEmoji: "🦇",
    status: "registration-open",
    registeredCount: 334,
    maxParticipants: 430,
    organizer: "Quang Binh Adventure Sports",
    tags: ["Trail", "Cave", "Adventure"],
  },
  {
    id: 19,
    title: "Ninh Binh Heritage Marathon",
    slug: "ninh-binh-heritage-marathon-2026",
    description:
      "Run through the breathtaking landscapes of Ninh Binh - the 'Ha Long Bay on land'. This marathon showcases limestone karsts, ancient temples, and vast rice paddies that have been featured in Hollywood blockbusters.",
    location: "Trang An, Ninh Binh",
    city: "Ninh Binh",
    date: "2026-12-15",
    distances: [
      { id: 53, label: "5K Heritage Walk", km: 5, price: 300000, maxSlots: 600, registeredSlots: 234 },
      { id: 54, label: "10K Karst Run", km: 10, price: 550000, maxSlots: 400, registeredSlots: 189 },
      { id: 55, label: "21K Half Marathon", km: 21, price: 950000, maxSlots: 300, registeredSlots: 156 },
      { id: 56, label: "42K Full Marathon", km: 42, price: 1600000, maxSlots: 200, registeredSlots: 123 },
    ],
    bannerGradient: "linear-gradient(135deg, #44bd32 0%, #4cd137 40%, #c4e538 100%)",
    bannerEmoji: "🐉",
    status: "registration-open",
    registeredCount: 702,
    maxParticipants: 1500,
    organizer: "Heritage Runners Vietnam",
    tags: ["Road", "Heritage", "Scenic"],
  },
  {
    id: 20,
    title: "Sapa Winter Trail",
    slug: "sapa-winter-trail-2027",
    description:
      "Brave the winter chill of Sapa in this exciting trail run. Run through frosted rice terraces, misty mountain passes, and traditional Hmong villages in the cool winter air of northern Vietnam.",
    location: "Sapa Town, Lao Cai",
    city: "Sapa",
    date: "2027-01-10",
    distances: [
      { id: 57, label: "10K Frost Run", km: 10, price: 550000, maxSlots: 300, registeredSlots: 78 },
      { id: 58, label: "25K Winter Trail", km: 25, price: 1200000, maxSlots: 200, registeredSlots: 45 },
      { id: 59, label: "50K Arctic Ultra", km: 50, price: 2000000, maxSlots: 100, registeredSlots: 23 },
    ],
    bannerGradient: "linear-gradient(135deg, #dfe6e9 0%, #b2bec3 40%, #636e72 100%)",
    bannerEmoji: "❄️",
    status: "upcoming",
    registeredCount: 146,
    maxParticipants: 600,
    organizer: "Vietnam Trail Series",
    tags: ["Trail", "Mountain", "Winter"],
  },
  {
    id: 21,
    title: "Hoi An Lantern Run",
    slug: "hoi-an-lantern-run-2026",
    description:
      "Run under the enchanting glow of Hoi An's famous lanterns! This magical evening run takes you through the UNESCO Ancient Town, across the Japanese Covered Bridge, and along the Thu Bon River decorated with thousands of colorful lanterns.",
    location: "Ancient Town, Hoi An",
    city: "Hoi An",
    date: "2026-11-22",
    distances: [
      { id: 60, label: "5K Lantern Walk", km: 5, price: 350000, maxSlots: 500, registeredSlots: 389 },
      { id: 61, label: "10K Moonlight Run", km: 10, price: 600000, maxSlots: 400, registeredSlots: 312 },
    ],
    bannerGradient: "linear-gradient(135deg, #fdcb6e 0%, #e17055 40%, #d63031 100%)",
    bannerEmoji: "🏮",
    status: "registration-open",
    registeredCount: 701,
    maxParticipants: 900,
    organizer: "Hoi An Sports Tourism",
    tags: ["Road", "Night Run", "Cultural"],
  },
  {
    id: 22,
    title: "Con Dao Island Ultra",
    slug: "con-dao-island-ultra-2027",
    description:
      "Take on the ultimate island ultra challenge in Con Dao. This remote archipelago offers pristine nature, challenging terrain, and a deeply meaningful running experience on this historically significant island.",
    location: "Con Dao National Park",
    city: "Con Dao",
    date: "2027-04-19",
    distances: [
      { id: 62, label: "10K Island Loop", km: 10, price: 700000, maxSlots: 150, registeredSlots: 23 },
      { id: 63, label: "30K Coastal Ultra", km: 30, price: 1500000, maxSlots: 100, registeredSlots: 12 },
      { id: 64, label: "60K Island Ultra", km: 60, price: 2800000, maxSlots: 50, registeredSlots: 8 },
    ],
    bannerGradient: "linear-gradient(135deg, #0984e3 0%, #00b894 50%, #55efc4 100%)",
    bannerEmoji: "🐢",
    status: "upcoming",
    registeredCount: 43,
    maxParticipants: 300,
    organizer: "Offshore Racing Vietnam",
    tags: ["Trail", "Island", "Ultra"],
  },
  {
    id: 23,
    title: "Lang Biang Sky Race",
    slug: "lang-biang-sky-race-2026",
    description:
      "Reach for the sky in this vertical race up Lang Biang Peak, the highest point of the Dalat Plateau at 2,167m. This intense mountain race rewards finishers with 360-degree panoramic views of the Central Highlands.",
    location: "Lang Biang Peak, Lac Duong",
    city: "Da Lat",
    date: "2026-12-06",
    distances: [
      { id: 65, label: "10K Vertical", km: 10, price: 750000, maxSlots: 200, registeredSlots: 167 },
      { id: 66, label: "21K Sky Run", km: 21, price: 1300000, maxSlots: 120, registeredSlots: 98 },
    ],
    bannerGradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ee5a24 100%)",
    bannerEmoji: "🦅",
    status: "registration-open",
    registeredCount: 265,
    maxParticipants: 320,
    organizer: "Highland Trail Runners",
    tags: ["Trail", "Vertical", "Sky Race"],
  },
  {
    id: 24,
    title: "Saigon Riverside Half Marathon",
    slug: "saigon-riverside-half-2027",
    description:
      "Run along the scenic Saigon River from Thu Thiem to District 2, enjoying views of the city skyline and modern waterfront developments. This fast and flat course is perfect for personal bests!",
    location: "Thu Thiem, Thu Duc City",
    city: "Ho Chi Minh City",
    date: "2027-03-15",
    distances: [
      { id: 67, label: "5K Fun Run", km: 5, price: 300000, maxSlots: 1500, registeredSlots: 45 },
      { id: 68, label: "10K River Run", km: 10, price: 550000, maxSlots: 1000, registeredSlots: 23 },
      { id: 69, label: "21K Half Marathon", km: 21, price: 950000, maxSlots: 600, registeredSlots: 12 },
    ],
    bannerGradient: "linear-gradient(135deg, #e55039 0%, #eb2f06 40%, #b71540 100%)",
    bannerEmoji: "🌅",
    status: "upcoming",
    registeredCount: 80,
    maxParticipants: 3100,
    organizer: "Techcombank Running",
    tags: ["Road", "City", "Flat Course"],
  },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getStatusLabel(status: RaceEvent["status"]): string {
  switch (status) {
    case "registration-open":
      return "Registration Open";
    case "upcoming":
      return "Coming Soon";
    case "sold-out":
      return "Sold Out";
    case "completed":
      return "Completed";
  }
}

export function getStatusColor(status: RaceEvent["status"]): string {
  switch (status) {
    case "registration-open":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/25";
    case "upcoming":
      return "bg-blue-500/15 text-blue-700 border-blue-500/25";
    case "sold-out":
      return "bg-red-500/15 text-red-700 border-red-500/25";
    case "completed":
      return "bg-gray-500/15 text-gray-600 border-gray-500/25";
  }
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
  return MOCK_EVENTS.filter((e) => e.status === "registration-open").slice(0, 4);
}
