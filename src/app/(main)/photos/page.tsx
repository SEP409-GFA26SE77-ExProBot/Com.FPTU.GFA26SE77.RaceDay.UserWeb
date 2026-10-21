"use client";
import { isLoggedIn } from "@/lib/auth-cookie";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, Ticket } from "lucide-react";
import { getMyRegistrations } from "@/api/events";
import { RegistrationDto } from "@/dto/event.dto";
import { getApiErrorMessage } from "@/lib/error";
import { PAGE_SHELL } from "@/lib/page-shell";
import PageLoading from "@/components/ui/PageLoading";

function PhotosInner() {
  const searchParams = useSearchParams();
  const bibQuery = searchParams.get("bib") || "";
  const [regs, setRegs] = useState<RegistrationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await getMyRegistrations();
        if (!cancelled) {
          setRegs(
            (Array.isArray(list) ? list : []).filter((r) => Boolean(r.bibNumber))
          );
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Không tải được đăng ký."));
          setRegs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  if (loading) {
    return (
      <PageLoading
        title="Đang tải…"
        description="Chuẩn bị tìm ảnh theo BIB."
        icon={Camera}
      />
    );
  }

  return (
    <div className={`${PAGE_SHELL} py-7 space-y-6`}>
      <div>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
          Ảnh sự kiện
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Tìm ảnh theo BIB</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Module ảnh / photographer chưa có API trên backend — không hiển thị ảnh giả.
          {bibQuery ? ` (Bạn đang tìm BIB ${bibQuery})` : ""}
        </p>
      </div>

      <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center space-y-3">
        <Camera className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="font-bold text-lg">Chưa có thư viện ảnh từ máy chủ</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Khi Photo service được nối, tìm kiếm theo BIB sẽ hoạt động tại đây.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loggedIn && regs.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <Ticket className="h-4 w-4 text-orange-500" />
            BIB của bạn (từ đăng ký thật)
          </h2>
          <ul className="flex flex-wrap gap-2">
            {regs.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/my-registrations/${r.id}`}
                  className="inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold hover:border-orange-500/40"
                >
                  BIB {r.bibNumber} · {r.eventName || "Giải"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loggedIn && (
        <p className="text-sm text-muted-foreground">
          <Link href="/login?from=/photos" className="text-orange-600 font-semibold">
            Đăng nhập
          </Link>{" "}
          để xem BIB từ đăng ký của bạn.
        </p>
      )}
    </div>
  );
}

export default function PhotosPage() {
  return (
    <Suspense
      fallback={
        <PageLoading title="Đang tải…" description="Chuẩn bị trang ảnh." icon={Camera} />
      }
    >
      <PhotosInner />
    </Suspense>
  );
}
