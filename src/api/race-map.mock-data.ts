/**
 * MOCK DATA ONLY — xóa file này (+ race-map.mock.ts) khi BE course API sẵn sàng.
 * Types sống ở @/dto/race-map.dto.
 */
import type {
  CheckpointType,
  DemoEventMetaDto,
  LatLngDto,
  RaceCheckpointDto,
  SimRunnerDto,
} from "@/dto/race-map.dto";

export type LatLng = LatLngDto;
export type Checkpoint = RaceCheckpointDto;
export type SimRunner = SimRunnerDto;
export type { CheckpointType };

/** Demo 5K Mỹ Khê — seed geometry (OSRM). */
export const DEMO_EVENT: DemoEventMetaDto = {
  id: "fun-run-5k-2027",
  title: "Fun Run 5K Mỹ Khê 2027 (demo)",
  city: "Đà Nẵng",
  gunTimeIso: "2027-01-10T06:00:00+07:00",
  distanceKm: 5,
  maxPlausibleKmh: 22,
  duplicateWindowSec: 30,
  mapMarkerLimit: 8,
  uiFlushMs: 500,
};

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

function pointAtKm(poly: LatLng[], courseKm: number, totalKm: number): LatLng {
  if (poly.length === 0) return { lat: 0, lng: 0 };
  if (courseKm <= 0) return poly[0];
  const target = Math.min(courseKm, totalKm);
  let walked = 0;
  for (let i = 1; i < poly.length; i++) {
    const seg = haversineKm(poly[i - 1], poly[i]);
    if (walked + seg >= target) {
      const f = seg > 0 ? (target - walked) / seg : 0;
      return interpolate(poly[i - 1], poly[i], f);
    }
    walked += seg;
  }
  return poly[poly.length - 1];
}

/** OSRM driving geometry ~5km dọc Võ Nguyên Giáp (không cắt tòa nhà) */
export const ROUTE_POLYLINE: LatLng[] = [
  { lat: 16.041968, lng: 108.246416 },
  { lat: 16.042093, lng: 108.246364 },
  { lat: 16.042147, lng: 108.246339 },
  { lat: 16.042217, lng: 108.246314 },
  { lat: 16.042331, lng: 108.246248 },
  { lat: 16.042355, lng: 108.2462 },
  { lat: 16.042363, lng: 108.246154 },
  { lat: 16.042358, lng: 108.246108 },
  { lat: 16.042297, lng: 108.245905 },
  { lat: 16.042284, lng: 108.245813 },
  { lat: 16.042287, lng: 108.245767 },
  { lat: 16.042297, lng: 108.245724 },
  { lat: 16.042313, lng: 108.245689 },
  { lat: 16.042333, lng: 108.245659 },
  { lat: 16.042361, lng: 108.24563 },
  { lat: 16.04239, lng: 108.245612 },
  { lat: 16.042668, lng: 108.245483 },
  { lat: 16.043073, lng: 108.24528 },
  { lat: 16.043684, lng: 108.244988 },
  { lat: 16.043737, lng: 108.244963 },
  { lat: 16.043777, lng: 108.245055 },
  { lat: 16.044079, lng: 108.245677 },
  { lat: 16.044324, lng: 108.246152 },
  { lat: 16.044713, lng: 108.247109 },
  { lat: 16.044815, lng: 108.24731 },
  { lat: 16.045106, lng: 108.247172 },
  { lat: 16.045393, lng: 108.247064 },
  { lat: 16.045636, lng: 108.246941 },
  { lat: 16.045921, lng: 108.2468 },
  { lat: 16.046224, lng: 108.246621 },
  { lat: 16.046481, lng: 108.246526 },
  { lat: 16.04652, lng: 108.246661 },
  { lat: 16.046633, lng: 108.246625 },
  { lat: 16.04709, lng: 108.246479 },
  { lat: 16.047253, lng: 108.246429 },
  { lat: 16.04765, lng: 108.246315 },
  { lat: 16.047828, lng: 108.24625 },
  { lat: 16.047942, lng: 108.246212 },
  { lat: 16.048043, lng: 108.246181 },
  { lat: 16.049422, lng: 108.245777 },
  { lat: 16.049898, lng: 108.24563 },
  { lat: 16.049951, lng: 108.245815 },
  { lat: 16.050028, lng: 108.246082 },
  { lat: 16.050148, lng: 108.246523 },
  { lat: 16.050192, lng: 108.246668 },
  { lat: 16.050272, lng: 108.246929 },
  { lat: 16.050308, lng: 108.246949 },
  { lat: 16.051337, lng: 108.246624 },
  { lat: 16.051473, lng: 108.247101 },
  { lat: 16.051954, lng: 108.246941 },
  { lat: 16.052423, lng: 108.246789 },
  { lat: 16.052837, lng: 108.246655 },
  { lat: 16.052888, lng: 108.246638 },
  { lat: 16.05299, lng: 108.246601 },
  { lat: 16.05359, lng: 108.246409 },
  { lat: 16.053667, lng: 108.246391 },
  { lat: 16.053906, lng: 108.246317 },
  { lat: 16.054987, lng: 108.245983 },
  { lat: 16.055078, lng: 108.245949 },
  { lat: 16.055455, lng: 108.245828 },
  { lat: 16.055543, lng: 108.2458 },
  { lat: 16.055942, lng: 108.245682 },
  { lat: 16.056065, lng: 108.245648 },
  { lat: 16.056205, lng: 108.2456 },
  { lat: 16.057442, lng: 108.245174 },
  { lat: 16.057511, lng: 108.24515 },
  { lat: 16.057608, lng: 108.245118 },
  { lat: 16.058052, lng: 108.244972 },
  { lat: 16.058751, lng: 108.244742 },
  { lat: 16.059335, lng: 108.244538 },
  { lat: 16.060546, lng: 108.244172 },
  { lat: 16.061152, lng: 108.243993 },
  { lat: 16.061448, lng: 108.243886 },
  { lat: 16.061883, lng: 108.243737 },
  { lat: 16.062017, lng: 108.2437 },
  { lat: 16.06252, lng: 108.243559 },
  { lat: 16.062599, lng: 108.243537 },
  { lat: 16.062746, lng: 108.243496 },
  { lat: 16.062792, lng: 108.243484 },
  { lat: 16.062966, lng: 108.243428 },
  { lat: 16.06317, lng: 108.243372 },
  { lat: 16.063268, lng: 108.243354 },
  { lat: 16.063441, lng: 108.243329 },
  { lat: 16.063647, lng: 108.243296 },
  { lat: 16.063972, lng: 108.243283 },
  { lat: 16.064046, lng: 108.243282 },
  { lat: 16.064367, lng: 108.243267 },
  { lat: 16.064499, lng: 108.243255 },
  { lat: 16.064682, lng: 108.24325 },
  { lat: 16.065276, lng: 108.243259 },
  { lat: 16.065279, lng: 108.243382 },
  { lat: 16.065288, lng: 108.243616 },
  { lat: 16.065312, lng: 108.244485 },
  { lat: 16.065326, lng: 108.244524 },
  { lat: 16.06569, lng: 108.244486 },
  { lat: 16.065687, lng: 108.243932 },
  { lat: 16.066005, lng: 108.243918 },
  { lat: 16.066567, lng: 108.243894 },
  { lat: 16.066644, lng: 108.244386 },
  { lat: 16.067204, lng: 108.244328 },
  { lat: 16.067274, lng: 108.24432 },
  { lat: 16.067646, lng: 108.244281 },
  { lat: 16.068034, lng: 108.244241 },
  { lat: 16.068413, lng: 108.244201 },
  { lat: 16.068869, lng: 108.244153 },
  { lat: 16.068844, lng: 108.243499 },
  { lat: 16.068834, lng: 108.243139 },
  { lat: 16.069329, lng: 108.243124 },
  { lat: 16.069425, lng: 108.24312 },
  { lat: 16.069978, lng: 108.243091 },
  { lat: 16.070081, lng: 108.243088 },
  { lat: 16.070086, lng: 108.243134 },
  { lat: 16.070104, lng: 108.243177 },
  { lat: 16.070132, lng: 108.243213 },
  { lat: 16.070166, lng: 108.243239 },
  { lat: 16.070206, lng: 108.243254 },
  { lat: 16.070248, lng: 108.243258 },
  { lat: 16.07029, lng: 108.243251 },
  { lat: 16.070328, lng: 108.243232 },
  { lat: 16.070371, lng: 108.24319 },
  { lat: 16.070397, lng: 108.243136 },
  { lat: 16.070402, lng: 108.243076 },
  { lat: 16.070508, lng: 108.243075 },
  { lat: 16.07094, lng: 108.24307 },
  { lat: 16.070997, lng: 108.243069 },
  { lat: 16.071622, lng: 108.243047 },
  { lat: 16.072192, lng: 108.24303 },
  { lat: 16.072973, lng: 108.243004 },
  { lat: 16.073056, lng: 108.243 },
  { lat: 16.073651, lng: 108.242986 },
  { lat: 16.073999, lng: 108.242972 },
  { lat: 16.075384, lng: 108.242915 },
  { lat: 16.075517, lng: 108.242913 },
  { lat: 16.075693, lng: 108.242907 },
  { lat: 16.0768, lng: 108.242869 },
  { lat: 16.076912, lng: 108.242866 },
  { lat: 16.077268, lng: 108.242851 },
  { lat: 16.077418, lng: 108.242843 },
  { lat: 16.077649, lng: 108.242834 },
  { lat: 16.07816, lng: 108.242813 },
  { lat: 16.078236, lng: 108.242815 },
  { lat: 16.078376, lng: 108.242817 },
  { lat: 16.078549, lng: 108.242842 },
  { lat: 16.078693, lng: 108.242878 },
  { lat: 16.078809, lng: 108.242913 },
  { lat: 16.079093, lng: 108.243015 },
];

const CP_DEFS: { km: number; name: string; cutoff?: string }[] = [
  { km: 0, name: "Xuất phát", cutoff: "06:10" },
  { km: 1.5, name: "CP 1.5km" },
  { km: 3, name: "CP 3km" },
  { km: 5, name: "Vạch đích 5km", cutoff: "07:00" },
];

export const CHECKPOINTS: Checkpoint[] = CP_DEFS.map((d) => {
  const p = pointAtKm(ROUTE_POLYLINE, d.km, DEMO_EVENT.distanceKm);
  const type: CheckpointType =
    d.km === 0 ? "start" : d.km >= DEMO_EVENT.distanceKm ? "finish" : "aid";
  return {
    id: `cp-${d.km}`,
    name: d.name,
    km: d.km,
    lat: p.lat,
    lng: p.lng,
    type,
    cutoff: d.cutoff,
  };
});

export const SEED_RUNNERS: SimRunner[] = [
  { bib: 1024, chipId: "CHIP-1024", name: "Nguyễn Văn A", gender: "Nam", speedKmh: 12.0, startOffsetSec: 0 },
  { bib: 897, chipId: "CHIP-0897", name: "Trần Minh Quân", gender: "Nam", speedKmh: 13.2, startOffsetSec: 5 },
  { bib: 765, chipId: "CHIP-0765", name: "Lê Thị Mai", gender: "Nữ", speedKmh: 11.5, startOffsetSec: 8 },
  { bib: 432, chipId: "CHIP-0432", name: "Phạm Đức Huy", gender: "Nam", speedKmh: 14.0, startOffsetSec: 3 },
  { bib: 210, chipId: "CHIP-0210", name: "Ngô Bảo Châu", gender: "Nữ", speedKmh: 10.8, startOffsetSec: 12 },
  {
    bib: 888,
    chipId: "CHIP-0432",
    name: "Hack Tráo Chip",
    gender: "Nam",
    speedKmh: 18.0,
    startOffsetSec: 0,
    spoofChip: true,
  },
];

/** Stress field cho engine (map vẫn chỉ vẽ mapMarkerLimit) */
export function generateField(extraCount: number): SimRunner[] {
  const out: SimRunner[] = [...SEED_RUNNERS];
  for (let i = 0; i < extraCount; i++) {
    const bib = 2000 + i;
    out.push({
      bib,
      chipId: `CHIP-${bib}`,
      name: `VĐV ${bib}`,
      gender: i % 3 === 0 ? "Nữ" : "Nam",
      speedKmh: 9 + (i % 50) / 10,
      startOffsetSec: (i % 40) * 2,
    });
  }
  return out;
}
