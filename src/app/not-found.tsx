import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center gap-4">
      <p className="text-6xl font-extrabold text-orange-500">404</p>
      <h1 className="text-2xl font-bold">Không tìm thấy trang</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Đường dẫn không tồn tại hoặc đã được di chuyển. Kiểm tra lại URL hoặc quay về trang chủ.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          Về trang chủ
        </Link>
        <Link
          href="/events"
          className="rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          Xem giải chạy
        </Link>
      </div>
    </div>
  );
}
