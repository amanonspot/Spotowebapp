"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUp, RotateCw, Search, UserCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import OwnerBottomNav from "@/components/owner/OwnerBottomNav";
import BlurImage from "@/components/revamp/BlurImage";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import ShimmerBlock from "@/components/revamp/ShimmerBlock";
import SwipeUnlock from "@/components/revamp/SwipeUnlock";
import { OwnerDashboardData, OwnerListingSummary, OwnerListingVerificationState } from "@/lib/adapters/types";
import { ownerAdapter, agentAdapter } from "@/lib/adapters";

const emptyDashboard: OwnerDashboardData = {
    ownerName: "Owner",
    creditsLeft: 0,
    listings: [],
    leads: [],
};

const formatMonth = () =>
    new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
    }).format(new Date());

const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const normalizeVerificationState = (listing: OwnerListingSummary): OwnerListingVerificationState => {
    if (listing.verificationState) return listing.verificationState;
    const status = `${listing.verificationStatus || listing.status || ""}`.toLowerCase();
    if (status.includes("awaiting_owner") || status.includes("owner_login")) return "awaiting_owner_login";
    if (status.includes("reject")) return "rejected";
    if (status.includes("retry") || status.includes("verifying") || status.includes("pending")) return "verification_pending";
    if (status.includes("in_review") || status.includes("review")) return "in_review";
    if (status.includes("approved")) return "live";
    if (status.includes("live")) return "live";
    if (listing.isPubliclyVisible === true) return "live";
    return "in_review";
};

const ListingStatusBadge = ({ state }: { state: OwnerListingVerificationState }) => {
    if (state === "live") {
        return (
            <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-xl bg-[#7f7b77cc] px-3 py-1.5 text-sm font-bold text-white">
                LIVE <span className="h-3 w-3 rounded-full bg-[#b7f041]" />
            </span>
        );
    }

    if (state === "rejected") {
        return (
            <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-xl bg-[#7f7b77cc] px-3 py-1.5 text-sm font-bold text-white">
                Rejected <span className="h-3 w-3 rounded-full bg-[#ff3848]" />
            </span>
        );
    }

    if (state === "awaiting_owner_login") {
        return (
            <span className="absolute right-3 top-3 inline-flex max-w-[58%] items-center gap-2 rounded-xl bg-[#7f7b77cc] px-3 py-1.5 text-xs font-bold text-white sm:text-sm">
                Awaiting login <span aria-hidden>📱</span>
            </span>
        );
    }

    return (
        <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-xl bg-[#7f7b77cc] px-3 py-1.5 text-sm font-bold text-white">
            In Review <span aria-hidden>⏳</span>
        </span>
    );
};

const DashboardSkeleton = () => (
    <div className="space-y-4">
        <ShimmerBlock className="h-8 w-44 rounded-lg" />
        <ShimmerBlock className="h-10 w-36 rounded-full" />
        <ShimmerBlock className="h-6 w-32 rounded-full" />

        <section className="rounded-2xl border border-white/15 bg-[#101018] p-3">
            <ShimmerBlock className="h-64 w-full rounded-xl" />
            <ShimmerBlock className="mt-3 h-6 w-3/4 rounded-lg" />
            <ShimmerBlock className="mt-2 h-4 w-1/2 rounded-lg" />
            <ShimmerBlock className="mt-3 h-10 w-24 rounded-xl" />
        </section>

        <ShimmerBlock className="h-6 w-40 rounded-full" />
        {[0, 1].map((item) => (
            <div key={item} className="rounded-2xl border border-[#A67AEB]/35 bg-[#101019] p-4">
                <ShimmerBlock className="h-5 w-28 rounded-lg" />
                <ShimmerBlock className="mt-2 h-4 w-36 rounded-lg" />
                <ShimmerBlock className="mt-3 h-10 rounded-full" />
            </div>
        ))}
    </div>
);

export default function OwnerDashboardPage() {
    const router = useRouter();
    const [dashboard, setDashboard] = useState<OwnerDashboardData>(emptyDashboard);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [employeeCodeByListing, setEmployeeCodeByListing] = useState<Record<string, string>>({});
    const [verifyingListingIds, setVerifyingListingIds] = useState<Record<string, boolean>>({});
    const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

    const loadDashboard = useCallback(
        async (mode: "initial" | "sync" = "initial") => {
            if (mode === "initial") setLoading(true);
            if (mode === "sync") setSyncing(true);
            setError(null);
            try {
                const next = await ownerAdapter.getDashboard();
                setDashboard(next);
            } catch (loadError) {
                const message = loadError instanceof Error ? loadError.message : "Unable to load dashboard";
                setError(message);
                if (message.toLowerCase().includes("session") || message.toLowerCase().includes("unauthorized")) {
                    router.push("/auth/login");
                }
            } finally {
                if (mode === "initial") setLoading(false);
                if (mode === "sync") setSyncing(false);
            }
        },
        [router]
    );

    useEffect(() => {
        let mounted = true;
        agentAdapter.getAgentProfile()
            .then((p) => {
                if (!mounted) return;
                if (p?.is_agent && p.employee) router.replace("/agent/dashboard");
                else loadDashboard("initial");
            })
            .catch(() => {
                if (mounted) loadDashboard("initial");
            });
        return () => { mounted = false; };
    }, [loadDashboard, router]);

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

    const currentListing = visibleListings[0] || dashboard.listings[0] || null;
    const leadsHeading = useMemo(() => {
        if (!currentListing) return "Tenants Looking for Homes";
        const lowerTitle = currentListing.title.toLowerCase();
        const bhkLabel = lowerTitle.includes("1 bhk")
            ? "1bhk"
            : lowerTitle.includes("2 bhk")
            ? "2bhk"
            : lowerTitle.includes("3 bhk")
            ? "3bhk"
            : "homes";
        return `Tenants Looking for ${bhkLabel} in ${currentListing.locality || "your locality"}`;
    }, [currentListing]);

    const handleUnlock = async (leadId: string) => {
        setError(null);
        try {
            const unlocked = await ownerAdapter.unlockLead(leadId);
            setDashboard((prev) => ({
                ...prev,
                creditsLeft: Math.max(0, prev.creditsLeft - 1),
                leads: prev.leads.map((lead) => (lead.id === leadId ? unlocked : lead)),
            }));
            loadDashboard("sync");
        } catch (unlockError) {
            setError(unlockError instanceof Error ? unlockError.message : "Unable to unlock lead");
        }
    };

    const handleDeleteListing = async (listingId: string) => {
        const confirmed = window.confirm("Delete this listing? This action cannot be undone.");
        if (!confirmed) return;
        setError(null);
        setDeletingListingId(listingId);
        try {
            await ownerAdapter.deleteProperty(listingId);
            await loadDashboard("initial");
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Unable to delete listing.");
        } finally {
            setDeletingListingId(null);
        }
    };

    const setVerificationStateLocally = (listingId: string, state: OwnerListingVerificationState, message?: string) => {
        setDashboard((prev) => ({
            ...prev,
            listings: prev.listings.map((listing) =>
                listing.id === listingId ? { ...listing, verificationState: state, verificationMessage: message } : listing
            ),
        }));
    };

    const handleEmployeeCodeVerify = async (listingId: string) => {
        const code = (employeeCodeByListing[listingId] || "").trim();
        if (!code) {
            setError("Please enter employee code.");
            return;
        }

        setError(null);
        setVerifyingListingIds((prev) => ({ ...prev, [listingId]: true }));
        setVerificationStateLocally(listingId, "verifying", "Verifying employee code...");
        try {
            const result = await ownerAdapter.submitEmployeeCode(listingId, code);
            setVerificationStateLocally(listingId, result.verificationState, result.message);
            await loadDashboard("sync");
        } catch (verifyError) {
            setError(verifyError instanceof Error ? verifyError.message : "Unable to verify employee code.");
            await loadDashboard("sync");
        } finally {
            setVerifyingListingIds((prev) => ({ ...prev, [listingId]: false }));
        }
    };

    const renderListingVerificationBlock = (listing: OwnerListingSummary) => {
        const rawState = normalizeVerificationState(listing);
        const state =
            rawState === "verifying" || rawState === "verification_retry" ? "verification_pending" : rawState;
        const isVerifying = Boolean(verifyingListingIds[listing.id]) || rawState === "verifying";

        if (state === "live") {
            return (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/25 bg-[#0b0b10] px-4 py-3">
                    <span className="text-xl font-bold">Approved</span>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#b7f041] text-black">✓</span>
                </div>
            );
        }

        if (state === "rejected") {
            return (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/25 bg-[#0b0b10] px-4 py-3">
                    <span className="text-xl font-bold">Rejected</span>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#ff3848] text-black">
                        <X className="h-5 w-5" />
                    </span>
                </div>
            );
        }

        return (
            <section className="mt-4">
                <p className="mb-2 text-lg font-semibold">SPOTO Employee Code — for Verification</p>
                <div className="flex items-center rounded-2xl border border-white/30 bg-[#07070c] px-3 py-2">
                    <input
                        value={employeeCodeByListing[listing.id] || ""}
                        onChange={(event) =>
                            setEmployeeCodeByListing((prev) => ({
                                ...prev,
                                [listing.id]: event.target.value,
                            }))
                        }
                        placeholder={isVerifying ? "#verifying........" : "Enter Employee Code"}
                        className="h-12 w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-white/65"
                        disabled={isVerifying}
                    />
                    <button
                        type="button"
                        onClick={() => handleEmployeeCodeVerify(listing.id)}
                        disabled={isVerifying}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#A67AEB] text-black disabled:opacity-60"
                        aria-label="Verify employee code"
                    >
                        {isVerifying ? <RotateCw className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
                    </button>
                </div>
            </section>
        );
    };

    const leadActionLabel = (locked: boolean) => (locked ? (dashboard.creditsLeft > 0 ? "Swipe To Unlock" : "No free credits left") : "");

    return (
        <main className="min-h-[100dvh] min-h-screen bg-[#050507] pb-[max(6.5rem,calc(5.5rem+env(safe-area-inset-bottom,0px)))] text-white md:pb-8 lg:pb-10">
            <div className="mx-auto w-full max-w-full px-4 py-4 sm:px-6 md:max-w-2xl md:px-7 lg:max-w-5xl lg:px-8 xl:max-w-6xl 2xl:max-w-7xl">

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
                            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">Welcome, {dashboard.ownerName}</h1>
                            <p className="text-sm text-white/50">{formatMonth()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full border border-white/20 bg-[#0d0d14] px-4 py-1.5 text-sm font-medium">
                            {dashboard.listings.length} Listing{dashboard.listings.length !== 1 ? "s" : ""}
                        </span>
                        <button
                            type="button"
                            onClick={() => router.push("/owner/list-property")}
                            className="btn-shimmer rounded-full border border-[#A67AEB]/70 bg-[#A67AEB]/10 px-5 py-2 text-sm font-semibold text-[#e8daff] transition hover:border-[#B991F4] hover:bg-[#A67AEB]/20 active:scale-[0.98]"
                        >
                            + List Property
                        </button>
                    </div>
                </header>

                {/* Search */}
                <div className="input-glow mt-5 flex items-center gap-2 rounded-xl border border-white/12 bg-[#0d0d14] px-4 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-white/40" />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search listings or leads..."
                        className="w-full bg-transparent text-sm text-white/90 outline-none placeholder:text-white/35"
                    />
                </div>

                {/* Error */}
                {error ? (
                    <div className="mt-4 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-3 text-sm text-red-100">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => loadDashboard("initial")}
                            className="mt-2 rounded-lg border border-red-300/40 px-2 py-1 text-xs"
                        >
                            Retry
                        </button>
                    </div>
                ) : null}

                {loading ? (
                    <div className="mt-5">
                        <DashboardSkeleton />
                    </div>
                ) : (
                    /* 2-column layout on lg screens */
                    <div className="mt-5 lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 xl:grid-cols-[1fr_420px]">

                        {/* LEFT — Listings */}
                        <section>
                            <h2 className="mb-4 text-lg font-semibold text-white/70">Your Listings</h2>
                            {visibleListings.length === 0 ? (
                                <div className="rounded-2xl border border-white/15 bg-[#101018] p-5 text-sm text-white/70">
                                    {dashboard.listings.length === 0
                                        ? "You have no listings yet. Start by publishing one property."
                                        : "No listings match your search."}
                                </div>
                            ) : (
                                <div className="space-y-5 sm:grid sm:grid-cols-2 sm:gap-5 sm:space-y-0 lg:grid-cols-1 lg:space-y-5">
                                    {visibleListings.map((listing) => (
                                        <article
                                            key={listing.id}
                                            className="card-hover overflow-hidden rounded-2xl border border-white/12 bg-[#101018] shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                                        >
                                            <div className="relative h-52 sm:h-56">
                                                <BlurImage
                                                    src={listing.image}
                                                    alt={listing.title}
                                                    wrapperClassName="h-full w-full"
                                                    className="img-zoom h-full w-full"
                                                />
                                                <ListingStatusBadge state={normalizeVerificationState(listing)} />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="text-lg font-bold leading-tight">{listing.title}</h3>
                                                <p className="mt-0.5 text-sm text-white/60">
                                                    {listing.locality}, {listing.city}
                                                </p>
                                                <p className="mt-2 text-xl font-bold text-[#B7F041]">
                                                    {formatCurrency(listing.rent)}<span className="text-sm font-medium text-[#B7F041]/70"> / Month</span>
                                                </p>
                                                <p className="text-sm text-white/55">
                                                    {formatCurrency(listing.deposit)} Deposit
                                                </p>

                                                <div className="mt-4 flex items-center gap-2">
                                                    <PrimaryButton
                                                        className="h-10 min-w-[100px] px-5 py-0 text-sm"
                                                        onClick={() => router.push(`/owner/property/${listing.id}/edit`)}
                                                    >
                                                        Edit
                                                    </PrimaryButton>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteListing(listing.id)}
                                                        disabled={deletingListingId === listing.id}
                                                        className="h-10 rounded-xl border border-red-400/40 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {deletingListingId === listing.id ? "Deleting..." : "Delete"}
                                                    </button>
                                                </div>

                                                {renderListingVerificationBlock(listing)}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* RIGHT — Leads */}
                        <section className="mt-8 lg:mt-0">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white/70">Tenant Leads</h2>
                                <span className="rounded-full bg-[#A67AEB]/20 px-3 py-1 text-xs font-semibold text-[#d7c1ff]">
                                    {dashboard.creditsLeft} credits left
                                </span>
                            </div>
                            <p className="mb-4 text-sm font-medium text-white/85">{leadsHeading}</p>
                            {visibleLeads.length === 0 ? (
                                <div className="rounded-2xl border border-white/15 bg-[#101018] p-5 text-sm text-white/70">
                                    {dashboard.leads.length === 0 ? "No leads unlocked yet." : "No leads match your search."}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {visibleLeads.map((lead) => {
                                        const locked = lead.state !== "unlocked";
                                        return (
                                            <article
                                                key={lead.id}
                                                className="rounded-2xl border border-[#A67AEB]/40 bg-[#101019] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-white/50">Tenant</p>
                                                        <h3 className="text-base font-bold leading-tight">{lead.tenantName}</h3>
                                                        <p className={`mt-1 text-base font-semibold ${locked ? "select-none" : "text-white"}`}
                                                           style={locked ? { filter: "blur(4px)", userSelect: "none" } : {}}>
                                                            {locked ? lead.phoneMasked : lead.phone}
                                                        </p>
                                                    </div>
                                                    {!locked && (
                                                        <span className="shrink-0 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-400 ring-1 ring-green-500/20">
                                                            Unlocked
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-3">
                                                    {!locked ? (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <a
                                                                href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn-shimmer rounded-xl bg-[#A67AEB] px-3 py-2.5 text-center text-sm font-bold text-white"
                                                            >
                                                                WhatsApp
                                                            </a>
                                                            <a
                                                                href={`tel:${lead.phone}`}
                                                                className="btn-shimmer rounded-xl border border-[#A67AEB]/50 px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-[#A67AEB]/10"
                                                            >
                                                                Call
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <SwipeUnlock
                                                            label={leadActionLabel(true)}
                                                            disabled={dashboard.creditsLeft <= 0 || syncing}
                                                            loading={syncing}
                                                            onComplete={() => handleUnlock(lead.id)}
                                                        />
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                            {syncing && (
                                <p className="mt-2 text-xs text-white/45">Syncing latest lead state...</p>
                            )}
                        </section>
                    </div>
                )}
            </div>

            <OwnerBottomNav />
        </main>
    );
}
