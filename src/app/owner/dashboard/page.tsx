"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OwnerBottomNav from "@/components/owner/OwnerBottomNav";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import { OwnerDashboardData } from "@/lib/adapters/types";
import { ownerAdapter } from "@/lib/adapters";

const emptyDashboard: OwnerDashboardData = {
    ownerName: "Owner",
    creditsLeft: 0,
    listings: [],
    leads: [],
};

export default function OwnerDashboardPage() {
    const router = useRouter();
    const [dashboard, setDashboard] = useState<OwnerDashboardData>(emptyDashboard);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const next = await ownerAdapter.getDashboard();
                if (mounted) setDashboard(next);
            } catch (loadError) {
                if (mounted) {
                    const message = loadError instanceof Error ? loadError.message : "Unable to load dashboard";
                    setError(message);
                    if (message.toLowerCase().includes("session") || message.toLowerCase().includes("unauthorized")) {
                        router.push("/auth/login");
                    }
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [router]);

    const unlockedCount = useMemo(
        () => dashboard.leads.filter((lead) => lead.state === "unlocked").length,
        [dashboard.leads]
    );

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const visibleListings = useMemo(() => {
        if (!normalizedSearch) return dashboard.listings;
        return dashboard.listings.filter((listing) =>
            [listing.title, listing.locality, listing.city].some((value) => value.toLowerCase().includes(normalizedSearch))
        );
    }, [dashboard.listings, normalizedSearch]);

    const visibleLeads = useMemo(() => {
        if (!normalizedSearch) return dashboard.leads;
        return dashboard.leads.filter((lead) =>
            [lead.tenantName, lead.phone, lead.phoneMasked].some((value) => value.toLowerCase().includes(normalizedSearch))
        );
    }, [dashboard.leads, normalizedSearch]);

    const handleUnlock = async (leadId: string) => {
        try {
            const unlocked = await ownerAdapter.unlockLead(leadId);
            setDashboard((prev) => ({
                ...prev,
                creditsLeft: Math.max(0, prev.creditsLeft - 1),
                leads: prev.leads.map((lead) => (lead.id === leadId ? unlocked : lead)),
            }));
        } catch (unlockError) {
            setError(unlockError instanceof Error ? unlockError.message : "Unable to unlock lead");
        }
    };

    return (
        <main className="min-h-screen bg-[#050507] pb-24 text-white">
            <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
                <header className="rounded-2xl border border-white/15 bg-[#101018] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-2xl font-semibold">Welcome {dashboard.ownerName}</h1>
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="rounded-full border border-white/25 px-3 py-1 text-sm text-white/80 hover:text-white"
                        >
                            Home
                        </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#A67AEB]/20 px-3 py-1 text-xs text-[#cfb7ff]">
                            Free Credits: {dashboard.creditsLeft} Left
                        </span>
                        <span className="rounded-full bg-[#B7F041]/20 px-3 py-1 text-xs text-[#DFF8A2]">
                            Unlocked Leads: {unlockedCount}
                        </span>
                    </div>
                    <PrimaryButton
                        className="mt-4"
                        onClick={() => router.push("/owner/list-property")}
                    >
                        List Your Property
                    </PrimaryButton>

                    <div className="mt-4 rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2">
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search listings or leads"
                            className="w-full bg-transparent text-sm text-white/90 outline-none placeholder:text-white/40"
                        />
                    </div>
                </header>

                {error ? (
                    <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                        {error}
                    </div>
                ) : null}

                <section className="mt-6">
                    <h2 className="mb-3 text-xl font-semibold">My Properties</h2>
                    {loading ? (
                        <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-4 text-white/70">Loading listings...</div>
                    ) : visibleListings.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-4 text-white/70">
                            {dashboard.listings.length === 0
                                ? "You have no listings yet. Start by publishing one property."
                                : "No listings match your search."}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {visibleListings.map((listing) => (
                                <article
                                    key={listing.id}
                                    className="overflow-hidden rounded-2xl border border-white/15 bg-[#111116]"
                                >
                                    <div className="grid gap-0 md:grid-cols-[280px_1fr]">
                                        <img src={listing.image} alt={listing.title} className="h-48 w-full object-cover md:h-full" />
                                        <div className="p-4">
                                            <p className="text-xs uppercase tracking-wide text-[#cfb7ff]">{listing.status.replaceAll("_", " ")}</p>
                                            <h3 className="mt-1 text-xl font-semibold">{listing.title}</h3>
                                            <p className="mt-1 text-sm text-white/70">{listing.locality}, {listing.city}</p>
                                            <p className="mt-2 text-lg font-semibold text-[#B7F041]">₹{listing.rent.toLocaleString("en-IN")} / Month</p>
                                            <p className="text-sm text-white/70">Deposit ₹{listing.deposit.toLocaleString("en-IN")}</p>

                                            <div className="mt-4">
                                                <PrimaryButton
                                                    onClick={() => router.push(`/owner/property/${listing.id}/edit`)}
                                                >
                                                    Edit Listing
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="mt-8">
                    <h2 className="mb-3 text-xl font-semibold">Tenant Leads</h2>
                    {visibleLeads.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-4 text-white/70">
                            {dashboard.leads.length === 0 ? "No leads unlocked yet." : "No leads match your search."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {visibleLeads.map((lead) => (
                            <article key={lead.id} className="rounded-2xl border border-[#A67AEB]/40 bg-[#101019] p-4">
                                <p className="text-xs text-white/70">Tenant</p>
                                <h3 className="text-xl font-semibold">{lead.tenantName}</h3>
                                <p className="mt-2 text-sm text-white/75">
                                    {lead.state === "unlocked" ? lead.phone : lead.phoneMasked}
                                </p>

                                <div className="mt-4">
                                    {lead.state === "unlocked" ? (
                                        <div className="flex gap-2">
                                            <a
                                                href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 rounded-xl bg-[#A67AEB] px-3 py-2 text-center text-sm font-semibold"
                                            >
                                                WhatsApp
                                            </a>
                                            <a
                                                href={`tel:${lead.phone}`}
                                                className="flex-1 rounded-xl border border-[#A67AEB] px-3 py-2 text-center text-sm font-semibold"
                                            >
                                                Call
                                            </a>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleUnlock(lead.id)}
                                            className="w-full rounded-xl bg-[#A67AEB] px-3 py-2 text-sm font-semibold transition hover:bg-[#9b69e9] active:scale-[0.99]"
                                            disabled={dashboard.creditsLeft <= 0}
                                        >
                                            {dashboard.creditsLeft > 0 ? "Swipe To Unlock" : "No free credits left"}
                                        </button>
                                    )}
                                </div>
                            </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <OwnerBottomNav />
        </main>
    );
}
