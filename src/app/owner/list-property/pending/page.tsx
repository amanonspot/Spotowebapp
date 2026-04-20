"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OwnerBottomNav from "@/components/owner/OwnerBottomNav";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import { OwnerListingSummary } from "@/lib/adapters/types";
import { ownerAdapter } from "@/lib/adapters";

export default function OwnerListingPendingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [listings, setListings] = useState<OwnerListingSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const propertyId = searchParams.get("property_id") || "";

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const dashboard = await ownerAdapter.getDashboard();
                if (mounted) setListings(dashboard.listings);
            } catch {
                if (mounted) setListings([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, []);

    const listing = useMemo(() => {
        if (propertyId) {
            const matched = listings.find((item) => item.id === propertyId);
            if (matched) return matched;
        }
        return listings[0];
    }, [listings, propertyId]);

    return (
        <main className="min-h-screen bg-[#050507] pb-24 text-white">
            <div className="mx-auto max-w-[420px] px-4 py-5">
                <header className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.push("/owner/dashboard")}
                        className="rounded-full border border-white/25 px-3 py-1 text-sm text-white/85"
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="rounded-full border border-white/25 px-3 py-1 text-sm text-white/85"
                    >
                        Home
                    </button>
                </header>

                <section className="rounded-3xl border border-white/15 bg-[#101018] p-5">
                    <p className="text-center text-3xl">⏳</p>
                    <h1 className="mt-2 text-center text-3xl font-semibold">Property is under Review</h1>
                    <p className="mt-1 text-center text-sm text-white/60">Usually takes around 30 mins</p>

                    {loading ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0d0d14] p-4 text-sm text-white/70">
                            Loading listing details...
                        </div>
                    ) : listing ? (
                        <article className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14]">
                            <img src={listing.image} alt={listing.title} className="h-56 w-full object-cover" />
                            <div className="p-3">
                                <p className="text-xs text-[#cfb7ff]">Rare Find ✨</p>
                                <h2 className="text-xl font-semibold">{listing.title}</h2>
                                <p className="text-sm text-white/70">
                                    {listing.locality}, {listing.city}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-[#B7F041]">
                                    ₹{listing.rent.toLocaleString("en-IN")} / Month
                                </p>
                                <p className="text-sm text-white/65">₹{listing.deposit.toLocaleString("en-IN")} Deposit</p>
                            </div>
                        </article>
                    ) : (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0d0d14] p-4 text-sm text-white/70">
                            Listing submitted. You can check status from your dashboard.
                        </div>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <PrimaryButton
                            type="button"
                            className="h-11"
                            onClick={() =>
                                router.push(
                                    listing?.id ? `/owner/property/${listing.id}/edit` : "/owner/dashboard"
                                )
                            }
                        >
                            Review Listing
                        </PrimaryButton>
                        <button
                            type="button"
                            onClick={() => router.push("/owner/dashboard")}
                            className="h-11 rounded-xl border border-white/20 bg-transparent text-sm font-semibold text-white"
                        >
                            Need help?
                        </button>
                    </div>
                </section>
            </div>

            <OwnerBottomNav />
        </main>
    );
}
