"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { routePermission } from "@/lib/route-permissions";
import { mapAppRole } from "@/lib/role";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isInitialized, fetchMe } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const permission = routePermission(pathname);
  const denied = permission !== null && (!user || (permission !== "*" && !permission.includes(mapAppRole(user.roleName))));
  useEffect(() => {
    void fetchMe();
    const channel = new BroadcastChannel("raceday-session");
    const sync = () => { void useAuthStore.getState().fetchMe(); };
    channel.onmessage = () => { useAuthStore.getState().clearAuth(); sync(); router.refresh(); };
    window.addEventListener("focus", sync);
    return () => { channel.close(); window.removeEventListener("focus", sync); };
  }, [fetchMe, router]);
  useEffect(() => {
    if (!isInitialized || !denied) return;
    router.replace(user ? "/403" : "/login?from=" + encodeURIComponent(pathname + window.location.search));
  }, [isInitialized, denied, user, pathname, router]);
  if (!isInitialized || denied) return <div role="status" className="flex min-h-[50vh] items-center justify-center">Đang kiểm tra phiên đăng nhập…</div>;
  return <div key={user?.id || "guest"} className="contents">{children}</div>;
}
