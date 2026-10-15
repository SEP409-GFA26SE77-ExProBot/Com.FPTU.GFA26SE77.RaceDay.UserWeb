import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProfileDistancesClient from "./ProfileDistancesClient";

export default function ProfileDistancesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="mt-3 text-sm text-muted-foreground">Đang tải…</p>
        </div>
      }
    >
      <ProfileDistancesClient />
    </Suspense>
  );
}
