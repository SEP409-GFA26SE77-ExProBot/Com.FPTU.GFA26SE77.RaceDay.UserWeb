import MyEventsClient from "./MyEventsClient";

export const metadata = {
  description: "Quản lý các giải chạy bạn đã tạo trên RaceDay",
};

export default function MyEventsPage() {
  return <MyEventsClient />;
}
