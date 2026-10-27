import type { Metadata } from "next";
import RegisteredEventsClient from "./RegisteredEventsClient";

export const metadata: Metadata = {
  description:
    "Theo dõi các giải chạy bạn đã đăng ký và trạng thái hồ sơ trên RaceDay.",
};

export default function RegisteredEventsPage() {
  return <RegisteredEventsClient />;
}
