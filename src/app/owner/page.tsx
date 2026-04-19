"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ownerAdapter } from "@/lib/adapters";
import { RENTALS_MOCK_MODE } from "@/lib/rentals";

export default function OwnerEntryPage() {
    const router = useRouter();

    useEffect(() => {
        let mounted = true;
        const decide = async () => {
            try {
                const route = await ownerAdapter.getOwnerEntryRoute();
                if (mounted) router.replace(route);
            } catch {
                if (mounted) router.replace(RENTALS_MOCK_MODE ? "/owner/list-property" : "/auth/login");
            }
        };
        decide();
        return () => {
            mounted = false;
        };
    }, [router]);

    return (
        <main className="min-h-screen bg-[#050507] text-white">
            <div className="mx-auto max-w-xl px-4 py-24 text-center text-white/80">Opening owner workspace...</div>
        </main>
    );
}
