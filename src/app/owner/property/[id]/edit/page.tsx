"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OwnerBottomNav from "@/components/owner/OwnerBottomNav";
import OwnerListingForm from "@/components/owner/OwnerListingForm";
import { OwnerListingFormInput } from "@/lib/adapters/types";
import { ownerAdapter } from "@/lib/adapters";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function OwnerPropertyEditPage({ params }: PageProps) {
    const router = useRouter();
    const { id } = use(params);
    const [initialValue, setInitialValue] = useState<OwnerListingFormInput | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const form = await ownerAdapter.getPropertyForEdit(id);
                if (mounted) setInitialValue(form);
            } catch (loadError) {
                if (mounted) setError(loadError instanceof Error ? loadError.message : "Unable to load listing");
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [id]);

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
                    <h1 className="mt-3 text-2xl font-semibold">Edit Property</h1>
                    <p className="mt-1 text-sm text-white/70">Update listing details and publish latest values.</p>
                </header>

                {error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                        {error}
                    </div>
                ) : null}

                {initialValue ? (
                    <OwnerListingForm mode="edit" propertyId={id} initialValue={initialValue} />
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-4 text-white/70">
                        Loading editable listing...
                    </div>
                )}
            </div>

            <OwnerBottomNav />
        </main>
    );
}

