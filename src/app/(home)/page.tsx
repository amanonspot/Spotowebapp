"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, UserCircle, X, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNavigation from "@/components/BottomNavigation";
import Chip from "@/components/revamp/Chip";
import HomePromoBannerRotator from "@/components/revamp/HomePromoBannerRotator";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import RevampPropertyCard from "@/components/revamp/PropertyCard";
import { authAdapter, checkoutAdapter, propertyAdapter } from "@/lib/adapters";
import { CheckoutState, HomeFeed, PropertyListItem, UnlockPaymentContext, UnlockPaymentFlowState } from "@/lib/adapters/types";
import { requireAuthThenContinue } from "@/lib/auth/requireAuthAction";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUnlockedTenantContacts, rentalsService, warmMastersCache, type UnlockedContactRecord } from "@/lib/rentals";
import UnlockPaymentFlowOverlay from "@/app/(home)/booking/[slug]/_components/UnlockPaymentFlowOverlay";
import { runRazorpayCheckout } from "@/lib/payments/razorpayCheckout";
import { pushEvent, ANALYTICS_EVENTS } from "@/lib/analytics";

const INITIAL_VISIBLE_LISTINGS = 9;
const LISTINGS_APPEND_CHUNK = 6;

const initialFeed: HomeFeed = {
    categories: [],
    localities: [],
    recommended: [],
    listings: [],
    topEvents: [],
    promoBannerText: "",
};

const listingTextBlob = (item: PropertyListItem): string =>
    [item.title, item.propertyTitle, ...item.badges, ...item.features].filter(Boolean).join(" ").toLowerCase();

/** Pill filters: prefer normalized propertyTypes, then fall back to title/badges/deposit so live API rows still match. */
const matchesCategory = (item: PropertyListItem, category: string) => {
    const blob = listingTextBlob(item);
    const types = item.propertyTypes;

    if (category.includes("Rent House")) {
        if (/\b(pg|paying\s+guest|co[\s-]?living|coliving)\b/.test(blob) || /\bco living\b/.test(blob)) {
            return false;
        }
        if (types.includes("rent_house")) return true;
        return /\b(bhk|flat|apartment|independent|villa|studio|house|rent)\b/i.test(blob);
    }
    if (category.includes("Zero Deposit")) {
        if (types.includes("zero_deposit")) return true;
        if (item.deposit === 0) return true;
        return /no deposit|zero deposit|nil deposit|deposit[:\s]*0\b|0\s*deposit/.test(blob);
    }
    if (category.includes("Co-Living")) {
        if (types.includes("co_living")) return true;
        return /co[\s-]?living|coliving|\bco living\b|shared (flat|room|accommodation)/.test(blob);
    }
    if (category.includes("PG")) {
        if (types.includes("pg")) return true;
        return /\bpg\b|paying\s+guest|pg[\s-]?accommodation|boys?[\s-]?pg|girls?[\s-]?pg/.test(blob);
    }
    if (category.includes("Pet Friendly")) {
        if (item.badges.some((b) => b.toLowerCase().includes("pet"))) return true;
        if (item.features.some((f) => f.toLowerCase().includes("pet"))) return true;
        return /pet[\s-]?friend|pets?\s+(allowed|welcome|ok)|\b(dogs?|cats?)\b.*(allowed|welcome|ok)/.test(blob);
    }
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

function contactsUnlockedSummary(pass: PassStatus): string {
    if (pass.has_one_day_active) return "Day pass active — unlimited contacts";
    if (pass.has_weekly_active) return "Access pass active — unlimited contacts";
    if (pass.free_contacts_remaining > 0) return `${pass.free_contacts_remaining} free contact${pass.free_contacts_remaining === 1 ? "" : "s"} left`;
    return "Unlock owner numbers & WhatsApp";
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
    const [showUnlockedContactsPanel, setShowUnlockedContactsPanel] = useState(false);
    const [savedUnlockedContacts, setSavedUnlockedContacts] = useState<UnlockedContactRecord[]>([]);
    const [passStatus, setPassStatus] = useState<PassStatus | null>(null);
    const [passLoading, setPassLoading] = useState(false);
    const [isAgent, setIsAgent] = useState(false);
    const [homePaymentFlowState, setHomePaymentFlowState] = useState<UnlockPaymentFlowState>("idle");
    const [homePaymentContext, setHomePaymentContext] = useState<UnlockPaymentContext | null>(null);
    const [homeCheckoutState, setHomeCheckoutState] = useState<CheckoutState | null>(null);
    const [homePaymentBusy, setHomePaymentBusy] = useState(false);
    const [homePaymentError, setHomePaymentError] = useState<string | null>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const bannerResumeHandledRef = useRef(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_LISTINGS);
    const [isAppendingListings, setIsAppendingListings] = useState(false);
    const [listingsApiPage, setListingsApiPage] = useState(1);
    const [listingsHasMore, setListingsHasMore] = useState(false);
    const listingsHasMoreRef = useRef(false);
    const listingsApiPageRef = useRef(1);
    const isAppendingListingsRef = useRef(false);
    const resumeAction = searchParams.get("resume");
    const globalPassOneDayAmount = 99;

    useEffect(() => {
        if (!isAuthenticated) {
            setIsAgent(false);
            localStorage.removeItem("spoto_is_agent");
            return;
        }

        if (localStorage.getItem("spoto_is_agent") === "1") {
            setIsAgent(true);
        }

        let active = true;
        import("@/lib/adapters").then(({ agentAdapter }) =>
            agentAdapter.getAgentProfile()
                .then((profile) => {
                    if (!active) return;
                    if (profile?.is_agent && profile.employee) {
                        setIsAgent(true);
                        localStorage.setItem("spoto_is_agent", "1");
                    } else {
                        setIsAgent(false);
                        localStorage.removeItem("spoto_is_agent");
                    }
                })
                .catch(() => {
                    // Keep cached status if the backend check fails.
                })
        );

        return () => {
            active = false;
        };
    }, [isAuthenticated]);

    const handleDashboardClick = async () => {
        setShowProfileMenu(false);
        if (isAgent || localStorage.getItem("spoto_is_agent") === "1") {
            router.push("/agent/dashboard");
            return;
        }

        try {
            const { agentAdapter } = await import("@/lib/adapters");
            const profile = await agentAdapter.getAgentProfile();
            if (profile?.is_agent && profile.employee) {
                setIsAgent(true);
                localStorage.setItem("spoto_is_agent", "1");
                router.push("/agent/dashboard");
                return;
            }
        } catch {
            // Fall back to owner dashboard when agent status cannot be confirmed.
        }

        router.push("/owner/dashboard");
    };

    const handleProfileClick = async () => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        setShowUnlockedContactsPanel(false);
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
        if (!isAuthenticated) {
            setPassStatus(null);
            return;
        }
        let cancelled = false;
        setPassLoading(true);
        void (async () => {
            try {
                const res = await rentalsService.getMyPassStatus();
                const data = (res as any)?.data ?? (res as any);
                if (!cancelled) setPassStatus(data);
            } catch {
                if (!cancelled) setPassStatus(null);
            } finally {
                if (!cancelled) setPassLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    const passUnlocked = Boolean(
        passStatus &&
            (passStatus.has_one_day_active ||
                passStatus.has_weekly_active ||
                passStatus.free_contacts_remaining > 0)
    );

    const listingTitleById = useMemo(() => {
        const m = new Map<string, string>();
        for (const item of feed.listings) {
            m.set(item.id, item.title || item.propertyTitle || item.id);
        }
        return m;
    }, [feed.listings]);

    const savedContactCount = savedUnlockedContacts.length;

    useEffect(() => {
        if (!isAuthenticated) {
            setSavedUnlockedContacts([]);
            return;
        }
        const sync = () => setSavedUnlockedContacts(getUnlockedTenantContacts());
        sync();
        const onVis = () => {
            if (document.visibilityState === "visible") sync();
        };
        window.addEventListener("focus", sync);
        document.addEventListener("visibilitychange", onVis);
        return () => {
            window.removeEventListener("focus", sync);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [isAuthenticated]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
                setShowUnlockedContactsPanel(false);
            }
        };
        if (showProfileMenu || showUnlockedContactsPanel) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showProfileMenu, showUnlockedContactsPanel]);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return;
        const mq = window.matchMedia("(max-width: 767px)");
        const clearPanel = () => {
            if (mq.matches) setShowUnlockedContactsPanel(false);
        };
        clearPanel();
        mq.addEventListener("change", clearPanel);
        return () => mq.removeEventListener("change", clearPanel);
    }, []);

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

    const openHomePassFlow = () => {
        setHomePaymentContext({
            propertyId: "global_pass",
            returnPath: "/",
            passType: "one_day",
            amount: globalPassOneDayAmount,
        });
        setHomePaymentError(null);
        setHomePaymentFlowState("paywall");
    };

    const handleContactsUnlockClick = () => {
        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        setShowProfileMenu(false);
        setShowUnlockedContactsPanel((prev) => {
            if (prev) return false;
            setSavedUnlockedContacts(getUnlockedTenantContacts());
            return true;
        });
    };

    const handleGetPassFromContactsPanel = () => {
        setShowUnlockedContactsPanel(false);
        void requireAuthThenContinue({
            router,
            intent: { type: "buy_pass_global", passType: "one_day" },
            onAuthenticated: () => {
                openHomePassFlow();
            },
        });
    };

    const handleBannerClick = () => {
        void requireAuthThenContinue({
            router,
            intent: {
                type: "buy_pass_global",
                passType: "one_day",
            },
            onAuthenticated: () => {
                openHomePassFlow();
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
                    setListingsApiPage(nextFeed.listingsMeta?.page ?? 1);
                    setListingsHasMore(nextFeed.listingsMeta?.hasMore ?? false);
                    listingsApiPageRef.current = nextFeed.listingsMeta?.page ?? 1;
                    listingsHasMoreRef.current = nextFeed.listingsMeta?.hasMore ?? false;
                    pushEvent(ANALYTICS_EVENTS.HOME_LOADED, {
                        property_count: nextFeed.listings.length,
                        is_logged_in: false,
                    });
                    // Warm master cache in background for search/filters — does not block home render.
                    void warmMastersCache();
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
        openHomePassFlow();
        router.replace("/");
    }, [isAuthenticated, resumeAction, router]);

    const filteredListings = useMemo(() => {
        if (!selectedCategory) return feed.listings;
        return feed.listings.filter((item) => matchesCategory(item, selectedCategory));
    }, [feed.listings, selectedCategory]);

    const visibleListings = useMemo(
        () => filteredListings.slice(0, visibleCount),
        [filteredListings, visibleCount]
    );

    const hasMoreListings = visibleCount < filteredListings.length || listingsHasMore;

    useEffect(() => {
        listingsHasMoreRef.current = listingsHasMore;
    }, [listingsHasMore]);

    useEffect(() => {
        listingsApiPageRef.current = listingsApiPage;
    }, [listingsApiPage]);

    useEffect(() => {
        isAppendingListingsRef.current = isAppendingListings;
    }, [isAppendingListings]);

    useEffect(() => {
        setVisibleCount(Math.min(INITIAL_VISIBLE_LISTINGS, filteredListings.length));
    }, [filteredListings, selectedCategory]);

    useEffect(() => {
        if (!hasMoreListings || loading) return;
        const node = loadMoreRef.current;
        if (!node) return;

        const appendFromFeed = () => {
            setVisibleCount((prev) => Math.min(filteredListings.length, prev + LISTINGS_APPEND_CHUNK));
        };

        const fetchAndAppend = async () => {
            if (isAppendingListingsRef.current || !listingsHasMoreRef.current) return;
            isAppendingListingsRef.current = true;
            setIsAppendingListings(true);
            try {
                const nextPage = listingsApiPageRef.current + 1;
                const { items, meta } = await propertyAdapter.loadMoreHomeListings(nextPage);
                setFeed((prev) => ({
                    ...prev,
                    listings: [...prev.listings, ...items],
                    listingsMeta: meta,
                }));
                setListingsApiPage(meta.page);
                setListingsHasMore(meta.hasMore);
                listingsApiPageRef.current = meta.page;
                listingsHasMoreRef.current = meta.hasMore;
                setVisibleCount((prev) => prev + LISTINGS_APPEND_CHUNK);
            } catch {
                setListingsHasMore(false);
                listingsHasMoreRef.current = false;
            } finally {
                isAppendingListingsRef.current = false;
                setIsAppendingListings(false);
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting || isAppendingListingsRef.current) return;

                if (visibleCount < filteredListings.length) {
                    setIsAppendingListings(true);
                    window.setTimeout(() => {
                        appendFromFeed();
                        setIsAppendingListings(false);
                    }, 80);
                    return;
                }

                void fetchAndAppend();
            },
            { rootMargin: "280px 0px" }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMoreListings, isAppendingListings, loading, filteredListings.length, visibleCount]);

    const refreshHomePassStatus = async (): Promise<PassStatus | null> => {
        try {
            const res = await rentalsService.getMyPassStatus();
            const data = ((res as { data?: PassStatus }).data ?? res) as PassStatus;
            setPassStatus(data);
            return data;
        } catch {
            return null;
        }
    };


    const handleHomeOverlayPayNow = async () => {
        if (!homePaymentContext || homePaymentBusy) return;
        setHomePaymentBusy(true);
        setHomePaymentError(null);
        setHomePaymentFlowState("payment_initiated");
        try {
            let baseState = homeCheckoutState;
            if (!baseState || baseState.status === "success") {
                baseState = await checkoutAdapter.startUnlock({
                    propertyId: homePaymentContext.propertyId,
                    amount: homePaymentContext.amount,
                });
                setHomeCheckoutState(baseState);
            }

            const passState = await checkoutAdapter.activatePass(baseState.id);
            setHomeCheckoutState(passState);

            if (passState.status === "failed" || !passState.payment?.razorpayOrderId) {
                setHomePaymentFlowState("payment_failed");
                setHomePaymentError(passState.message || "Failed to initiate payment.");
                return;
            }

            const outcome = await runRazorpayCheckout(passState.payment);

            if (outcome.status !== "success" || !outcome.paymentId || !outcome.signature) {
                setHomePaymentFlowState("payment_failed");
                return;
            }

            // Atomically verify payment + activate pass (no webhook race condition)
            const session = authAdapter.getSession();
            const unlocked = await checkoutAdapter.verifyAndUnlock({
                razorpayPaymentId: outcome.paymentId,
                razorpayOrderId: outcome.orderId ?? passState.payment.razorpayOrderId,
                razorpaySignature: outcome.signature,
                propertyId: homePaymentContext.propertyId,
                name: session.userName ?? undefined,
                phone: session.phone ?? undefined,
            });

            if (unlocked.status === "success") {
                await refreshHomePassStatus();
                setHomePaymentFlowState("payment_success");
                return;
            }

            setHomePaymentFlowState("payment_failed");
            setHomePaymentError(unlocked.message || "Payment received. Pass will activate shortly — please refresh.");
        } catch (err) {
            setHomePaymentFlowState("payment_failed");
            setHomePaymentError(err instanceof Error ? err.message : "Unable to process payment.");
        } finally {
            setHomePaymentBusy(false);
        }
    };

    const handleHomeOverlayRetry = async () => {
        await handleHomeOverlayPayNow();
    };

    const resetHomePaymentFlow = () => {
        setHomePaymentFlowState("idle");
        setHomePaymentContext(null);
        setHomeCheckoutState(null);
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
                            <div className="relative flex shrink-0 items-center gap-2 sm:gap-2.5" ref={profileMenuRef}>
                                <button
                                    type="button"
                                    onClick={handleContactsUnlockClick}
                                    aria-label="View owner contacts you have unlocked"
                                    title={
                                        isAuthenticated && passStatus
                                            ? `${contactsUnlockedSummary(passStatus)}${savedContactCount > 0 ? ` · ${savedContactCount} saved owner contact${savedContactCount === 1 ? "" : "s"}` : ""}`
                                            : isAuthenticated
                                              ? "Owners you unlocked appear here — get a pass for more"
                                              : "Sign in to unlock owner contacts"
                                    }
                                    className={`btn-shimmer hidden max-w-[148px] items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left transition active:scale-[0.98] min-[400px]:max-w-none sm:gap-2 sm:px-3.5 sm:py-2 md:flex ${
                                        passUnlocked
                                            ? "border-[#B7F041]/45 bg-[linear-gradient(135deg,rgba(183,240,65,0.14)_0%,rgba(15,17,14,0.92)_55%)] text-[#E8FBC4] shadow-[0_0_20px_rgba(183,240,65,0.12)] hover:border-[#B7F041]/65 hover:shadow-[0_0_28px_rgba(183,240,65,0.2)]"
                                            : "border-[#A67AEB]/40 bg-[#0c0a12] text-white/95 shadow-[0_0_18px_rgba(166,122,235,0.08)] hover:border-[#A67AEB]/55 hover:shadow-[0_0_24px_rgba(166,122,235,0.18)]"
                                    } ${passLoading && isAuthenticated ? "opacity-90" : ""}`}
                                >
                                    {passUnlocked ? (
                                        <BadgeCheck
                                            className="h-4 w-4 shrink-0 text-[#B7F041] sm:h-[18px] sm:w-[18px]"
                                            strokeWidth={2.25}
                                            aria-hidden
                                        />
                                    ) : (
                                        <Zap
                                            className="h-4 w-4 shrink-0 text-[#D4B0FF] sm:h-[18px] sm:w-[18px]"
                                            strokeWidth={2.1}
                                            aria-hidden
                                        />
                                    )}
                                    <span className="min-w-0 flex flex-col leading-tight">
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-white/50 sm:text-[11px]">
                                            {passLoading && isAuthenticated
                                                ? "Checking…"
                                                : passUnlocked
                                                  ? "Unlocked"
                                                  : "My unlocks"}
                                        </span>
                                        <span className="truncate text-[11px] font-semibold sm:text-xs">
                                            {passLoading && isAuthenticated
                                                ? "Status"
                                                : savedContactCount > 0
                                                  ? `${savedContactCount} owner${savedContactCount === 1 ? "" : "s"}`
                                                  : passUnlocked
                                                    ? "Pass active"
                                                    : "See saved"}
                                        </span>
                                    </span>
                                </button>

                            {showUnlockedContactsPanel && isAuthenticated && (
                                <div
                                    className={`animate-scale-in absolute right-0 top-full z-[100] mt-2 flex w-[min(380px,calc(100vw-1.5rem))] max-h-[min(480px,75vh)] flex-col overflow-hidden rounded-2xl border border-[#A67AEB]/35 bg-[#0c0c10] shadow-[0_24px_64px_rgba(0,0,0,0.75)] max-md:hidden`}
                                >
                                    <div className="flex shrink-0 items-start justify-between gap-2 border-b border-white/10 bg-[#12121a] px-4 py-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white">Unlocked owner contacts</p>
                                            <p className="mt-0.5 text-xs text-white/55">
                                                Numbers &amp; WhatsApp you revealed on listings stay here on this device.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label="Close"
                                            className="rounded-lg p-1 text-white/45 transition hover:bg-white/10 hover:text-white"
                                            onClick={() => setShowUnlockedContactsPanel(false)}
                                        >
                                            <X className="h-5 w-5" strokeWidth={2} />
                                        </button>
                                    </div>
                                    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                                        {savedUnlockedContacts.length === 0 ? (
                                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center">
                                                <p className="text-sm text-white/75">No saved unlocks yet.</p>
                                                <p className="mt-1 text-xs text-white/45">
                                                    Open a listing and unlock owner contact — it will show up here.
                                                </p>
                                                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowUnlockedContactsPanel(false);
                                                            router.push("/search");
                                                        }}
                                                        className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                                                    >
                                                        Browse listings
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleGetPassFromContactsPanel}
                                                        className="rounded-full border border-[#A67AEB]/50 bg-[#A67AEB]/15 px-4 py-2 text-sm font-semibold text-[#E8DBFF] hover:bg-[#A67AEB]/25"
                                                    >
                                                        Day pass ₹99
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <ul className="space-y-2.5">
                                                {savedUnlockedContacts.map((contact) => {
                                                    const listingTitle =
                                                        listingTitleById.get(contact.propertyId) || `Listing ${contact.propertyId.slice(0, 8)}…`;
                                                    const wa = contact.phone.replace(/\D/g, "");
                                                    return (
                                                        <li
                                                            key={contact.id}
                                                            className="rounded-xl border border-white/10 bg-[#101018] p-3.5"
                                                        >
                                                            <p className="font-semibold text-white">{contact.name}</p>
                                                            <p className="mt-0.5 line-clamp-2 text-xs text-white/50">{listingTitle}</p>
                                                            <p className="mt-2 font-mono text-sm text-[#c5acff]">{contact.phone}</p>
                                                            <p className="mt-1 text-[10px] uppercase tracking-wide text-white/35">
                                                                Unlocked{" "}
                                                                {new Date(contact.unlockedAt).toLocaleString("en-IN", {
                                                                    day: "numeric",
                                                                    month: "short",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </p>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <a
                                                                    href={`https://wa.me/${wa}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center justify-center rounded-full bg-[#A67AEB] px-3 py-1.5 text-xs font-bold text-[#14141a]"
                                                                >
                                                                    WhatsApp
                                                                </a>
                                                                <a
                                                                    href={`tel:${contact.phone}`}
                                                                    className="inline-flex items-center justify-center rounded-full border border-[#A67AEB]/55 px-3 py-1.5 text-xs font-bold text-[#E8DBFF]"
                                                                >
                                                                    Call
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setShowUnlockedContactsPanel(false);
                                                                        router.push(`/booking/${contact.propertyId}`);
                                                                    }}
                                                                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                                                                >
                                                                    View listing
                                                                </button>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="shrink-0 border-t border-white/10 bg-[#0e0e12] px-3 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowUnlockedContactsPanel(false);
                                                router.push("/contacts");
                                            }}
                                            className="w-full text-center text-xs font-semibold text-[#c5acff] hover:text-white"
                                        >
                                            Open full contacts page →
                                        </button>
                                    </div>
                                </div>
                            )}

                                <button
                                    onClick={handleProfileClick}
                                    type="button"
                                    title={isAuthenticated ? "My Profile" : "Sign In"}
                                    aria-label={isAuthenticated ? "My Profile" : "Sign In"}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/35 bg-[#0c0a12] transition hover:border-[#A67AEB] active:scale-[0.98]"
                                >
                                    <UserCircle
                                        className="h-[22px] w-[22px] text-white/95"
                                        strokeWidth={1.65}
                                        aria-hidden
                                    />
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

                                                {passStatus.has_weekly_active ? (
                                                    <div className="rounded-xl bg-gradient-to-r from-[#B7F041]/20 to-[#9be030]/10 border border-[#B7F041]/30 px-3 py-2.5">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-base">⭐</span>
                                                            <p className="text-sm font-semibold text-[#D8F88A]">Legacy access pass</p>
                                                            <span className="ml-auto text-xs bg-[#B7F041]/30 text-[#D8F88A] rounded-full px-2 py-0.5 font-medium">Active</span>
                                                        </div>
                                                        {passStatus.weekly_pass_expires_at && (
                                                            <p className="text-xs text-white/50 pl-6">Expires: {formatExpiry(passStatus.weekly_pass_expires_at)}</p>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </>
                                        ) : (
                                            <p className="text-xs text-white/40 text-center py-2">Could not load pass info</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="px-4 pb-4 pt-3 border-t border-white/10 space-y-2">
                                        <button
                                            onClick={handleDashboardClick}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            {isAgent ? "Agent Dashboard" : "Dashboard"}
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
                            Let&apos;s find your new house
                        </span>
                        <span className="btn-shimmer shrink-0 rounded-full bg-[#A67AEB] px-3 py-1.5 text-xs font-bold sm:py-2 sm:text-sm">Search</span>
                    </button>

                    <div className="flex justify-center py-7 sm:py-10">
                        <h1
                            className="spoto-wordmark text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl"
                            style={{ color: "var(--tw-color-neutral-50, #fafafa)", WebkitTextStroke: "3px currentColor" }}
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
                                    onClick={() => {
                                        pushEvent(ANALYTICS_EVENTS.PROPERTY_CARD_CLICKED, {
                                            property_id: property.id,
                                            city: '',
                                            source: 'home',
                                            position_index: 0,
                                        });
                                        router.push(`/booking/${property.id}`);
                                    }}
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
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
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
                            {selectedCategory && feed.listings.length > 0 ? (
                                <>
                                    No listings match{" "}
                                    <span className="font-semibold text-white/90">{selectedCategory}</span>. Try another
                                    category or use Search.
                                </>
                            ) : (
                                "No properties available right now."
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                                {visibleListings.map((property, idx) => (
                                    <div
                                        key={property.id}
                                        className="animate-card"
                                        style={{ animationDelay: `${Math.min(idx * 0.06, 0.4)}s` }}
                                    >
                                        <RevampPropertyCard
                                            property={property}
                                            onClick={() => {
                                                pushEvent(ANALYTICS_EVENTS.PROPERTY_CARD_CLICKED, {
                                                    property_id: property.id,
                                                    city: '',
                                                    source: 'home',
                                                    position_index: idx,
                                                });
                                                router.push(`/booking/${property.id}`);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            {hasMoreListings ? (
                                <div ref={loadMoreRef} className="mt-6 flex justify-center py-4 text-sm text-white/45">
                                    {isAppendingListings ? "Loading more..." : "Scroll for more listings"}
                                </div>
                            ) : null}
                        </>
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
