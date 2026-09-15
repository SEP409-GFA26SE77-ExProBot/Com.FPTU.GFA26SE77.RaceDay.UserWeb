"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ErrorAuthorization() {
    const router = useRouter()
    return (
        <div className="h-screen flex flex-col bg-white items-center justify-center overflow-hidden">
            <h1 className="text-[15vmin] mb-0">
                Forbidden!
            </h1>

            <h2 className="text-[5vmin] mt-0 mb-10">
                Code 403
            </h2>
            <Button
                variant="outline"
                size="lg"
                className="w-48 h-14 text-lg border-black"
                onClick={() => router.push('/')}
            >
                Back to Home
            </Button>
        </div>
    );
}