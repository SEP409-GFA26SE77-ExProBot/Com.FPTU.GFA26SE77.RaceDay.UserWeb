import MyEventsClient from "./MyEventsClient";
import { Suspense } from "react";

export const metadata = {
  description: "Quản lý các giải chạy bạn đã tạo trên RaceDay",
};

export default function MyEventsPage() {
  return (
    <Suspense fallback={<div role="status" className="p-8 text-center text-sm text-muted-foreground">Đang tải quản lý giải…</div>}>
      <MyEventsClient />
    </Suspense>
  );
}
