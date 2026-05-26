"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, Search, UserCircle2 } from "lucide-react";
import BlurImage from "@/components/revamp/BlurImage";
import ShimmerBlock from "@/components/revamp/ShimmerBlock";
import { agentAdapter } from "@/lib/adapters";
import { PropertyListItem } from "@/lib/adapters/types";

const formatMonth = () =>
    new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date());

const formatCurrency = (value: number) =>
    value > 0 ? `₹${value.toLocaleString("en-IN")}` : null;

const statusMeta = (item: PropertyListItem): { label: string; color: string } => {
    const s = `${item.verificationStatus || item.status || ""}`.toLowerCase();
    if (s.includes("live"))           return { label: "Live",               color: "bg-[#b7f041]/15 text-[#b7f041] ring-[#b7f041]/30" };
    if (s.includes("awaiting_owner")) return { label: "Awaiting owner login", color: "bg-amber-500/10 text-amber-300 ring-amber-400/30" };
    if (s.includes("reject"))         return { label: "Rejected",            color: "bg-red-500/10 text-red-300 ring-red-400/30" };
    return                                   { label: "In review",           color: "bg-white/10 text-white/70 ring-white/20" };
};

function DashboardSkeleton() {
    return (
        <div className="space-y-5 sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0 lg:grid-cols-1 lg:space-y-5">
            <ShimmerBlock className="h-64 w-full rounded-2xl" />
            <ShimmerBlock className="h-64 w-full rounded-2xl" />
        </div>
    );
}

export default function AgentDashboardPage() {
    const router = useRouter();
    const [listings, setListings] = useState<PropertyListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const load = useCallback(async (mode: "initial" | "sync" = "initial") => {
        if (mode === "initial") setLoading(true);
        if (mode === "sync") setSyncing(true);
        setError(null);
        try {
            const items = await agentAdapter.listAgentProperties();
            setListings(items);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unable to load your listings.");
        } finally {
            if (mode === "initial") setLoading(false);
            if (mode === "sync") setSyncing(false);
        }
    }, []);

    useEffect(() => { load("initial"); }, [load]);

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const visible = useMemo(() => {
        if (!normalizedSearch) return listings;
        return listings.filter((item) =>
            [item.title, item.propertyTitle, item.locality, item.city].some(
                (v) => v && v.toLowerCase().includes(normalizedSearch)
            )
        );
    }, [listings, normalizedSearch]);

    return (
        <main className="min-h-screen bg-[#050507] pb-10 text-white">
            <div className="mx-auto w-full max-w-full px-4 py-4 sm:px-6 md:max-w-2xl md:px-7 lg:max-w-5xl lg:px-8 xl:max-w-6xl">

                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#16161f] text-white/85 transition hover:border-[#A67AEB] hover:text-white active:scale-[0.98]"
                            aria-label="Back to home"
                        >
                            <UserCircle2 className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">Field Agent</h1>
                            <p className="text-sm text-white/50">{formatMonth()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full border border-white/20 bg-[#0d0d14] px-4 py-1.5 text-sm font-medium">
                            {listings.length} Listing{listings.length !== 1 ? "s" : ""}
                        </span>
                        <button
                            type="button"
                            onClick={() => router.push("/agent/list-property")}
                            className="btn-shimmer rounded-full border border-[#A67AEB]/70 bg-[#A67AEB]/10 px-5 py-2 text-sm font-semibold text-[#e8daff] transition hover:border-[#B991F4] hover:bg-[#A67AEB]/20 active:scale-[0.98]"
                        >
                            + Add Listing
                        </button>
                        <button
                            type="button"
                            onClick={() => load("sync")}
                            disabled={syncing || loading}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0d0d14] text-white/50 transition hover:text-white disabled:opacity-40"
                            aria-label="Refresh"
                        >
                            <RotateCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </header>

                {/* Search */}
                <div className="input-glow mt-5 flex items-center gap-2 rounded-xl border border-white/12 bg-[#0d0d14] px-4 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-white/40" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title, locality, city..."
                        className="w-full bg-transparent text-sm text-white/90 outline-none placeholder:text-white/35"
                    />
                </div>

                {/* Error */}
                {error ? (
                    <div className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-3 text-sm text-red-100">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => load("initial")}
                            className="mt-2 rounded-lg border border-red-300/40 px-2 py-1 text-xs"
                        >
                            Retry
                        </button>
                    </div>
                ) : null}

                {/* Listings */}
                <section className="mt-5">
                    <h2 className="mb-4 text-lg font-semibold text-white/70">Your Listings</h2>

                    {loading ? (
                        <DashboardSkeleton />
                    ) : visible.length === 0 ? (
                        <div className="rounded-2xl border border-white/15 bg-[#101018] p-5 text-sm text-white/70">
                            {listings.length === 0
                                ? "No listings yet. Tap \"+ Add Listing\" to create one for a property owner."
                                : "No listings match your search."}
                        </div>
                    ) : (
                        <div className="space-y-5 sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0 lg:grid-cols-3 lg:gap-6 lg:space-y-0">
                            {visible.map((item) => {
                                const { label, color } = statusMeta(item);
                                const rent = formatCurrency(item.pricePerMonth);
                                const deposit = formatCurrency(item.deposit);
                                return (
                                    <article
                                        key={item.id}
                                        className="card-hover overflow-hidden rounded-2xl border border-white/12 bg-[#101018] shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                                    >
                                        <div className="relative h-52 sm:h-48">
                                            <BlurImage
                                                src={item.image}
                                                alt={item.propertyTitle || item.title}
                                                wrapperClassName="h-full w-full"
                                                className="img-zoom h-full w-full"
                                            />
                                            <span className={`absolute right-3 top-3 rounded-xl px-3 py-1 text-xs font-semibold ring-1 ${color}`}>
                                                {label}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-lg font-bold leading-tight">
                                                {item.propertyTitle || item.title}
                                            </h3>
                                            <p className="mt-0.5 text-sm text-white/60">
                                                {item.locality}{item.city ? `, ${item.city}` : ""}
                                            </p>
                                            {rent ? (
                                                <p className="mt-2 text-xl font-bold text-[#B7F041]">
                                                    {rent}
                                                    <span className="text-sm font-medium text-[#B7F041]/70"> / Month</span>
                                                </p>
                                            ) : null}
                                            {deposit ? (
                                                <p className="text-sm text-white/55">{deposit} Deposit</p>
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/agent/property/${item.id}/edit`)}
                                                className="mt-4 w-full rounded-xl border border-[#A67AEB]/40 bg-[#A67AEB]/10 px-4 py-2.5 text-sm font-semibold text-[#D9C4FF] transition hover:bg-[#A67AEB]/20"
                                            >
                                                Edit listing
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
