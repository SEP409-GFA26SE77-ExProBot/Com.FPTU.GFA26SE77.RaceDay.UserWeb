import type {
  BankAccountDto,
  CreatePayoutRequestDto,
  CreateRefundRequestDto,
  EventFinanceSummaryDto,
  EventLedgerDto,
  OrganizerWalletDto,
  PayoutRequestDto,
  RefundRequestDto,
} from "@/dto/finance.dto";

const LS_BANK = "raceday.finance.bank.v2";
const LS_LEDGERS = "raceday.finance.ledgers.v2";
const LS_PAYOUTS = "raceday.finance.payouts.v2";
const LS_REFUNDS = "raceday.finance.refunds.v2";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

const DEFAULT_BANK: BankAccountDto = {
  bankName: "Vietcombank",
  accountNumber: "0123456789",
  accountHolderName: "NGUYEN VAN ORGANIZER",
  branch: "Đà Nẵng",
  transferNote: "Giai ngan BTC RaceDay",
};

/** Hai giải demo: A gần end (rút nhiều), B chưa bắt đầu (cap 50%) */
const SEED_LEDGERS: EventLedgerDto[] = [
  {
    eventId: "evt-a-ending",
    eventName: "Fun Run 5K Mỹ Khê 2027 (sắp kết thúc)",
    eventStatus: "registration-open",
    ticketsSold: 186,
    grossRevenue: 48_500_000,
    platformFeePercent: 5,
    platformFeeAmount: 2_425_000,
    refundedTotal: 500_000,
    netToOrganizer: 45_575_000,
    escrowHeld: 28_075_000,
    withdrawnTotal: 5_000_000,
    payoutPending: 2_500_000,
    availableToWithdraw: 18_000_000,
    withdrawPolicyNote: "Gần race day — có thể rút tới phần khả dụng còn lại.",
    currency: "VND",
  },
  {
    eventId: "evt-b-early",
    eventName: "Son Tra Trail 21K (chưa bắt đầu)",
    eventStatus: "approved",
    ticketsSold: 42,
    grossRevenue: 12_600_000,
    platformFeePercent: 5,
    platformFeeAmount: 630_000,
    refundedTotal: 0,
    netToOrganizer: 11_970_000,
    escrowHeld: 8_970_000,
    withdrawnTotal: 0,
    payoutPending: 0,
    availableToWithdraw: 5_985_000,
    withdrawPolicyNote: "Trước sự kiện — tối đa ~50% net sau phí & hoàn tiền.",
    currency: "VND",
  },
];

const SEED_PAYOUTS: PayoutRequestDto[] = [
  {
    id: "po-demo-1",
    eventId: "evt-a-ending",
    eventName: "Fun Run 5K Mỹ Khê 2027 (sắp kết thúc)",
    amount: 5_000_000,
    note: "Giải ngân đợt 1",
    status: "transferred",
    createdAt: "2026-09-20T08:00:00.000Z",
    transferredAt: "2026-09-22T10:00:00.000Z",
  },
  {
    id: "po-demo-2",
    eventId: "evt-a-ending",
    eventName: "Fun Run 5K Mỹ Khê 2027 (sắp kết thúc)",
    amount: 2_500_000,
    note: "Đợt 2 — chờ Admin",
    status: "pending",
    createdAt: "2026-10-08T04:00:00.000Z",
  },
];

function getLedgers(): EventLedgerDto[] {
  return readJson(LS_LEDGERS, SEED_LEDGERS);
}

function saveLedgers(list: EventLedgerDto[]) {
  writeJson(LS_LEDGERS, list);
}

function rollupWallet(
  events: EventLedgerDto[],
  bank: BankAccountDto | null
): OrganizerWalletDto {
  return {
    totalRevenue: events.reduce((s, e) => s + e.grossRevenue, 0),
    availableBalance: events.reduce((s, e) => s + e.availableToWithdraw, 0),
    pendingEscrow: events.reduce(
      (s, e) => s + e.escrowHeld + e.payoutPending,
      0
    ),
    withdrawnTotal: events.reduce((s, e) => s + e.withdrawnTotal, 0),
    currency: "VND",
    bankAccount: bank,
    events,
  };
}

export async function getOrganizerWalletMock(): Promise<OrganizerWalletDto> {
  const bank = readJson<BankAccountDto | null>(LS_BANK, DEFAULT_BANK);
  return rollupWallet(getLedgers(), bank);
}

export async function listEventLedgersMock(): Promise<EventLedgerDto[]> {
  return getLedgers();
}

export async function saveBankAccountMock(
  account: BankAccountDto
): Promise<OrganizerWalletDto> {
  writeJson(LS_BANK, account);
  return rollupWallet(getLedgers(), account);
}

export async function listPayoutRequestsMock(
  eventId?: string
): Promise<PayoutRequestDto[]> {
  const list = readJson(LS_PAYOUTS, SEED_PAYOUTS);
  if (!eventId) return list;
  return list.filter((p) => p.eventId === eventId);
}

export async function createPayoutRequestMock(
  body: CreatePayoutRequestDto
): Promise<PayoutRequestDto> {
  if (!body.eventId?.trim()) {
    throw new Error("Phải chọn giải để rút — không rút gộp nhiều giải.");
  }
  if (body.amount <= 0) throw new Error("Số tiền không hợp lệ.");

  const bank = readJson<BankAccountDto | null>(LS_BANK, DEFAULT_BANK);
  if (!bank?.accountNumber) {
    throw new Error("Cần lưu tài khoản ngân hàng trước khi rút.");
  }

  const ledgers = getLedgers();
  const idx = ledgers.findIndex((e) => e.eventId === body.eventId);
  if (idx < 0) throw new Error("Không tìm thấy túi tiền của giải.");
  const bucket = ledgers[idx];
  if (body.amount > bucket.availableToWithdraw) {
    throw new Error(
      `Vượt khả dụng của giải này (${bucket.availableToWithdraw.toLocaleString("vi-VN")}₫). Không lấy tiền từ giải khác.`
    );
  }

  const nextBucket: EventLedgerDto = {
    ...bucket,
    availableToWithdraw: bucket.availableToWithdraw - body.amount,
    escrowHeld: Math.max(0, bucket.escrowHeld - body.amount),
    payoutPending: bucket.payoutPending + body.amount,
  };
  const nextLedgers = [...ledgers];
  nextLedgers[idx] = nextBucket;
  saveLedgers(nextLedgers);

  const list = await listPayoutRequestsMock();
  const row: PayoutRequestDto = {
    id: `po-${Date.now()}`,
    eventId: bucket.eventId,
    eventName: bucket.eventName,
    amount: body.amount,
    note: body.note,
    status: "pending",
    bankAccountSnapshot: bank,
    createdAt: new Date().toISOString(),
  };
  writeJson(LS_PAYOUTS, [row, ...list]);
  return row;
}

export async function getEventFinanceMock(
  eventId: string
): Promise<EventFinanceSummaryDto> {
  const found = getLedgers().find((e) => e.eventId === eventId);
  if (found) return { ...found };

  /** Event thật từ BE chưa có trong seed → túi rỗng + note */
  return {
    eventId,
    eventName: "Giải của bạn",
    eventStatus: "approved",
    ticketsSold: 0,
    grossRevenue: 0,
    platformFeePercent: 5,
    platformFeeAmount: 0,
    refundedTotal: 0,
    netToOrganizer: 0,
    escrowHeld: 0,
    withdrawnTotal: 0,
    payoutPending: 0,
    availableToWithdraw: 0,
    withdrawPolicyNote:
      "Chưa có giao dịch paid trên giải này (mock). Khi BE nối sẽ tính theo vé thật.",
    currency: "VND",
  };
}

export async function listMyRefundsMock(): Promise<RefundRequestDto[]> {
  return readJson(LS_REFUNDS, [] as RefundRequestDto[]);
}

export async function createRefundRequestMock(
  body: CreateRefundRequestDto
): Promise<RefundRequestDto> {
  const list = await listMyRefundsMock();
  if (
    list.some((r) => r.paymentId === body.paymentId && r.status !== "rejected")
  ) {
    throw new Error("Đã có yêu cầu hoàn tiền cho giao dịch này.");
  }

  const amount = body.amount && body.amount > 0 ? body.amount : 500_000;
  if (body.eventId) {
    const ledgers = getLedgers();
    const idx = ledgers.findIndex((e) => e.eventId === body.eventId);
    if (idx >= 0) {
      const b = ledgers[idx];
      const next: EventLedgerDto = {
        ...b,
        refundedTotal: b.refundedTotal + amount,
        escrowHeld: Math.max(0, b.escrowHeld - amount),
        availableToWithdraw: Math.max(0, b.availableToWithdraw - amount),
        netToOrganizer: Math.max(0, b.netToOrganizer - amount),
      };
      const nextLedgers = [...ledgers];
      nextLedgers[idx] = next;
      saveLedgers(nextLedgers);
    }
  }

  const row: RefundRequestDto = {
    id: `rf-${Date.now()}`,
    paymentId: body.paymentId,
    registrationId: "",
    eventId: body.eventId,
    amount,
    reason: body.reason,
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  writeJson(LS_REFUNDS, [row, ...list]);
  return row;
}
