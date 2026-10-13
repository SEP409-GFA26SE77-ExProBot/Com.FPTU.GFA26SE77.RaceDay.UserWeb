import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProfileAdditionClient from "./ProfileAdditionClient";

export default function ProfileAdditionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="mt-3 text-sm text-muted-foreground">Đang tải…</p>
        </div>
      }
    >
      <ProfileAdditionClient />
    </Suspense>
  );
}
