"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";
import { Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  return <VerifyEmailCard initialEmail={emailParam} redirectOnSuccess="/login" />;
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-card flex items-center justify-center p-12 text-slate-400">
          <Loader2 className="animate-spin text-orange-500 mr-2" size={24} />
          <span>Đang tải trang xác thực…</span>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
