"use client";

import React from "react";
import { useRouter } from "next/navigation";
import OwnerBottomNav from "@/components/owner/OwnerBottomNav";
import OwnerListingForm from "@/components/owner/OwnerListingForm";

export default function OwnerListPropertyPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-[#050507] pb-24 text-white">
            <div className="mx-auto w-full max-w-4xl px-4 py-4 md:px-6">
                <header className="mb-4 rounded-2xl border border-white/15 bg-[#101018] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/owner/dashboard")}
                            className="rounded-full border border-white/25 px-3 py-1 text-sm text-white/80 hover:text-white"
                        >
                            ← Dashboard
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="rounded-full border border-white/25 px-3 py-1 text-sm text-white/80 hover:text-white"
                        >
                            Home
                        </button>
                    </div>
                    <h1 className="mt-3 text-2xl font-semibold">SPOTO · List Your Property</h1>
                    <p className="mt-1 text-sm text-white/70">
                        Publish your listing with API-backed create flow and mock-safe fallbacks.
                    </p>
                </header>

                <OwnerListingForm mode="create" />
            </div>

            <OwnerBottomNav />
        </main>
    );
}

