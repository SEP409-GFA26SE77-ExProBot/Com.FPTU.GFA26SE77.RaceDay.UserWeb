export interface SplitTime {
  checkpoint: string;
  time: string;
  cumulative: string;
  cutOff?: string;
  atRisk?: boolean;
}

export interface RunnerResult {
  eventId: number;
  bib: number;
  name: string;
  gender: "Nam" | "Nữ";
  distanceLabel: string;
  finishTime: string | null;
  status: "finished" | "dnf" | "dns" | "racing";
  rankOverall: number | null;
  rankGender: number | null;
  splits: SplitTime[];
  cutOffWarning?: string;
  certificateId?: string;
}

export interface LeaderboardRow {
  rank: number;
  bib: number;
  name: string;
  gender: string;
  finishTime: string;
}

/** Mock kết quả — event 1 đã công bố; event 2 chưa; event 3 sold-out đã chạy */
export const MOCK_RUNNER_RESULTS: RunnerResult[] = [
  {
    eventId: 1,
    bib: 1234,
    name: "Nguyễn Văn An",
    gender: "Nam",
    distanceLabel: "10K Chạy vui",
    finishTime: "00:58:42",
    status: "finished",
    rankOverall: 86,
    rankGender: 62,
    certificateId: "cert-1234-1",
    cutOffWarning: undefined,
    splits: [
      { checkpoint: "Xuất phát", time: "00:00:00", cumulative: "00:00:00" },
      { checkpoint: "CP1 — 3K", time: "00:16:20", cumulative: "00:16:20", cutOff: "00:25:00" },
      { checkpoint: "CP2 — 6K", time: "00:18:05", cumulative: "00:34:25", cutOff: "00:50:00" },
      { checkpoint: "CP3 — 8K", time: "00:12:10", cumulative: "00:46:35", cutOff: "01:05:00" },
      { checkpoint: "Vạch đích — 10K", time: "00:12:07", cumulative: "00:58:42", cutOff: "01:30:00" },
    ],
  },
  {
    eventId: 2,
    bib: 2048,
    name: "Nguyễn Văn An",
    gender: "Nam",
    distanceLabel: "21K Bán marathon",
    finishTime: null,
    status: "racing",
    rankOverall: null,
    rankGender: null,
    cutOffWarning:
      "Cảnh báo cut-off: tốc độ hiện tại có nguy cơ không kịp mốc CP3 (15K) trước 09:30.",
    splits: [
      { checkpoint: "Xuất phát", time: "00:00:00", cumulative: "00:00:00" },
      { checkpoint: "CP1 — 5K", time: "00:28:40", cumulative: "00:28:40", cutOff: "00:40:00" },
      {
        checkpoint: "CP2 — 10K",
        time: "00:32:15",
        cumulative: "01:00:55",
        cutOff: "01:15:00",
        atRisk: true,
      },
    ],
  },
];

export const MOCK_LEADERBOARDS: Record<number, LeaderboardRow[]> = {
  1: [
    { rank: 1, bib: 1001, name: "Trần Minh Quân", gender: "Nam", finishTime: "00:41:12" },
    { rank: 2, bib: 1088, name: "Lê Thị Mai", gender: "Nữ", finishTime: "00:44:08" },
    { rank: 3, bib: 1155, name: "Phạm Đức Huy", gender: "Nam", finishTime: "00:45:33" },
    { rank: 4, bib: 1202, name: "Ngô Bảo Châu", gender: "Nữ", finishTime: "00:47:01" },
    { rank: 5, bib: 1300, name: "Hoàng Văn Nam", gender: "Nam", finishTime: "00:48:22" },
    { rank: 86, bib: 1234, name: "Nguyễn Văn An", gender: "Nam", finishTime: "00:58:42" },
  ],
};

export function getResultByEventAndBib(eventId: number, bib: number) {
  return MOCK_RUNNER_RESULTS.find((r) => r.eventId === eventId && r.bib === bib);
}

export function getResultsForEvent(eventId: number) {
  return MOCK_RUNNER_RESULTS.filter((r) => r.eventId === eventId);
}

export function getLeaderboard(eventId: number) {
  return MOCK_LEADERBOARDS[eventId] ?? null;
}

export function getCertificate(regIdOrCertId: string) {
  const byCert = MOCK_RUNNER_RESULTS.find((r) => r.certificateId === regIdOrCertId);
  if (byCert) return byCert;
  // allow lookup by cert-bib-event pattern
  const m = /^cert-(\d+)-(\d+)$/.exec(regIdOrCertId);
  if (m) return getResultByEventAndBib(Number(m[2]), Number(m[1]));
  return undefined;
}
