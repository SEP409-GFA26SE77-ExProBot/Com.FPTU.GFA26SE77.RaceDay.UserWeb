"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { toastError } from "@/lib/toast";

export default function StaffAccountMenu({ name }: { name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <div className="flex items-center gap-3">
    <span className="hidden max-w-48 truncate text-slate-300 sm:block">{name}</span>
    <button type="button" disabled={busy} className="min-h-11 rounded-lg border border-slate-600 px-3 disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        try { await useAuthStore.getState().logout(); router.replace("/login"); }
        catch (e) { toastError(e, "Không đăng xuất được."); }
        finally { setBusy(false); }
      }}>{busy ? "Đang đăng xuất…" : "Đăng xuất"}</button>
  </div>;
}
