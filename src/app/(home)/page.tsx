"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNavigation from "@/components/BottomNavigation";
import Chip from "@/components/revamp/Chip";
import HomePromoBannerRotator from "@/components/revamp/HomePromoBannerRotator";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import RevampPropertyCard from "@/components/revamp/PropertyCard";
import { propertyAdapter } from "@/lib/adapters";
import { HomeFeed, PropertyListItem, UnlockPaymentContext, UnlockPaymentFlowState } from "@/lib/adapters/types";
import { requireAuthThenContinue } from "@/lib/auth/requireAuthAction";
import { useAuth } from "@/lib/hooks/useAuth";
import { rentalsService } from "@/lib/rentals/service";
import UnlockPaymentFlowOverlay from "@/app/(home)/booking/[slug]/_components/UnlockPaymentFlowOverlay";
import { fakePaymentAdapter } from "@/lib/payments/fakePaymentAdapter";

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

interface PassStatus {
    free_contacts_used: number;
    free_contacts_remaining: number;
    has_one_day_active: boolean;
    has_weekly_active: boolean;
    one_day_pass_expires_at: string | null;
    weekly_pass_expires_at: string | null;
}

function formatExpiry(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HomePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, user, logout } = useAuth();
    const [feed, setFeed] = useState<HomeFeed>(initialFeed);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [passStatus, setPassStatus] = useState<PassStatus | null>(null);
    const [passLoading, setPassLoading] = useState(false);
    const [homePaymentFlowState, setHomePaymentFlowState] = useState<UnlockPaymentFlowState>("idle");
    const [homePaymentContext, setHomePaymentContext] = useState<UnlockPaymentContext | null>(null);
    const [homePaymentSessionId, setHomePaymentSessionId] = useState<string | null>(null);
    const [homePaymentBusy, setHomePaymentBusy] = useState(false);
    const [homePaymentError, setHomePaymentError] = useState<string | null>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const bannerResumeHandledRef = useRef(false);
    const resumeAction = searchParams.get("resume");
    const resumePassType: "one_day" | "weekly" = searchParams.get("passType") === "weekly" ? "weekly" : "one_day";
    const globalPassOneDayAmount = 99;
    const globalPassWeeklyAmount = 249;

    const handleProfileClick = async () => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        const next = !showProfileMenu;
        setShowProfileMenu(next);
        if (next && !passStatus) {
            setPassLoading(true);
            try {
                const res = await rentalsService.getMyPassStatus();
                const data = (res as any)?.data ?? (res as any);
                setPassStatus(data);
            } catch {
                // silently ignore
            } finally {
                setPassLoading(false);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        if (showProfileMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showProfileMenu]);

    const handleListProperty = () => {
        void requireAuthThenContinue({
            router,
            intent: {
                type: "owner_list_property",
                nextPath: "/owner/list-property",
            },
            onAuthenticated: () => {
                router.push("/owner/list-property");
            },
        });
    };

    const openHomePassFlow = (passType: "one_day" | "weekly" = "one_day") => {
        const amount = passType === "weekly" ? globalPassWeeklyAmount : globalPassOneDayAmount;
        setHomePaymentContext({
            propertyId: "global_pass",
            returnPath: "/",
            passType,
            amount,
        });
        setHomePaymentError(null);
        setHomePaymentFlowState("paywall");
    };

    const handleBannerClick = (passType: "one_day" | "weekly") => {
        void requireAuthThenContinue({
            router,
            intent: {
                type: "buy_pass_global",
                passType,
            },
            onAuthenticated: () => {
                openHomePassFlow(passType);
            },
        });
    };

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

    useEffect(() => {
        if (!isAuthenticated || !resumeAction || bannerResumeHandledRef.current) return;
        if (resumeAction !== "buy_pass_global") return;
        bannerResumeHandledRef.current = true;
        openHomePassFlow(resumePassType);
        router.replace("/");
    }, [isAuthenticated, resumeAction, resumePassType, router]);

    const visibleListings = useMemo(() => {
        if (!selectedCategory) return feed.listings;
        return feed.listings.filter((item) => matchesCategory(item, selectedCategory));
    }, [feed.listings, selectedCategory]);

    const handleHomeOverlayPayNow = async () => {
        if (!homePaymentContext || homePaymentBusy) return;
        setHomePaymentBusy(true);
        setHomePaymentError(null);
        setHomePaymentFlowState("payment_initiated");
        try {
            const session = await fakePaymentAdapter.initiate(homePaymentContext);
            setHomePaymentSessionId(session.sessionId);
            const resolved = await fakePaymentAdapter.resolve(session.sessionId);
            if (resolved.lastOutcome === "success") {
                setHomePaymentFlowState("payment_success");
                try {
                    const status = await rentalsService.getMyPassStatus();
                    const liveData = (status as { data?: PassStatus }).data;
                    if (liveData) setPassStatus(liveData);
                } catch {
                    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    setPassStatus((prev) => ({
                        free_contacts_used: prev?.free_contacts_used ?? 0,
                        free_contacts_remaining: prev?.free_contacts_remaining ?? 0,
                        has_one_day_active: homePaymentContext.passType === "one_day" || Boolean(prev?.has_one_day_active),
                        has_weekly_active: homePaymentContext.passType === "weekly" || Boolean(prev?.has_weekly_active),
                        one_day_pass_expires_at:
                            homePaymentContext.passType === "one_day" ? expiresAt : prev?.one_day_pass_expires_at ?? null,
                        weekly_pass_expires_at:
                            homePaymentContext.passType === "weekly" ? expiresAt : prev?.weekly_pass_expires_at ?? null,
                    }));
                }
                return;
            }
            setHomePaymentFlowState("payment_failed");
        } catch (err) {
            setHomePaymentFlowState("payment_failed");
            setHomePaymentError(err instanceof Error ? err.message : "Unable to process payment.");
        } finally {
            setHomePaymentBusy(false);
        }
    };

    const handleHomeOverlayRetry = async () => {
        if (!homePaymentSessionId) {
            await handleHomeOverlayPayNow();
            return;
        }
        setHomePaymentBusy(true);
        setHomePaymentError(null);
        setHomePaymentFlowState("payment_initiated");
        try {
            const resolved = await fakePaymentAdapter.retry(homePaymentSessionId);
            if (resolved.lastOutcome === "success") {
                setHomePaymentFlowState("payment_success");
                return;
            }
            setHomePaymentFlowState("payment_failed");
        } catch (err) {
            setHomePaymentFlowState("payment_failed");
            setHomePaymentError(err instanceof Error ? err.message : "Unable to retry payment.");
        } finally {
            setHomePaymentBusy(false);
        }
    };

    const resetHomePaymentFlow = () => {
        setHomePaymentFlowState("idle");
        setHomePaymentContext(null);
        setHomePaymentSessionId(null);
        setHomePaymentError(null);
        setHomePaymentBusy(false);
    };

    return (
        <main className="min-h-screen bg-[#040405] pb-24 text-white">
            <section
                className="w-full rounded-b-[28px] border-b border-[#7e59be]/55 pt-3 pb-6 sm:rounded-b-[36px] sm:pb-8"
                style={{
                    background: `
                        radial-gradient(ellipse 165% 115% at 50% 48%, rgba(167, 113, 246, 0.035) 0%, rgba(74, 29, 74, 0.012) 30%, rgba(4, 4, 5, 0) 46%),
                        radial-gradient(ellipse 95% 72% at 50% 58%, rgba(120, 62, 170, 0.09) 0%, rgba(74, 29, 74, 0.05) 34%, rgba(45, 27, 54, 0.02) 44%, rgba(4, 4, 5, 1) 64%, #040405 100%)
                    `,
                }}
            >
                <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
                    <div className="relative">
                        <div className="flex items-center justify-between gap-3 py-2">
                            <button
                                onClick={handleListProperty}
                                className="btn-shimmer rounded-full border border-white/25 px-3 py-1.5 text-xs hover:border-[#A67AEB] hover:text-[#E8DBFF] active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm"
                            >
                                List Your Property
                            </button>
                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    onClick={handleProfileClick}
                                    title={isAuthenticated ? "My Profile" : "Sign In"}
                                    className="h-10 w-10 rounded-full border border-white/30 text-lg transition hover:border-[#A67AEB] active:scale-[0.98]"
                                >
                                    ⌾
                                </button>

                            {showProfileMenu && isAuthenticated && (
                                <div className="animate-scale-in absolute right-0 top-full mt-2 w-[min(288px,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-[#0f0f13] shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-[100] overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center gap-3 p-4 border-b border-white/10">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#AF7AEB] to-[#9575e6] flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-sm font-bold">
                                                {user?.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {user?.first_name && user?.last_name
                                                    ? `${user.first_name} ${user.last_name}`
                                                    : user?.first_name || user?.email || "User"}
                                            </p>
                                            {user?.email && (
                                                <p className="text-xs text-white/50 truncate">{user.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pass & Credits */}
                                    <div className="p-4 space-y-3">
                                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">My Credits & Passes</p>

                                        {passLoading ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="w-5 h-5 rounded-full border-2 border-[#AF7AEB] border-t-transparent animate-spin" />
                                            </div>
                                        ) : passStatus ? (
                                            <>
                                                {/* Free Credits */}
                                                <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">🎁</span>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">Free Contacts</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-lg font-bold text-[#AF7AEB]">{passStatus.free_contacts_remaining}</span>
                                                        <span className="text-xs text-white/40"> / 3</span>
                                                    </div>
                                                </div>

                                                {/* One Day Pass */}
                                                {passStatus.has_one_day_active ? (
                                                    <div className="rounded-xl bg-gradient-to-r from-[#AF7AEB]/20 to-[#9575e6]/10 border border-[#AF7AEB]/30 px-3 py-2.5">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-base">✅</span>
                                                            <p className="text-sm font-semibold text-[#D4B0FF]">1-Day Unlimited Pass</p>
                                                            <span className="ml-auto text-xs bg-[#AF7AEB]/30 text-[#D4B0FF] rounded-full px-2 py-0.5 font-medium">Active</span>
                                                        </div>
                                                        {passStatus.one_day_pass_expires_at && (
                                                            <p className="text-xs text-white/50 pl-6">Expires: {formatExpiry(passStatus.one_day_pass_expires_at)}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 flex items-center gap-2">
                                                        <span className="text-base">⭕</span>
                                                        <p className="text-sm text-white/40">1-Day Pass — Inactive</p>
                                                    </div>
                                                )}

                                                {/* Weekly Pass */}
                                                {passStatus.has_weekly_active ? (
                                                    <div className="rounded-xl bg-gradient-to-r from-[#B7F041]/20 to-[#9be030]/10 border border-[#B7F041]/30 px-3 py-2.5">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-base">⭐</span>
                                                            <p className="text-sm font-semibold text-[#D8F88A]">7-Day Unlimited Pass</p>
                                                            <span className="ml-auto text-xs bg-[#B7F041]/30 text-[#D8F88A] rounded-full px-2 py-0.5 font-medium">Active</span>
                                                        </div>
                                                        {passStatus.weekly_pass_expires_at && (
                                                            <p className="text-xs text-white/50 pl-6">Expires: {formatExpiry(passStatus.weekly_pass_expires_at)}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 flex items-center gap-2">
                                                        <span className="text-base">⭕</span>
                                                        <p className="text-sm text-white/40">7-Day Pass — Inactive</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-xs text-white/40 text-center py-2">Could not load pass info</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="px-4 pb-4 pt-3 border-t border-white/10 space-y-2">
                                        <button
                                            onClick={() => { setShowProfileMenu(false); router.push("/owner/dashboard"); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            Owner Dashboard
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                router.push("/delete-account");
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/55 hover:text-amber-200/95 hover:bg-amber-500/10 rounded-lg border border-white/10 transition-colors"
                                        >
                                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                            Delete account
                                        </button>
                                        <button
                                            onClick={async () => { setShowProfileMenu(false); await logout(); router.push("/auth/login"); }}
                                            className="w-full px-3 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => router.push("/search")}
                        className="input-glow mt-4 flex w-full items-center justify-between rounded-full border border-white/12 bg-[#121216] px-4 py-3 text-left sm:px-5 sm:py-4"
                        style={{ transition: "border-color 0.2s, box-shadow 0.2s" }}
                    >
                        <span className="flex min-w-0 items-center gap-2 text-sm text-white/75 sm:text-base">
                            <svg className="h-4 w-4 shrink-0 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Let&apos;s find your new <b className="ml-1 text-white/90">House</b>
                        </span>
                        <span className="btn-shimmer shrink-0 rounded-full bg-[#A67AEB] px-3 py-1.5 text-xs font-bold sm:py-2 sm:text-sm">Search</span>
                    </button>

                    <div className="flex justify-center py-7 sm:py-10">
                        <h1
                            className="text-4xl font-black tracking-tight text-[#FAFAF9] sm:text-5xl md:text-6xl"
                            style={{ animation: "spoto-text-glow 3s ease-in-out infinite" }}
                        >
                            SPOTO
                        </h1>
                    </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-3 sm:px-6 lg:px-8">
                <section className="animate-fade-up mt-8 sm:mt-10">
                    <h2 className="mb-5 text-center text-xl font-bold text-white sm:text-2xl">What are you looking for?</h2>
                    <div className="scrollbar-hide flex gap-2.5 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible sm:gap-3">
                        {feed.categories.map((category) => (
                            <Chip
                                key={category}
                                label={category}
                                tone="hero"
                                selected={selectedCategory === category}
                                onClick={() => setSelectedCategory((prev) => (prev === category ? null : category))}
                            />
                        ))}
                    </div>
                </section>

                <section className="mt-5">
                    <HomePromoBannerRotator onBannerClick={handleBannerClick} />
                </section>

                <section className="mt-6 sm:mt-8">
                    <h3 className="mb-4 text-center text-2xl font-semibold">Recommended Houses</h3>
                    <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 sm:gap-4 lg:mx-0 lg:px-0">
                        {feed.recommended.map((property) => (
                            <div key={property.id} className="snap-start">
                                <RevampPropertyCard
                                    property={property}
                                    compact
                                    onClick={() => router.push(`/booking/${property.id}`)}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-8 sm:mt-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-2xl font-semibold">Top Listings</h3>
                        <button
                            onClick={() => router.push("/search")}
                            className="text-sm font-semibold text-[#c5acff] transition-colors hover:text-white"
                        >
                            View All →
                        </button>
                    </div>
                    {error && (
                        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                            {error}
                        </div>
                    )}
                    {loading ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E10]">
                                    <div className="spoto-shimmer h-48 w-full sm:h-56" />
                                    <div className="space-y-2 p-4">
                                        <div className="spoto-shimmer h-5 w-4/5 rounded-lg" />
                                        <div className="spoto-shimmer h-4 w-1/3 rounded-lg" />
                                        <div className="spoto-shimmer h-5 w-1/2 rounded-lg" />
                                        <div className="spoto-shimmer h-4 w-2/3 rounded-lg" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : visibleListings.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-6 text-center text-sm text-white/70">
                            No properties available right now.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                            {visibleListings.map((property, idx) => (
                                <div
                                    key={property.id}
                                    className="animate-card"
                                    style={{ animationDelay: `${Math.min(idx * 0.06, 0.4)}s` }}
                                >
                                    <RevampPropertyCard
                                        property={property}
                                        onClick={() => router.push(`/booking/${property.id}`)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="group mt-8 cursor-pointer rounded-2xl border border-[#B7F041]/30 bg-gradient-to-br from-[#0e1410] to-[#101212] p-5 text-center transition-all duration-300 hover:border-[#B7F041]/60 hover:shadow-[0_8px_32px_rgba(183,240,65,0.12)] sm:mt-10 sm:p-6">
                    <p className="text-sm font-semibold text-[#B7F041]">For Landlords</p>
                    <h3 className="mt-2 text-xl font-semibold leading-snug sm:text-2xl">
                        Get verified tenants in top Bengaluru localities
                    </h3>
                    <PrimaryButton className="mt-4" variant="green" onClick={handleListProperty}>
                        Post Property for Free →
                    </PrimaryButton>
                </section>
            </div>

            <BottomNavigation onSearchClick={() => router.push("/search")} />
            <UnlockPaymentFlowOverlay
                state={homePaymentFlowState}
                context={homePaymentContext}
                busy={homePaymentBusy}
                errorMessage={homePaymentError}
                onClosePaywall={() => setHomePaymentFlowState("dropoff_prompt")}
                onReopenPaywall={() => setHomePaymentFlowState("paywall")}
                onDismissDropoff={resetHomePaymentFlow}
                onPayNow={handleHomeOverlayPayNow}
                onRetryPayment={handleHomeOverlayRetry}
                onContinueFromSuccess={resetHomePaymentFlow}
            />
        </main>
    );
}
