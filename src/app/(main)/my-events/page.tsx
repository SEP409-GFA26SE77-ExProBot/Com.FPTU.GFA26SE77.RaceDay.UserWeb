import MyEventsClient from "./MyEventsClient";

export const metadata = {
  title: "Giải của tôi – RaceDay",
  description: "Quản lý các giải chạy bạn đã tạo trên RaceDay",
};

export default function MyEventsPage() {
  return <MyEventsClient />;
}
