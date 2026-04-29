"use client";

import React, { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OwnerCard from "@/components/revamp/OwnerCard";
import UnlockCard from "@/components/revamp/UnlockCard";
import { authAdapter, checkoutAdapter, propertyAdapter } from "@/lib/adapters";
import { CheckoutState, PropertyDetail, UnlockPaymentContext, UnlockPaymentFlowState } from "@/lib/adapters/types";
import { requireAuthThenContinue } from "@/lib/auth/requireAuthAction";
import { rentalsService } from "@/lib/rentals/service";
import UnlockPaymentFlowOverlay from "@/app/(home)/booking/[slug]/_components/UnlockPaymentFlowOverlay";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default function BookingDetailPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { slug } = use(params);

    const [property, setProperty] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [paymentFlowState, setPaymentFlowState] = useState<UnlockPaymentFlowState>("idle");
    const [paymentContext, setPaymentContext] = useState<UnlockPaymentContext | null>(null);
    const [paymentBusy, setPaymentBusy] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [unlockBusy, setUnlockBusy] = useState(false);
    const [activePassInfo, setActivePassInfo] = useState<{
        type: "one_day" | "weekly";
        expiresAt: string | null;
    } | null>(null);
    const resumeHandledRef = useRef(false);
    const resumeAction = searchParams.get("resume");
    const resumePassType: "one_day" | "weekly" = searchParams.get("passType") === "one_day" ? "one_day" : "weekly";
    const paymentAmount = 99;

    const openPaymentFlow = (passType: "one_day" | "weekly" = "one_day", amount = paymentAmount) => {
        const context: UnlockPaymentContext = {
            propertyId: property?.id || slug,
            returnPath: `/booking/${slug}`,
            passType,
            amount,
        };
        setPaymentContext(context);
        setPaymentError(null);
        setPaymentFlowState("paywall");
    };

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                const detail = await propertyAdapter.getPropertyDetail(slug);
                if (mounted) {
                    setProperty(detail);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Unable to load property details");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [slug]);

    useEffect(() => {
        setActiveImageIndex(0);
    }, [property?.id]);

    useEffect(() => {
        if (!property || !resumeAction || resumeHandledRef.current) return;
        if (resumeAction !== "unlock" && resumeAction !== "buy_pass") return;
        if (!authAdapter.getSession().isAuthenticated) return;

        resumeHandledRef.current = true;

        const runResumeAction = () => {
            openPaymentFlow(resumeAction === "buy_pass" ? resumePassType : "one_day");
            router.replace(`/booking/${slug}`);
        };

        runResumeAction();
    }, [property, resumeAction, resumePassType, router, slug]);

    const handlePayNow = async () => {
        if (property === null || paymentBusy || unlockBusy) return;
        await requireAuthThenContinue({
            router,
            intent: {
                type: "unlock_contact",
                propertyId: property.id,
            },
            onAuthenticated: async () => {
                setUnlockBusy(true);
                setPaymentError(null);
                try {
                    const started = await checkoutAdapter.startUnlock({
                        propertyId: property.id,
                        amount: paymentAmount,
                    });
                    const result = await checkoutAdapter.confirmUnlock(started.id);
                    setCheckoutState(result);

                    if (result.status === "success") {
                        setIsUnlocked(true);
                        setPaymentFlowState("idle");
                        return;
                    }

                    if (result.status === "paywall") {
                        const oneDayPrice = result.paywall?.oneDay?.price || paymentAmount;
                        openPaymentFlow("one_day", oneDayPrice);
                        return;
                    }

                    setPaymentError(result.message || "Unable to unlock owner contact.");
                } catch (error) {
                    setPaymentError(error instanceof Error ? error.message : "Unable to unlock owner contact.");
                } finally {
                    setUnlockBusy(false);
                }
            },
        });
    };

    const handleActivatePass = async (passType: "one_day" | "weekly") => {
        if (property === null || paymentBusy || unlockBusy) return;
        await requireAuthThenContinue({
            router,
            intent: {
                type: "buy_pass",
                propertyId: property.id,
                passType,
            },
            onAuthenticated: async () => {
                if (isUnlocked) return;

                // Check if user already has an active pass
                setUnlockBusy(true);
                try {
                    const res = await rentalsService.getMyPassStatus();
                    const status = (res as { data?: unknown }).data as {
                        has_one_day_active?: boolean;
                        has_weekly_active?: boolean;
                        one_day_pass_expires_at?: string | null;
                        weekly_pass_expires_at?: string | null;
                    } | undefined;
                    const hasOneDay = Boolean(status?.has_one_day_active);
                    const hasWeekly = Boolean(status?.has_weekly_active);
                    if (hasOneDay || hasWeekly) {
                        // Pass already active — show info, don't open payment
                        setActivePassInfo({
                            type: hasWeekly ? "weekly" : "one_day",
                            expiresAt: hasWeekly
                                ? (status?.weekly_pass_expires_at ?? null)
                                : (status?.one_day_pass_expires_at ?? null),
                        });
                        return;
                    }
                } catch {
                    // If check fails, proceed to payment anyway
                } finally {
                    setUnlockBusy(false);
                }

                // No active pass — open payment overlay
                const price = passType === "weekly"
                    ? (property.unlockOffer?.weeklyPassPrice || 249)
                    : 99;
                openPaymentFlow(passType, price);
            },
        });
    };

    const runRazorpayCheckout = (payment: {
        razorpayOrderId: string;
        razorpayKeyId: string;
        amount: number;
        currency: string;
        passType: "one_day" | "weekly";
    }): Promise<"success" | "failed"> => {
        return new Promise((resolve) => {
            // Load Razorpay script if not present
            const loadScript = () => {
                if ((window as unknown as Record<string, unknown>).Razorpay) {
                    openCheckout();
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.async = true;
                script.onload = openCheckout;
                script.onerror = () => resolve("failed");
                document.body.appendChild(script);
            };

            const openCheckout = () => {
                const RazorpayConstructor = (window as unknown as Record<string, unknown>).Razorpay as new (opts: unknown) => { open: () => void; on: (event: string, cb: () => void) => void };
                const options = {
                    key: payment.razorpayKeyId,
                    amount: payment.amount,
                    currency: payment.currency,
                    order_id: payment.razorpayOrderId,
                    name: "SPOTO",
                    description: payment.passType === "weekly" ? "7-Day Unlimited Pass – ₹249" : "1-Day Unlimited Pass – ₹99",
                    theme: { color: "#A67AEB" },
                    handler: () => resolve("success"),
                    modal: { ondismiss: () => resolve("failed") },
                };
                const rzp = new RazorpayConstructor(options);
                rzp.on("payment.failed", () => resolve("failed"));
                rzp.open();
            };

            loadScript();
        });
    };

    const handleOverlayPayNow = async () => {
        if (!paymentContext || !property) return;
        setPaymentBusy(true);
        setPaymentError(null);
        setPaymentFlowState("payment_initiated");

        try {
            // Step 1: Create a checkout session state if not already created
            let baseState = checkoutState;
            if (!baseState || baseState.status === "success") {
                baseState = await checkoutAdapter.startUnlock({
                    propertyId: paymentContext.propertyId,
                    amount: paymentContext.amount,
                });
                setCheckoutState(baseState);
            }

            // Step 2: Call backend to create Razorpay order
            const passState = await checkoutAdapter.activatePass(baseState.id, paymentContext.passType);
            setCheckoutState(passState);

            if (passState.status === "failed" || !passState.payment?.razorpayOrderId) {
                setPaymentFlowState("payment_failed");
                setPaymentError(passState.message || "Failed to initiate payment.");
                return;
            }

            // Step 3: Open Razorpay checkout
            const outcome = await runRazorpayCheckout(passState.payment);

            if (outcome !== "success") {
                setPaymentFlowState("payment_failed");
                return;
            }

            // Step 4: Confirm unlock via backend (retries for webhook delay)
            let unlocked = await checkoutAdapter.confirmUnlock(baseState.id);
            if (unlocked.status !== "success") {
                // Retry up to 3 times with 1.5s delay (waiting for webhook)
                for (let attempt = 0; attempt < 3; attempt++) {
                    await new Promise((r) => setTimeout(r, 1500));
                    unlocked = await checkoutAdapter.confirmUnlock(baseState.id);
                    if (unlocked.status === "success") break;
                }
            }

            setCheckoutState(unlocked);

            if (unlocked.status === "success") {
                setIsUnlocked(true);
                setPaymentFlowState("payment_success");
                setActivePassInfo({ type: paymentContext.passType, expiresAt: null });
            } else {
                setPaymentFlowState("payment_failed");
                setPaymentError("Payment received. Contact will unlock shortly — please refresh.");
            }
        } catch (err) {
            setPaymentFlowState("payment_failed");
            setPaymentError(err instanceof Error ? err.message : "Unable to process payment.");
        } finally {
            setPaymentBusy(false);
        }
    };

    const handleOverlayRetry = async () => {
        await handleOverlayPayNow();
    };

    const handleFlowContinueFromSuccess = () => {
        setPaymentFlowState("idle");
        setPaymentContext(null);
        setPaymentError(null);
        router.replace(`/booking/${slug}`);
    };

    useEffect(() => {
        const session = authAdapter.getSession();
        if (!session.isAuthenticated) {
            setActivePassInfo(null);
            return;
        }

        const syncUnlockState = async () => {
            try {
                const status = await rentalsService.getMyPassStatus();
                const data = (status as { data?: unknown }).data as
                    | { has_one_day_active?: boolean; has_weekly_active?: boolean; one_day_pass_expires_at?: string; weekly_pass_expires_at?: string }
                    | undefined;

                if (!data) {
                    setActivePassInfo(null);
                    return;
                }

                if (data.has_weekly_active || data.has_one_day_active) {
                    setActivePassInfo({
                        type: data.has_weekly_active ? "weekly" : "one_day",
                        expiresAt: data.has_weekly_active ? data.weekly_pass_expires_at || null : data.one_day_pass_expires_at || null,
                    });
                } else {
                    setActivePassInfo(null);
                }
            } catch {
                // keep UI optimistic for fake payment mode
            }
        };
        void syncUnlockState();
    }, [property?.id, isUnlocked]);

    useEffect(() => {
        if (checkoutState?.status === "success") {
            setIsUnlocked(true);
        }
    }, [checkoutState?.status]);

    const closePaywallToDropoff = () => {
        setPaymentFlowState("dropoff_prompt");
    };

    const dismissDropoff = () => {
        setPaymentFlowState("idle");
        setPaymentContext(null);
        setPaymentError(null);
    };

    const reopenPaywall = () => {
        setPaymentFlowState("paywall");
    };

    const showMobilePayButtons = !isUnlocked && paymentFlowState === "idle";

    if (loading) {
        return (
            <main className="min-h-screen bg-[#040405] text-white">
                <div className="spoto-shimmer h-56 w-full sm:h-72 md:h-[400px]" />
                <div className="mx-auto max-w-[1180px] grid grid-cols-1 gap-4 px-4 py-5 md:grid-cols-[1fr_360px] md:px-6 lg:px-8">
                    <div className="space-y-4">
                        <div className="spoto-shimmer h-9 w-3/4 rounded-xl" />
                        <div className="spoto-shimmer h-5 w-1/2 rounded-lg" />
                        <div className="spoto-shimmer h-8 w-1/3 rounded-lg" />
                        <div className="spoto-shimmer h-48 w-full rounded-2xl" />
                        <div className="spoto-shimmer h-36 w-full rounded-2xl" />
                    </div>
                    <div className="space-y-4">
                        <div className="spoto-shimmer h-40 w-full rounded-2xl" />
                        <div className="spoto-shimmer h-56 w-full rounded-2xl" />
                    </div>
                </div>
            </main>
        );
    }

    if (error !== null || property === null) {
        return (
            <main className="min-h-screen bg-[#040405] p-6 text-white">
                <div className="mx-auto max-w-4xl rounded-2xl border border-red-500/30 bg-[#101014] p-8 text-center">
                    <p className="text-2xl mb-2">😕</p>
                    <p>{error || "Property not found"}</p>
                    <button
                        onClick={() => router.back()}
                        className="btn-shimmer mt-4 rounded-xl bg-[#A67AEB] px-6 py-2.5 text-sm font-semibold text-white"
                    >
                        ← Go Back
                    </button>
                </div>
            </main>
        );
    }

    const effectiveOwner =
        checkoutState?.status === "success" && checkoutState.unlockedPhone
            ? {
                  ...property.owner,
                  ownerName: checkoutState.unlockedName || property.owner.ownerName,
                  whatsappNumber: checkoutState.unlockedPhone,
                  documents: checkoutState.unlockedDocuments || property.owner.documents || [],
              }
            : property.owner;
    const galleryImages =
        property.galleryImages && property.galleryImages.length > 0 ? property.galleryImages : [property.image];
    const activeImage = galleryImages[Math.min(activeImageIndex, galleryImages.length - 1)] || property.image;

    return (
        <main className="min-h-screen bg-[#040405] pb-28 text-white md:pb-10">
            {/* Hero image with gradient overlay */}
            <div className="relative h-56 w-full overflow-hidden sm:h-72 md:h-[420px]">
                <img src={activeImage} alt={property.title} className="h-full w-full object-cover transition-all duration-500" />
                {/* Gradient overlays */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#040405] via-transparent to-black/30" />
                <button
                    onClick={() => router.back()}
                    className="btn-shimmer absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-sm font-semibold backdrop-blur-md ring-1 ring-white/10 sm:left-4 sm:top-4 md:left-5 md:top-5"
                >
                    ← Back
                </button>
                {/* Property title overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-5 md:px-6">
                    <h1 className="line-clamp-2 text-lg font-bold leading-tight text-white drop-shadow-lg sm:text-xl md:text-2xl lg:text-3xl">{property.title}</h1>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-white/65 sm:text-sm">
                        <span className="text-xs">📍</span>
                        <span className="truncate">{property.locality}, {property.city}</span>
                    </p>
                </div>
            </div>

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
                <div className="scrollbar-hide mx-auto mt-2 flex max-w-[1180px] gap-2 overflow-x-auto px-4 md:px-6 lg:px-8">
                    {galleryImages.map((image, index) => (
                        <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`h-14 w-20 shrink-0 overflow-hidden rounded-xl border transition-all duration-200 md:h-16 md:w-24 ${
                                activeImageIndex === index
                                    ? "border-[#B7F041] shadow-[0_0_10px_rgba(183,240,65,0.3)] scale-105"
                                    : "border-white/15 opacity-70 hover:opacity-100"
                            }`}
                        >
                            <img src={image} alt={`${property.title}-${index + 1}`} className="h-full w-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Main content grid */}
            <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-4 px-4 py-5 md:grid-cols-[1fr_360px] md:gap-6 md:px-6 md:py-6 lg:grid-cols-[1fr_380px] lg:px-8">
                {/* Left — property details */}
                <section className="animate-fade-up space-y-4 md:space-y-5">
                    {/* Title & price */}
                    <div>
                        <p className="text-2xl font-bold text-[#B7F041]">
                            ₹{property.pricePerMonth.toLocaleString("en-IN")} <span className="text-sm font-medium text-[#B7F041]/70">/ Month</span>
                        </p>
                        <p className="mt-1 text-sm text-[#9A9A9A]">
                            ₹{property.deposit.toLocaleString("en-IN")} Deposit
                            <span className="mx-1.5 text-white/20">•</span>
                            {property.furnished ? "Furnished" : "Unfurnished"}
                        </p>
                    </div>

                    {/* Map preview */}
                    <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#111116] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                        <div className="px-4 pt-4">
                            <h2 className="text-lg font-semibold">Map Preview</h2>
                        </div>
                        <div className="relative mx-4 mt-3 h-44 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(120deg,#1d1d24,#101015)] md:h-52">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(175,122,235,0.3),transparent_50%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(183,240,65,0.08),transparent_40%)]" />
                            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/75 px-3 py-2.5 text-center backdrop-blur-sm">
                                <p className="text-sm font-bold text-white">{property.mapPreviewLabel}</p>
                                <p className="mt-0.5 text-xs text-[#B7F041] md:text-sm">{property.mapPreviewSubLabel}</p>
                            </div>
                        </div>
                        <p className="px-4 py-4 text-base leading-relaxed text-white/65">{property.description}</p>
                    </div>

                    {/* Amenities */}
                    {property.amenities.length > 0 && (
                        <div className="rounded-2xl border border-white/12 bg-[#111116] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                            <h2 className="text-lg font-semibold">What this place offers</h2>
                            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                                {property.amenities.map((amenity) => (
                                    <p key={amenity} className="flex items-center gap-2 text-sm text-white/75">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B7F041]/60" />
                                        {amenity}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Highlights */}
                    {property.highlights.length > 0 && (
                        <div className="rounded-2xl border border-white/12 bg-[#111116] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                            <h2 className="text-lg font-semibold">Highlights</h2>
                            <div className="mt-3 space-y-2.5">
                                {property.highlights.map((highlight) => (
                                    <p key={highlight} className="flex items-center gap-2 text-sm text-white/75">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#A67AEB]/60" />
                                        {highlight}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Right — owner & unlock */}
                <aside className="animate-slide-r space-y-3 md:sticky md:top-4 md:h-fit" style={{ animationDelay: "0.1s" }}>
                    <OwnerCard owner={effectiveOwner} isUnlocked={isUnlocked} onUnlock={isUnlocked ? undefined : handlePayNow} />

                    <UnlockCard
                        offer={property.unlockOffer}
                        checkoutState={checkoutState}
                        onPayNow={() => openPaymentFlow("one_day")}
                        onActivatePass={handleActivatePass}
                        activePassInfo={activePassInfo}
                    />
                </aside>
            </div>

            {/* Mobile bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0c0c12]/90 p-4 backdrop-blur-md md:hidden">
                {isUnlocked ? null : activePassInfo ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#B7F041]/25 bg-[#111116] px-4 py-3">
                        <span className="text-xl">{activePassInfo.type === "weekly" ? "⭐" : "✅"}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#B7F041] truncate">
                                {activePassInfo.type === "weekly" ? "7-Day Pass" : "1-Day Pass"} Active
                            </p>
                            <p className="text-xs text-white/45">Swipe card above to unlock contact</p>
                        </div>
                        <button
                            onClick={handlePayNow}
                            disabled={paymentBusy || unlockBusy}
                            className="btn-shimmer rounded-xl bg-[#A67AEB] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 shrink-0"
                        >
                            Unlock
                        </button>
                    </div>
                ) : showMobilePayButtons ? (
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            onClick={() => handleActivatePass("one_day")}
                            disabled={paymentBusy || unlockBusy}
                            className="btn-shimmer rounded-xl border border-[#B7F041]/35 bg-[#0d0d14] px-3 py-3 text-sm font-bold text-[#DFF8A2] disabled:opacity-50"
                        >
                            {paymentBusy ? (
                                <span className="flex items-center justify-center gap-1.5">
                                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#DFF8A2] border-t-transparent" />
                                    ...
                                </span>
                            ) : "⚡ ₹99 Day Pass"}
                        </button>
                        <button
                            onClick={() => handleActivatePass("weekly")}
                            disabled={paymentBusy || unlockBusy}
                            className="btn-shimmer rounded-xl border border-[#A67AEB]/35 bg-[#0d0d14] px-3 py-3 text-sm font-bold text-[#E9DCFF] disabled:opacity-50"
                        >
                            {paymentBusy ? "..." : "🌟 ₹249 Weekly"}
                        </button>
                    </div>
                ) : null}
            </div>

            <UnlockPaymentFlowOverlay
                state={paymentFlowState}
                context={paymentContext}
                busy={paymentBusy}
                errorMessage={paymentError}
                onClosePaywall={closePaywallToDropoff}
                onReopenPaywall={reopenPaywall}
                onDismissDropoff={dismissDropoff}
                onPayNow={handleOverlayPayNow}
                onRetryPayment={handleOverlayRetry}
                onContinueFromSuccess={handleFlowContinueFromSuccess}
            />
        </main>
    );
}
