import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PackageReturnClient from "./PackageReturnClient";

export const metadata = {
  description: "Xác nhận thanh toán gói tổ chức — RaceDay",
};

export default function PackageReturnPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="mt-3 text-sm text-muted-foreground">Đang xác nhận thanh toán…</p>
          </div>
        }
      >
        <PackageReturnClient />
      </Suspense>
    </div>
  );
}
