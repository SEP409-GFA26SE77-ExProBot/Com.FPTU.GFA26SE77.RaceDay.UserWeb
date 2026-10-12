/**
 * Escrow / ví organizer / hoàn tiền — ledger theo từng giải.
 * MOCK mặc định: NEXT_PUBLIC_FINANCE_USE_MOCK !== "false"
 */
import api from "@/config/axios";
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

const FINANCE_API = "api/v1/finance";

export const FINANCE_USE_MOCK =
  process.env.NEXT_PUBLIC_FINANCE_USE_MOCK !== "false";

export async function getOrganizerWallet(): Promise<OrganizerWalletDto> {
  if (FINANCE_USE_MOCK) {
    const m = await import("./finance.mock");
    return m.getOrganizerWalletMock();
  }
  return api.get(`${FINANCE_API}/organizer/wallet`);
}

export async function listEventLedgers(): Promise<EventLedgerDto[]> {
  if (FINANCE_USE_MOCK) {
    const m = await import("./finance.mock");
    return m.listEventLedgersMock();
  }
  return api.get(`${FINANCE_API}/organizer/events/ledgers`);
}

export async function saveOrganizerBankAccount(
  account: BankAccountDto
): Promise<OrganizerWalletDto> {
  if (FINANCE_USE_MOCK) {
    const m = await import("./finance.mock");
    return m.saveBankAccountMock(account);
  }
  return api.put(`${FINANCE_API}/organizer/bank-account`, account);
}

export async function listPayoutRequests(
  eventId?: string
): Promise<PayoutRequestDto[]> {
  if (FINANCE_USE_MOCK) {
    const m = await import("./finance.mock");
    return m.listPayoutRequestsMock(eventId);
  }
  const q = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
  return api.get(`${FINANCE_API}/organizer/payouts${q}`);
}

export async function createPayoutRequest(
  body: CreatePayoutRequestDto
): Promise<PayoutRequestDto> {
  if (!body.eventId?.trim()) {
    throw new Error("Phải chọn giải để rút.");
  }
  if (FINANCE_USE_MOCK) {
    const m = await import("./finance.mock");
    return m.createPayoutRequestMock(body);
  }
  return api.post(`${FINANCE_API}/organizer/payouts`, body);
}

export async function getEventFinanceSummary(
  eventId: string
): Promise<EventFinanceSummaryDto> {
  if (FINANCE_USE_MOCK) {
    const m = await import("./finance.mock");
    return m.getEventFinanceMock(eventId);
  }
  return api.get(`${FINANCE_API}/organizer/events/${eventId}/summary`);
}

export async function listMyRefundRequests(): Promise<RefundRequestDto[]> {
  if (FINANCE_USE_MOCK) {
    const m = await import("./finance.mock");
    return m.listMyRefundsMock();
  }
  return api.get(`${FINANCE_API}/runner/refunds`);
}

export async function createRefundRequest(
  body: CreateRefundRequestDto
): Promise<RefundRequestDto> {
  if (FINANCE_USE_MOCK) {
    const m = await import("./finance.mock");
    return m.createRefundRequestMock(body);
  }
  return api.post(`${FINANCE_API}/runner/refunds`, body);
}
