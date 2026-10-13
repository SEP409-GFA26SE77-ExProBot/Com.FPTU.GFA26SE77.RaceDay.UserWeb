import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProfileContentClient from "./ProfileContentClient";

export default function ProfileContentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <ProfileContentClient />
    </Suspense>
  );
}
