"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ErrorAuthorization() {
    const router = useRouter()
    return (
        <div className="h-screen flex flex-col bg-white items-center justify-center overflow-hidden">
            <h1 className="text-[12vmin] font-bold text-slate-800 mb-0">
                Không có quyền truy cập!
            </h1>

            <h2 className="text-[4vmin] text-slate-500 mt-2 mb-10">
                Mã lỗi: 403 Forbidden
            </h2>
            <Button
                variant="outline"
                size="lg"
                className="w-48 h-14 text-lg border-black font-medium"
                onClick={() => router.push('/')}
            >
                Về trang chủ
            </Button>
        </div>
    );
}