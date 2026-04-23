"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUp, Bell, RotateCw, Search, UserCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import OwnerBottomNav from "@/components/owner/OwnerBottomNav";
import BlurImage from "@/components/revamp/BlurImage";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import ShimmerBlock from "@/components/revamp/ShimmerBlock";
import { OwnerDashboardData, OwnerListingSummary, OwnerListingVerificationState } from "@/lib/adapters/types";
import { ownerAdapter } from "@/lib/adapters";

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
            <span className="absolute right-3 top-3 inline-flex items-center gap-3 rounded-2xl bg-[#7f7b77cc] px-4 py-2 text-xl font-semibold text-white">
                LIVE <span className="h-4 w-4 rounded-full bg-[#b7f041]" />
            </span>
        );
    }

    if (state === "rejected") {
        return (
            <span className="absolute right-3 top-3 inline-flex h-12 w-14 items-center justify-center rounded-2xl bg-[#7f7b77cc]">
                <span className="h-4 w-4 rounded-full bg-[#ff3848]" />
            </span>
        );
    }

    return (
        <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-2xl bg-[#7f7b77cc] px-4 py-2 text-xl font-semibold text-white">
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
        loadDashboard("initial");
    }, [loadDashboard]);

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
                    <span className="text-[2rem] font-semibold leading-none">Approved</span>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#b7f041] text-black">✓</span>
                </div>
            );
        }

        if (state === "rejected") {
            return (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/25 bg-[#0b0b10] px-4 py-3">
                    <span className="text-[2rem] font-semibold leading-none">Rejected</span>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#ff3848] text-black">
                        <X className="h-5 w-5" />
                    </span>
                </div>
            );
        }

        return (
            <section className="mt-4">
                <p className="mb-2 text-2xl font-semibold">SPOTO Employee Code - for Verification</p>
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
                        className="h-12 w-full bg-transparent text-[2rem] font-semibold leading-none text-white outline-none placeholder:text-white/65"
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
        <main className="min-h-screen bg-[#050507] pb-28 text-white">
            <div className="mx-auto w-full max-w-[420px] px-4 py-4">
                <header>
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => router.push("/owner/dashboard")}
                            className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[#16161f] text-white/85 transition hover:border-[#A67AEB] hover:text-white active:scale-[0.98]"
                            aria-label="Owner profile"
                        >
                            <UserCircle2 className="h-6 w-6" />
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#A67AEB]/70 bg-[#16161f] text-[#e8daff] transition hover:border-[#B991F4] hover:text-white active:scale-[0.98]"
                            aria-label="Back to home"
                        >
                            <Bell className="h-6 w-6" />
                        </button>
                    </div>

                    <h1 className="mt-5 text-5xl font-semibold leading-tight">Welcome {dashboard.ownerName}</h1>
                    <button
                        type="button"
                        onClick={() => router.push("/owner/list-property")}
                        className="mt-5 rounded-full border border-white/30 bg-[#0b0b10] px-6 py-2 text-sm font-medium transition hover:border-[#A67AEB] active:scale-[0.98]"
                    >
                        List Your Property
                    </button>

                    <p className="mt-7 text-4xl font-semibold leading-none">{formatMonth()}</p>
                    <span className="mt-4 inline-flex rounded-full border border-white/30 bg-[#0d0d14] px-5 py-2 text-2xl font-medium">
                        Current Listing ({dashboard.listings.length})
                    </span>
                </header>

                <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/15 bg-[#0d0d14] px-3 py-2">
                    <Search className="h-4 w-4 text-white/45" />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search listings or leads"
                        className="w-full bg-transparent text-sm text-white/90 outline-none placeholder:text-white/40"
                    />
                </div>

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
                    <>
                        <section className="mt-4">
                            {visibleListings.length === 0 ? (
                                <div className="rounded-2xl border border-white/15 bg-[#101018] p-4 text-sm text-white/70">
                                    {dashboard.listings.length === 0
                                        ? "You have no listings yet. Start by publishing one property."
                                        : "No listings match your search."}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {visibleListings.map((listing) => (
                                        <article
                                            key={listing.id}
                                            className="overflow-hidden rounded-2xl border border-white/15 bg-[#101018] shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                                        >
                                            <div className="relative h-[290px]">
                                                <BlurImage
                                                    src={listing.image}
                                                    alt={listing.title}
                                                    wrapperClassName="h-full w-full"
                                                    className="h-full w-full"
                                                />
                                                <ListingStatusBadge state={normalizeVerificationState(listing)} />
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-[1.9rem] font-semibold leading-tight">{listing.title}</h3>
                                                <p className="text-sm text-white/70">
                                                    {listing.locality}, {listing.city}
                                                </p>
                                                <p className="mt-2 text-[1.75rem] font-semibold leading-none text-[#B7F041]">
                                                    {formatCurrency(listing.rent)} / Month
                                                </p>
                                                <p className="mt-1 text-sm text-white/65">
                                                    {formatCurrency(listing.deposit)} Deposit
                                                </p>

                                                <div className="mt-4 flex items-center gap-2">
                                                    <PrimaryButton
                                                        className="h-11 min-w-[122px] px-6 py-0 text-base"
                                                        onClick={() => router.push(`/owner/property/${listing.id}/edit`)}
                                                    >
                                                        Edit
                                                    </PrimaryButton>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteListing(listing.id)}
                                                        disabled={deletingListingId === listing.id}
                                                        className="h-11 rounded-xl border border-red-400/45 px-4 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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

                        <div className="my-7 h-px bg-white/12" />

                        <span className="inline-flex rounded-full bg-[#A67AEB]/25 px-4 py-1 text-sm font-semibold text-[#d7c1ff]">
                            Free Credit : {dashboard.creditsLeft} Left
                        </span>

                        <section className="mt-4">
                            <h2 className="mb-4 text-[2rem] font-semibold leading-tight">{leadsHeading}</h2>
                            {visibleLeads.length === 0 ? (
                                <div className="rounded-2xl border border-white/15 bg-[#101018] p-4 text-sm text-white/70">
                                    {dashboard.leads.length === 0 ? "No leads unlocked yet." : "No leads match your search."}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {visibleLeads.map((lead) => {
                                        const locked = lead.state !== "unlocked";
                                        return (
                                            <article
                                                key={lead.id}
                                                className="rounded-2xl border border-[#A67AEB]/60 bg-[#101019] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.35)]"
                                            >
                                                <p className="text-sm text-white/70">Tenant</p>
                                                <h3 className="text-4xl font-semibold leading-none">{lead.tenantName}</h3>
                                                <p className="mt-2 text-[1.6rem] font-semibold text-white/95">
                                                    {locked ? lead.phoneMasked : lead.phone}
                                                </p>

                                                <div className="mt-4">
                                                    {!locked ? (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <a
                                                                href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-xl bg-[#A67AEB] px-3 py-2 text-center text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.99]"
                                                            >
                                                                WhatsApp
                                                            </a>
                                                            <a
                                                                href={`tel:${lead.phone}`}
                                                                className="rounded-xl border border-[#A67AEB] px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#A67AEB]/15 active:scale-[0.99]"
                                                            >
                                                                Call
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUnlock(lead.id)}
                                                            disabled={dashboard.creditsLeft <= 0 || syncing}
                                                            className="relative h-12 w-full rounded-full bg-[#A67AEB] pl-14 pr-4 text-left text-xl font-semibold text-white transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <span className="absolute left-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#07070a]">
                                                                ●
                                                            </span>
                                                            {leadActionLabel(true)}
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                            {syncing ? (
                                <p className="mt-2 text-xs text-white/55">Syncing latest lead state...</p>
                            ) : null}
                        </section>
                    </>
                )}
            </div>

            <OwnerBottomNav />
        </main>
    );
}
