import EventsClient from "../events/EventsClient";

export default function RegisterEventPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Đăng ký tham gia giải chạy
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Chọn giải chạy phù hợp, cự ly mong muốn và ghi danh để nhận số BIB chính thức.
        </p>
      </div>

      <EventsClient />
    </div>
  );
}