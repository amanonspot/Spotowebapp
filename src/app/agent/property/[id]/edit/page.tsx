"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import OwnerListingWizard from "@/components/owner/OwnerListingWizard";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function AgentPropertyEditPage({ params }: PageProps) {
    const router = useRouter();
    const { id } = use(params);

    return (
        <main className="min-h-[100dvh] min-h-screen bg-[#050507] pb-[max(6.5rem,calc(5.5rem+env(safe-area-inset-bottom,0px)))] text-white md:pb-8">
            <div className="mx-auto w-full max-w-full px-4 py-4 sm:px-6 md:max-w-2xl md:px-7 lg:max-w-4xl xl:max-w-5xl">
                <header className="mb-4 rounded-2xl border border-white/15 bg-[#101018] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/agent/dashboard")}
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
                    <h1 className="mt-3 text-2xl font-semibold">Edit Listing</h1>
                    <p className="mt-1 text-sm text-white/70">Update property details for the owner.</p>
                </header>

                <OwnerListingWizard flow="agent" mode="edit" propertyId={id} />
            </div>
        </main>
    );
}
