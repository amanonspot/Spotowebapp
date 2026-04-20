"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OwnerEntryPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/owner/dashboard");
    }, [router]);

    return (
        <main className="min-h-screen bg-[#050507] text-white">
            <div className="mx-auto max-w-xl px-4 py-24 text-center text-white/80">Opening owner workspace...</div>
        </main>
    );
}
