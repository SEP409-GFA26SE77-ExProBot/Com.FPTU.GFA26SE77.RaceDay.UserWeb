export interface MockRacePhoto {
  id: string;
  eventId: number;
  bib: number;
  src: string;
  caption: string;
  takenAt: string;
}

/** Gallery mock — tìm ảnh theo BIB (FE-07) */
export const MOCK_RACE_PHOTOS: MockRacePhoto[] = [
  {
    id: "p1-1234-1",
    eventId: 1,
    bib: 1234,
    src: "/photos/1/bib-1234-1.jpg",
    caption: "Xuất phát — cổng A, Sapa",
    takenAt: "2026-11-15T05:35:00+07:00",
  },
  {
    id: "p1-1234-2",
    eventId: 1,
    bib: 1234,
    src: "/photos/1/bib-1234-2.jpg",
    caption: "Leo dốc ruộng bậc thang — km 8",
    takenAt: "2026-11-15T06:42:00+07:00",
  },
  {
    id: "p1-1234-3",
    eventId: 1,
    bib: 1234,
    src: "/photos/1/bib-1234-3.jpg",
    caption: "Về đích 10K — khu vực finish",
    takenAt: "2026-11-15T07:18:00+07:00",
  },
  {
    id: "p1-1234-4",
    eventId: 1,
    bib: 1234,
    src: "/photos/1/bib-1234-1.jpg",
    caption: "Warm-up corral — trước xuất phát",
    takenAt: "2026-11-15T05:10:00+07:00",
  },
  {
    id: "p1-1234-5",
    eventId: 1,
    bib: 1234,
    src: "/photos/1/bib-1234-2.jpg",
    caption: "Aid station — km 5",
    takenAt: "2026-11-15T06:05:00+07:00",
  },
  {
    id: "p1-1234-6",
    eventId: 1,
    bib: 1234,
    src: "/photos/1/bib-1234-3.jpg",
    caption: "Cầu treo bản làng — km 6",
    takenAt: "2026-11-15T06:20:00+07:00",
  },
  {
    id: "p1-1234-7",
    eventId: 1,
    bib: 1234,
    src: "/photos/1/bib-1234-1.jpg",
    caption: "Dốc cuối trước finish — km 9",
    takenAt: "2026-11-15T07:02:00+07:00",
  },
  {
    id: "p1-1234-8",
    eventId: 1,
    bib: 1234,
    src: "/photos/1/bib-1234-2.jpg",
    caption: "Nhận huy chương finisher",
    takenAt: "2026-11-15T07:25:00+07:00",
  },
  {
    id: "p1-1234-9",
    eventId: 1,
    bib: 1234,
    src: "/photos/1/bib-1234-3.jpg",
    caption: "Chụp cùng CLB — race village",
    takenAt: "2026-11-15T07:40:00+07:00",
  },
  {
    id: "p2-2048-1",
    eventId: 2,
    bib: 2048,
    src: "/photos/2/bib-2048-1.jpg",
    caption: "Chạy qua cầu Thủ Thiêm — km 12",
    takenAt: "2026-12-08T06:20:00+07:00",
  },
  {
    id: "p2-2048-2",
    eventId: 2,
    bib: 2048,
    src: "/photos/2/bib-2048-2.jpg",
    caption: "Checkpoint nước — Công viên 23/9",
    takenAt: "2026-12-08T07:05:00+07:00",
  },
];

export async function searchPhotosByBib(
  bib: number,
  eventId?: number
): Promise<MockRacePhoto[]> {
  await new Promise((r) => setTimeout(r, 700));
  return MOCK_RACE_PHOTOS.filter(
    (p) => p.bib === bib && (eventId == null || p.eventId === eventId)
  );
}
