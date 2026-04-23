"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUp, Check, UserCircle2, X } from "lucide-react";
import OwnerBottomNav from "@/components/owner/OwnerBottomNav";
import BlurImage from "@/components/revamp/BlurImage";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import ShimmerBlock from "@/components/revamp/ShimmerBlock";
import { OwnerListingSummary, OwnerListingVerificationState } from "@/lib/adapters/types";
import { ownerAdapter } from "@/lib/adapters";

type VerificationUi = {
    headline: string;
    subline: string;
    accentClass: string;
};

const verificationMeta: Record<OwnerListingVerificationState, VerificationUi> = {
    in_review: {
        headline: "Property is under Review",
        subline: "Usually takes 30 mins",
        accentClass: "text-white",
    },
    verification_pending: {
        headline: "Property is under Review",
        subline: "Enter employee code for instant verification",
        accentClass: "text-white",
    },
    verifying: {
        headline: "Verifying Employee Code",
        subline: "Please wait while we verify your listing",
        accentClass: "text-[#d8c3ff]",
    },
    live: {
        headline: "Property is Live now",
        subline: "Your listing is approved and visible",
        accentClass: "text-white",
    },
    rejected: {
        headline: "Property is under Review",
        subline: "Verification failed",
        accentClass: "text-white",
    },
    verification_retry: {
        headline: "Property is under Review",
        subline: "Employee code could not be verified. Please enter again.",
        accentClass: "text-white",
    },
};

const toVerificationUiState = (state: OwnerListingVerificationState): OwnerListingVerificationState =>
    state === "verifying" || state === "verification_retry" ? "verification_pending" : state;

const statusChip = (state: OwnerListingVerificationState) => {
    if (state === "live") {
        return (
            <span className="absolute right-3 top-3 inline-flex items-center gap-3 rounded-2xl bg-[#7f7b77cc] px-4 py-2 text-xl font-semibold text-white">
                LIVE <span className="h-4 w-4 rounded-full bg-[#b7f041]" />
            </span>
        );
    }
    if (state === "rejected") {
        return (
            <span className="absolute right-3 top-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7f7b77cc]">
                <span className="h-5 w-5 rounded-full bg-[#ff3848]" />
            </span>
        );
    }
    return null;
};

export default function OwnerListingPendingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const propertyId = searchParams.get("property_id") || "";

    const [listings, setListings] = useState<OwnerListingSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingCode, setSubmittingCode] = useState(false);
    const [employeeCode, setEmployeeCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const dashboard = await ownerAdapter.getDashboard();
            setListings(dashboard.listings);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Unable to load listing state");
            setListings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const listing = useMemo(() => {
        if (propertyId) {
            const matched = listings.find((item) => item.id === propertyId);
            if (matched) return matched;
        }
        return listings[0];
    }, [listings, propertyId]);

    const rawState = (listing?.verificationState || "in_review") as OwnerListingVerificationState;
    const state = toVerificationUiState(rawState);
    const meta = verificationMeta[state];
    const showEmployeeCodeInput = state === "in_review" || state === "verification_pending";
    const showApprovedBox = state === "live";
    const showRejectedBox = state === "rejected";

    const submitEmployeeCode = async () => {
        if (!listing) return;
        const code = employeeCode.trim();
        if (!code) {
            setError("Please enter employee code.");
            return;
        }
        setSubmittingCode(true);
        setError(null);
        try {
            await ownerAdapter.submitEmployeeCode(listing.id, code);
            await loadDashboard();
        } catch (codeError) {
            setError(codeError instanceof Error ? codeError.message : "Unable to verify employee code right now.");
        } finally {
            setSubmittingCode(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#050507] pb-24 text-white">
            <div className="mx-auto w-full max-w-[420px] px-4 py-5">
                <header className="mb-6 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.push("/owner/dashboard")}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 text-white/90 transition hover:bg-white/20"
                        aria-label="Back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/owner/dashboard")}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#A67AEB]/60 text-[#f0e7ff]"
                        aria-label="Owner profile"
                    >
                        <UserCircle2 className="h-6 w-6" />
                    </button>
                </header>

                <section className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_bottom,#35185d_0%,#09090e_70%)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                    <div className="text-center">
                        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-4xl">
                            {state === "live" ? "✅" : "⏳"}
                        </div>
                        <h1 className={`mt-3 text-[2.2rem] font-semibold leading-tight ${meta.accentClass}`}>{meta.headline}</h1>
                        <p className="mt-2 text-base text-white/60">{meta.subline}</p>
                    </div>

                    {loading ? (
                        <div className="mt-6 rounded-2xl border border-white/15 bg-[#0d0d14] p-3">
                            <ShimmerBlock className="h-[320px] w-full rounded-xl" />
                            <ShimmerBlock className="mt-3 h-6 w-3/4 rounded-lg" />
                            <ShimmerBlock className="mt-2 h-5 w-1/2 rounded-lg" />
                        </div>
                    ) : listing ? (
                        <article className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-[#0c0c12]">
                            <div className="relative h-[420px]">
                                <BlurImage src={listing.image} alt={listing.title} wrapperClassName="h-full w-full" className="h-full w-full" />
                                {statusChip(state)}
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-semibold text-[#c8a9ff]">Rare Find ✨</p>
                                <h2 className="mt-1 text-[1.95rem] font-semibold leading-tight">{listing.title}</h2>
                                <p className="text-sm text-white/75">
                                    {listing.locality}, {listing.city}
                                </p>
                                <p className="mt-2 text-[1.95rem] font-semibold text-[#B7F041]">
                                    ₹{listing.rent.toLocaleString("en-IN")} / Month
                                </p>
                                <p className="text-base text-white/65">₹{listing.deposit.toLocaleString("en-IN")} Deposit</p>
                            </div>
                        </article>
                    ) : (
                        <div className="mt-6 rounded-2xl border border-white/15 bg-[#0d0d14] p-4 text-sm text-white/70">
                            Listing submitted. You can continue from dashboard.
                        </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <PrimaryButton
                            type="button"
                            className="h-12 text-base"
                            onClick={() => {
                                if (listing?.id) {
                                    router.push(`/owner/property/${listing.id}/edit`);
                                } else {
                                    router.push("/owner/dashboard");
                                }
                            }}
                        >
                            Review Listing
                        </PrimaryButton>
                        <button
                            type="button"
                            onClick={() => router.push("/owner/dashboard")}
                            className="h-12 rounded-xl border border-white/25 bg-white/10 text-base font-semibold text-white transition hover:bg-white/15"
                        >
                            Need help?
                        </button>
                    </div>

                    {showEmployeeCodeInput ? (
                        <section className="mt-6">
                            <p className="mb-2 text-2xl font-semibold">Employee Code - for Instant Verification</p>
                            <div className="flex items-center rounded-3xl border border-white/30 bg-[#09090f] px-3 py-2">
                                <input
                                    value={employeeCode}
                                    onChange={(event) => setEmployeeCode(event.target.value)}
                                    placeholder="Enter employee code"
                                    className="h-14 w-full bg-transparent text-[1.9rem] font-semibold text-white outline-none placeholder:text-white/65"
                                    disabled={submittingCode}
                                />
                                <button
                                    type="button"
                                    onClick={submitEmployeeCode}
                                    disabled={submittingCode || !listing}
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#A67AEB] text-black disabled:opacity-60"
                                    aria-label="Submit employee code"
                                >
                                    {submittingCode ? (
                                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                                    ) : (
                                        <ArrowUp className="h-6 w-6" />
                                    )}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push("/owner/dashboard")}
                                className="mt-3 block w-full text-right text-xl font-semibold text-white/65 transition hover:text-white"
                            >
                                SKIP NOW
                            </button>
                        </section>
                    ) : null}

                    {showApprovedBox ? (
                        <div className="mt-6 flex items-center justify-between rounded-3xl border border-white/25 bg-[#0b0b10] px-4 py-3">
                            <span className="text-2xl font-semibold">Approved</span>
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#b7f041] text-black">
                                <Check className="h-6 w-6" />
                            </span>
                        </div>
                    ) : null}

                    {showRejectedBox ? (
                        <div className="mt-6 flex items-center justify-between rounded-3xl border border-white/25 bg-[#0b0b10] px-4 py-3">
                            <span className="text-2xl font-semibold">Rejected</span>
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ff3848] text-black">
                                <X className="h-6 w-6" />
                            </span>
                        </div>
                    ) : null}

                    {error ? (
                        <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                            {error}
                        </div>
                    ) : null}
                </section>
            </div>

            <OwnerBottomNav />
        </main>
    );
}
