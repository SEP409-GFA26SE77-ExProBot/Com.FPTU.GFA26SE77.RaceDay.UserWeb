import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ProfileDocumentsClient from "./ProfileDocumentsClient";

export default function ProfileDocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <ProfileDocumentsClient />
    </Suspense>
  );
}
