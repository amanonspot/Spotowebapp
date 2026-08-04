"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUp, Check, Clock, UserCircle2, X } from "lucide-react";
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
    awaiting_owner_login: {
        headline: "Waiting for your login",
        subline: "A field agent submitted this listing. Log in with your registered phone to activate it.",
        accentClass: "text-[#d8c3ff]",
    },
    in_review: {
        headline: "Listing under review",
        subline: "Document verification score was below threshold. Add an employee code below to go live instantly.",
        accentClass: "text-white",
    },
    verification_pending: {
        headline: "Listing under review",
        subline: "Add an employee code for instant verification.",
        accentClass: "text-white",
    },
    verifying: {
        headline: "Checking employee code",
        subline: "Hang tight — this only takes a moment.",
        accentClass: "text-[#d8c3ff]",
    },
    live: {
        headline: "Your listing is live",
        subline: "It is approved and visible to tenants.",
        accentClass: "text-white",
    },
    rejected: {
        headline: "Verification did not go through",
        subline: "Check your details or try again from the dashboard.",
        accentClass: "text-white",
    },
    verification_retry: {
        headline: "Code not verified",
        subline: "Please enter a valid employee code and try again.",
        accentClass: "text-white",
    },
};

const toVerificationUiState = (state: OwnerListingVerificationState): OwnerListingVerificationState =>
    state === "verifying" || state === "verification_retry" ? "verification_pending" : state;

const statusChip = (state: OwnerListingVerificationState) => {
    if (state === "live") {
        return (
            <span className="absolute right-2 top-2 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                Live
                <span className="h-2 w-2 rounded-full bg-[#b7f041]" />
            </span>
        );
    }
    if (state === "rejected") {
        return (
            <span className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff3848]" />
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
        <main className="min-h-[100dvh] min-h-screen bg-[#050507] pb-[max(6.5rem,calc(5.5rem+env(safe-area-inset-bottom,0px)))] text-white md:pb-8">
            <div className="mx-auto w-full max-w-full px-4 py-4 sm:px-6 md:max-w-2xl md:py-5 md:px-7 lg:max-w-3xl lg:px-8 xl:max-w-5xl">
                <header className="mb-5 flex items-center justify-between sm:mb-6">
                    <button
                        type="button"
                        onClick={() => router.push("/owner/dashboard")}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white/90 transition hover:bg-white/20 sm:h-12 sm:w-12"
                        aria-label="Back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/owner/dashboard")}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#A67AEB]/60 text-[#f0e7ff] sm:h-12 sm:w-12"
                        aria-label="Owner profile"
                    >
                        <UserCircle2 className="h-6 w-6" />
                    </button>
                </header>

                <section className="rounded-2xl border border-white/12 bg-gradient-to-b from-[#14141c] to-[#0a0a0f] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.35)] sm:p-6 lg:p-8">
                    <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[#A67AEB]">
                            {state === "live" ? (
                                <Check className="h-6 w-6 text-[#B7F041]" strokeWidth={2.25} />
                            ) : (
                                <Clock className="h-6 w-6" strokeWidth={2} />
                            )}
                        </div>
                        <h1
                            className={`mx-auto mt-4 max-w-xs text-pretty text-xl font-semibold leading-snug tracking-tight sm:max-w-md sm:text-2xl ${meta.accentClass}`}
                        >
                            {meta.headline}
                        </h1>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">{meta.subline}</p>
                    </div>

                    {loading ? (
                        <div className="mt-5 rounded-xl border border-white/12 bg-[#0d0d14] p-3 sm:mt-6">
                            <ShimmerBlock className="aspect-[16/10] w-full max-h-[min(14rem,38vh)] min-h-[9rem] rounded-lg sm:max-h-56 md:max-h-64" />
                            <ShimmerBlock className="mt-3 h-5 w-4/5 rounded-md" />
                            <ShimmerBlock className="mt-2 h-4 w-1/2 rounded-md" />
                        </div>
                    ) : listing ? (
                        <article className="mt-5 overflow-hidden rounded-xl border border-white/12 bg-[#0c0c12] sm:mt-6">
                            <div className="relative aspect-[16/10] w-full max-h-[min(14rem,38vh)] min-h-[9rem] sm:max-h-56 md:max-h-64 lg:max-h-72">
                                <BlurImage src={listing.image} alt={listing.title} wrapperClassName="h-full w-full" className="h-full w-full object-cover" />
                                {statusChip(state)}
                            </div>
                            <div className="space-y-1 p-4">
                                <h2 className="text-base font-semibold leading-snug text-white sm:text-lg">{listing.title}</h2>
                                <p className="text-sm text-white/60">
                                    {listing.locality}, {listing.city}
                                </p>
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 pt-2">
                                    <p className="text-lg font-semibold text-[#B7F041] sm:text-xl">
                                        ₹{listing.rent.toLocaleString("en-IN")}
                                        <span className="text-sm font-normal text-white/50"> / mo</span>
                                    </p>
                                    <p className="text-sm text-white/50">Deposit ₹{listing.deposit.toLocaleString("en-IN")}</p>
                                </div>
                            </div>
                        </article>
                    ) : (
                        <div className="mt-6 rounded-2xl border border-white/15 bg-[#0d0d14] p-4 text-sm text-white/70">
                            Listing submitted. You can continue from dashboard.
                        </div>
                    )}

                    <div className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:mt-5">
                        <PrimaryButton
                            type="button"
                            className="h-11 text-sm font-semibold sm:h-12 sm:text-base"
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
                            className="h-11 rounded-xl border border-white/20 bg-white/[0.08] text-sm font-semibold text-white/90 transition hover:bg-white/12 sm:h-12 sm:text-base"
                        >
                            Need help?
                        </button>
                    </div>

                    {showEmployeeCodeInput ? (
                        <section className="mt-6 border-t border-white/10 pt-6">
                            <p className="mb-3 text-sm font-semibold text-white/90">Employee code (instant verification)</p>
                            <div className="flex items-center gap-2 rounded-xl border border-white/18 bg-[#09090f] px-3">
                                <input
                                    value={employeeCode}
                                    onChange={(event) => setEmployeeCode(event.target.value)}
                                    placeholder="Enter code"
                                    className="h-12 min-w-0 flex-1 bg-transparent text-base font-medium text-white outline-none placeholder:text-white/40 sm:h-14 sm:text-lg"
                                    disabled={submittingCode}
                                />
                                <button
                                    type="button"
                                    onClick={submitEmployeeCode}
                                    disabled={submittingCode || !listing}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#A67AEB] text-black disabled:opacity-60 sm:h-11 sm:w-11"
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
                                className="mt-3 block w-full text-right text-xs font-medium uppercase tracking-wide text-white/45 transition hover:text-white/70"
                            >
                                Skip for now
                            </button>
                        </section>
                    ) : null}

                    {showApprovedBox ? (
                        <div className="mt-6 flex items-center justify-between rounded-xl border border-white/15 bg-[#0b0b10] px-4 py-3">
                            <span className="text-base font-semibold">Approved</span>
                            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#b7f041] text-black">
                                <Check className="h-6 w-6" />
                            </span>
                        </div>
                    ) : null}

                    {showRejectedBox ? (
                        <div className="mt-6 flex items-center justify-between rounded-xl border border-white/15 bg-[#0b0b10] px-4 py-3">
                            <span className="text-base font-semibold">Rejected</span>
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
