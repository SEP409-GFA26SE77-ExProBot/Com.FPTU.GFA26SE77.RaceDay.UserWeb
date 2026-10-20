"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  History,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  createPayoutRequest,
  FINANCE_USE_MOCK,
  getEventFinanceSummary,
  getOrganizerWallet,
  saveOrganizerBankAccount,
} from "@/api/finance";
import type {
  BankAccountDto,
  EventFinanceSummaryDto,
  OrganizerWalletDto,
} from "@/dto/finance.dto";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { toastError, toastSuccess } from "@/lib/toast";
import { PAGE_SHELL } from "@/lib/page-shell";

export default function OrganizerEventWallet({ eventId }: { eventId: string }) {
  const [wallet, setWallet] = useState<OrganizerWalletDto | null>(null);
  const [ledger, setLedger] = useState<EventFinanceSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bank, setBank] = useState<BankAccountDto>({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    branch: "",
    transferNote: "",
  });
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {

    try {
      const [w, ev] = await Promise.all([
        getOrganizerWallet(),
        getEventFinanceSummary(eventId),
      ]);
      setWallet(w);
      setLedger(ev);
      if (w.bankAccount) setBank(w.bankAccount);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được ví giải."));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const saveBank = async () => {
    setBusy(true);

    try {
      const w = await saveOrganizerBankAccount(bank);
      setWallet(w);
      toastSuccess("Đã lưu tài khoản nhận giải ngân.");
    } catch (e) {
      toastError(e, "Lưu TK thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const submitPayout = async () => {
    const value = Number(amount.replace(/\D/g, ""));
    setBusy(true);

    try {
      await createPayoutRequest({
        eventId,
        amount: value,
        note: note.trim() || undefined,
      });
      setAmount("");
      setNote("");
      toastSuccess("Đã gửi yêu cầu rút từ túi giải này — chờ Admin duyệt.");
      await load();
    } catch (e) {
      toastError(e, "Tạo yêu cầu rút thất bại.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        Đang tải ví & giải ngân…
      </div>
    );
  }

  return (
    <div className={`${PAGE_SHELL} space-y-5 py-1`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Ví & giải ngân
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            {ledger?.eventName || "Giải đang mở"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rút tiền chỉ từ túi escrow của giải đang mở — các giải khác không bị
            trừ.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/organizer/events/${eventId}/payout-history`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
          >
            <History className="h-3.5 w-3.5" /> Lịch sử giải ngân
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </button>
        </div>
      </div>

      {FINANCE_USE_MOCK ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Đang dùng finance mock (NEXT_PUBLIC_FINANCE_USE_MOCK=true) — doanh thu /
          hoàn tiền không đồng bộ PayOS thật. Tắt flag và reload để đọc ledger BE.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section className="space-y-2 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <FileText className="h-4 w-4 text-orange-500" />
          Chính sách tài chính (tóm tắt)
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
          <li>
            <strong className="text-foreground">Hoàn tiền VĐV:</strong> theo
            trạng thái thanh toán / yêu cầu hoàn trên RaceDay; số đã hoàn hiện ở
            «Hoàn tiền VĐV» của túi giải.
          </li>
          <li>
            <strong className="text-foreground">Hoa hồng / phí nền tảng:</strong>{" "}
            đang chờ Business Rule — chưa cấu hình trên UI này.
          </li>
          <li>
            <strong className="text-foreground">Rút tiền BTC:</strong> chỉ từ túi
            escrow của <em>giải đang mở</em>; cần TK nhận hợp lệ và chờ Admin
            duyệt yêu cầu rút.
            {ledger?.withdrawPolicyNote
              ? ` ${ledger.withdrawPolicyNote}`
              : ""}
          </li>
        </ul>
      </section>

      {ledger ? (
        <section className="space-y-3 rounded-2xl border border-orange-300/50 bg-orange-500/[0.06] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Wallet className="h-4 w-4 text-orange-500" />
            Túi giải đang mở
          </div>
          <p className="text-xs text-muted-foreground">{ledger.withdrawPolicyNote}</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["Doanh thu giải", ledger.grossRevenue],
                ["Hoàn tiền VĐV", ledger.refundedTotal],
                ["Khả dụng rút (giải này)", ledger.availableToWithdraw],
                ["Escrow giữ / pending", ledger.escrowHeld + ledger.payoutPending],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border/50 bg-card/80 p-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-0.5 text-lg font-extrabold text-orange-600">
                  {formatPrice(value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Building2 className="h-4 w-4 text-orange-500" />
            Tài khoản nhận giải ngân
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs sm:col-span-2">
              <span className="font-semibold text-muted-foreground">Ngân hàng</span>
              <input
                value={bank.bankName}
                onChange={(e) =>
                  setBank((b) => ({ ...b, bankName: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-muted-foreground">
                Số tài khoản
              </span>
              <input
                value={bank.accountNumber}
                onChange={(e) =>
                  setBank((b) => ({ ...b, accountNumber: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-muted-foreground">
                Chủ tài khoản
              </span>
              <input
                value={bank.accountHolderName}
                onChange={(e) =>
                  setBank((b) => ({ ...b, accountHolderName: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-muted-foreground">
                Chi nhánh
              </span>
              <input
                value={bank.branch || ""}
                onChange={(e) =>
                  setBank((b) => ({ ...b, branch: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="Đà Nẵng, Hà Nội,…"
              />
            </label>
            <label className="block space-y-1 text-xs sm:col-span-2">
              <span className="font-semibold text-muted-foreground">
                Nội dung CK giải ngân (gợi ý)
              </span>
              <input
                value={bank.transferNote || ""}
                onChange={(e) =>
                  setBank((b) => ({ ...b, transferNote: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="Giai ngan BTC + ten giai"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy || !bank.bankName || !bank.accountNumber}
            onClick={() => void saveBank()}
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            Lưu tài khoản
          </button>
        </section>

        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-bold">Xin rút từ giải này</h2>
          <p className="text-xs text-muted-foreground">
            Số tiền ≤ khả dụng của túi giải đang mở
            {ledger
              ? ` (${formatPrice(ledger.availableToWithdraw)})`
              : ""}
            .
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-muted-foreground">
                Số tiền (VND)
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                inputMode="numeric"
                placeholder="5000000"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-muted-foreground">Ghi chú</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                placeholder="Đợt rút…"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy || !amount}
            onClick={() => void submitPayout()}
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            Gửi yêu cầu giải ngân
          </button>
        </section>
      </div>
    </div>
  );
}
