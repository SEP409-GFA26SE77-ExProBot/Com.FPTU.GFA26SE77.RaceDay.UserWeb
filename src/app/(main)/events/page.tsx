import type { Metadata } from "next";
import { Suspense } from "react";
import EventsClient from "./EventsClient";

export const metadata: Metadata = {
  title: "Giải chạy | RaceDay - Đăng ký giải chạy tại Việt Nam",
  description:
    "Duyệt và đăng ký giải chạy, marathon, trail và fun run trên khắp Việt Nam. Tìm giải tiếp theo của bạn ngay hôm nay.",
};

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
        </div>
      }
    >
      <EventsClient />
    </Suspense>
  );
}
