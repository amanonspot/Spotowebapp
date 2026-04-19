"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/components/BottomNavigation";
import Chip from "@/components/revamp/Chip";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import RevampPropertyCard from "@/components/revamp/PropertyCard";
import { propertyAdapter } from "@/lib/adapters";
import { HomeFeed, PropertyListItem } from "@/lib/adapters/types";

const initialFeed: HomeFeed = {
    categories: [],
    localities: [],
    recommended: [],
    listings: [],
    topEvents: [],
    promoBannerText: "",
};

const matchesCategory = (item: PropertyListItem, category: string) => {
    if (category.includes("Rent House")) return item.propertyTypes.includes("rent_house");
    if (category.includes("Zero Deposit")) return item.propertyTypes.includes("zero_deposit");
    if (category.includes("Co-Living")) return item.propertyTypes.includes("co_living");
    if (category.includes("PG")) return item.propertyTypes.includes("pg");
    if (category.includes("Pet Friendly")) return item.badges.some((badge) => badge.toLowerCase().includes("pet"));
    return true;
};

export default function HomePage() {
    const router = useRouter();
    const [feed, setFeed] = useState<HomeFeed>(initialFeed);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const loadFeed = async () => {
            try {
                setLoading(true);
                setError(null);
                const nextFeed = await propertyAdapter.getHomeFeed();
                if (mounted) {
                    setFeed(nextFeed);
                }
            } catch (feedError) {
                if (mounted) {
                    setFeed(initialFeed);
                    setError(feedError instanceof Error ? feedError.message : "Unable to load listings");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadFeed();

        return () => {
            mounted = false;
        };
    }, []);

    const visibleListings = useMemo(() => {
        if (!selectedCategory) return feed.listings;
        return feed.listings.filter((item) => matchesCategory(item, selectedCategory));
    }, [feed.listings, selectedCategory]);

    return (
        <main className="min-h-screen bg-[#050507] pb-24 text-white">
            <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-3 sm:px-6 lg:px-8">
                <section className="rounded-b-[36px] border-b border-[#7e59be] bg-[radial-gradient(circle_at_top,#241634,transparent_55%)] pb-8">
                    <div className="flex items-center justify-between gap-3 py-2">
                        <button
                            onClick={() => router.push("/owner")}
                            className="rounded-full border border-white/30 px-4 py-2 text-sm transition hover:border-[#A67AEB] hover:text-[#E8DBFF] active:scale-[0.99]"
                        >
                            List Your Property
                        </button>
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="h-10 w-10 rounded-full border border-white/30 text-lg transition hover:border-[#A67AEB] active:scale-[0.98]"
                        >
                            ⌾
                        </button>
                    </div>

                    <button
                        onClick={() => router.push("/search")}
                        className="mt-4 flex w-full items-center justify-between rounded-full border border-white/15 bg-[#121216] px-5 py-4 text-left transition hover:border-[#A67AEB]/70 active:scale-[0.995]"
                    >
                        <span className="text-base text-white/85">Let's find your new <b>House</b></span>
                        <span className="rounded-full bg-[#A67AEB] px-3 py-2 text-sm font-semibold">Search</span>
                    </button>

                    <div className="flex justify-center py-10">
                        <h1 className="text-6xl font-black tracking-tight text-[#F1FFE3] drop-shadow-[0_0_16px_rgba(183,240,65,0.35)]">
                            SPOTO
                        </h1>
                    </div>
                </section>

                <section className="mt-8">
                    <h2 className="mb-4 text-center text-3xl font-semibold">What are you looking for?</h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {feed.categories.map((category) => (
                            <Chip
                                key={category}
                                label={category}
                                selected={selectedCategory === category}
                                onClick={() => setSelectedCategory((prev) => (prev === category ? null : category))}
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-6 rounded-2xl bg-[#A67AEB] p-5 text-[#1b1028]">
                    <p className="text-sm font-semibold text-[#523884]">Validity: 7 days</p>
                    <p className="mt-2 text-3xl font-semibold">{feed.promoBannerText || "Find Verified Tenants with SPOTO for Free"}</p>
                </section>

                <section className="mt-8">
                    <h3 className="mb-4 text-center text-3xl font-semibold">Recommended Houses</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {feed.recommended.map((property) => (
                            <RevampPropertyCard
                                key={property.id}
                                property={property}
                                compact
                                onClick={() => router.push(`/booking/${property.id}`)}
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-3xl font-semibold">Top Events</h3>
                        <button onClick={() => router.push("/search")} className="text-sm font-semibold text-[#c5acff]">
                            Sort by
                        </button>
                    </div>
                    {error ? (
                        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                            {error}
                        </div>
                    ) : null}

                    {loading ? (
                        <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-6 text-center text-white/70">
                            Loading listings...
                        </div>
                    ) : visibleListings.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-6 text-center text-white/70">
                            No properties available right now.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {visibleListings.map((property) => (
                                <RevampPropertyCard
                                    key={property.id}
                                    property={property}
                                    onClick={() => router.push(`/booking/${property.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section className="mt-10 rounded-2xl border border-[#B7F041]/40 bg-[#101212] p-6 text-center">
                    <p className="text-sm text-[#B7F041]">Landlord Growth CTA</p>
                    <h3 className="mt-2 text-3xl font-semibold">Get verified tenants in top Bengaluru localities</h3>
                    <PrimaryButton className="mt-4" onClick={() => router.push("/owner")}>
                        Post Property for Free
                    </PrimaryButton>
                </section>
            </div>

            <BottomNavigation onSearchClick={() => router.push("/search")} />
        </main>
    );
}
