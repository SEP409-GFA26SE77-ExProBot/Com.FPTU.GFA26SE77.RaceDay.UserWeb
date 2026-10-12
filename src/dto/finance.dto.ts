/** Escrow / ví / giải ngân / hoàn tiền — ledger theo từng giải */

export type PayoutRequestStatus =
  | "pending"
  | "approved"
  | "transferred"
  | "rejected";

export type RefundRequestStatus =
  | "none"
  | "eligible"
  | "requested"
  | "processing"
  | "refunded"
  | "rejected";

export interface BankAccountDto {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  /** Chi nhánh NH — optional, khớp BeneficiaryAccount.branch */
  branch?: string;
  /** Gợi ý nội dung CK khi Admin giải ngân — optional, khớp transferNote */
  transferNote?: string;
  bin?: string;
}

/** Túi tiền escrow của một giải */
export interface EventLedgerDto {
  eventId: string;
  eventName: string;
  eventStatus: string;
  ticketsSold: number;
  grossRevenue: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  refundedTotal: number;
  netToOrganizer: number;
  /** Escrow còn giữ (chưa rút / chưa pending rút) */
  escrowHeld: number;
  /** Đã chuyển thành công cho BTC */
  withdrawnTotal: number;
  /** Lệnh rút đang chờ Admin */
  payoutPending: number;
  /** Có thể xin rút theo policy giai đoạn giải */
  availableToWithdraw: number;
  /** vd: "Tối đa 50% trước race day" */
  withdrawPolicyNote: string;
  currency: string;
}

export interface OrganizerWalletDto {
  /** Tổng hợp từ các EventLedger */
  totalRevenue: number;
  availableBalance: number;
  pendingEscrow: number;
  withdrawnTotal: number;
  currency: string;
  bankAccount: BankAccountDto | null;
  events: EventLedgerDto[];
}

export interface PayoutRequestDto {
  id: string;
  /** Bắt buộc — rút từ túi giải này */
  eventId: string;
  eventName: string;
  amount: number;
  note?: string;
  status: PayoutRequestStatus;
  rejectReason?: string;
  bankAccountSnapshot?: BankAccountDto;
  createdAt: string;
  updatedAt?: string;
  transferredAt?: string;
  receiptUrl?: string;
}

export interface CreatePayoutRequestDto {
  amount: number;
  /** Bắt buộc — không rút gộp nhiều giải */
  eventId: string;
  note?: string;
}

export interface EventFinanceSummaryDto extends EventLedgerDto {
  /** Alias rõ nghĩa trên tab Tài chính */
}

export interface RefundRequestDto {
  id: string;
  paymentId: string;
  registrationId: string;
  eventId?: string;
  amount: number;
  reason: string;
  status: RefundRequestStatus;
  createdAt: string;
  updatedAt?: string;
  rejectReason?: string;
}

export interface CreateRefundRequestDto {
  paymentId: string;
  reason: string;
  eventId?: string;
  amount?: number;
}
