import { Suspense } from "react";
import { PAGE_SHELL } from "@/lib/page-shell";
import CreateEventClient from "./CreateEventClient";

export const metadata = {
  description: "Đăng ký tổ chức giải chạy trên RaceDay",
};

export default function CreateEventPage() {
  return (
    <div className={`${PAGE_SHELL} py-8 sm:py-10`}>
      <Suspense
        fallback={
          <p className="text-sm font-medium text-muted-foreground">
            Đang tải form tạo giải…
          </p>
        }
      >
        <CreateEventClient />
      </Suspense>
    </div>
  );
}
