"use client";
import { getAccessToken } from "@/lib/auth-cookie";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, LogIn, Wallet } from "lucide-react";
import { getOrganizerWallet } from "@/api/finance";
import type { OrganizerWalletDto } from "@/dto/finance.dto";
import { formatPrice } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

/** Hub chọn giải → vào workspace ví của từng event */
export default function WalletHubPage() {
  const [boot, setBoot] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [wallet, setWallet] = useState<OrganizerWalletDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    setLoggedIn(Boolean(token));
    if (!token) {
      setBoot(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const w = await getOrganizerWallet();
        if (!cancelled) {
          setWallet(w);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được ví."));
        }
      } finally {
        if (!cancelled) setBoot(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (boot) {
    return (
      <PageLoading
        title="Đang tải…"
        description="Chọn giải để mở ví trong workspace tổ chức."
        icon={Wallet}
      />
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <LogIn className="h-10 w-10 text-orange-500" />
        <Link
          href="/login?from=/wallet"
          className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  const events = wallet?.events || [];

  return (
    <div className={`${PAGE_SHELL} max-w-2xl py-7`}>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-500">
        Ban tổ chức
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight">Chọn giải để mở ví</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ví & giải ngân nằm trong workspace từng giải (cùng Setup map / Simulation).
      </p>

      {wallet ? (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["Tổng DT", wallet.totalRevenue],
              ["Khả dụng", wallet.availableBalance],
              ["Escrow", wallet.pendingEscrow],
              ["Đã rút", wallet.withdrawnTotal],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-border/60 bg-card p-3 text-center shadow-sm"
            >
              <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
              <p className="text-sm font-extrabold text-orange-600">
                {formatPrice(value)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <ul className="mt-6 space-y-2">
        {events.length === 0 ? (
          <li className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Chưa có giải.{" "}
            <Link href="/my-events" className="font-semibold text-orange-600">
              Quản lý giải của tôi
            </Link>
          </li>
        ) : (
          events.map((e) => (
            <li key={e.eventId}>
              <Link
                href={`/organizer/events/${e.eventId}/wallet`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:border-orange-400/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{e.eventName}</p>
                  <p className="text-xs text-muted-foreground">
                    Khả dụng {formatPrice(e.availableToWithdraw)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-orange-500" />
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
