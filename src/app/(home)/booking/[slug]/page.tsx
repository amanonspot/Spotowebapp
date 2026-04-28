"use client";

import React, { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OwnerCard from "@/components/revamp/OwnerCard";
import UnlockCard from "@/components/revamp/UnlockCard";
import { authAdapter, propertyAdapter } from "@/lib/adapters";
import { CheckoutState, PropertyDetail, UnlockPaymentContext, UnlockPaymentFlowState } from "@/lib/adapters/types";
import { requireAuthThenContinue } from "@/lib/auth/requireAuthAction";
import { rentalsService } from "@/lib/rentals/service";
import UnlockPaymentFlowOverlay from "@/app/(home)/booking/[slug]/_components/UnlockPaymentFlowOverlay";
import { fakePaymentAdapter } from "@/lib/payments/fakePaymentAdapter";

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
    const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
    const [paymentBusy, setPaymentBusy] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [activePassInfo, setActivePassInfo] = useState<{
        type: "one_day" | "weekly";
        expiresAt: string | null;
    } | null>(null);
    const resumeHandledRef = useRef(false);
    const resumeAction = searchParams.get("resume");
    const resumePassType: "one_day" | "weekly" = searchParams.get("passType") === "one_day" ? "one_day" : "weekly";
    const paymentAmount = 99;

    const openPaymentFlow = (passType: "one_day" | "weekly" = "one_day") => {
        const context: UnlockPaymentContext = {
            propertyId: slug,
            returnPath: `/booking/${slug}`,
            passType,
            amount: paymentAmount,
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
        if (property === null) return;
        await requireAuthThenContinue({
            router,
            intent: {
                type: "unlock_contact",
                propertyId: property.id,
            },
            onAuthenticated: async () => {
                openPaymentFlow("one_day");
            },
        });
    };

    const handleActivatePass = async (passType: "one_day" | "weekly") => {
        if (property === null) return;
        await requireAuthThenContinue({
            router,
            intent: {
                type: "buy_pass",
                propertyId: property.id,
                passType,
            },
            onAuthenticated: async () => {
                if (isUnlocked) return;
                setActivePassInfo({
                    type: passType,
                    expiresAt: null,
                });
                openPaymentFlow(passType);
            },
        });
    };

    const handleOverlayPayNow = async () => {
        if (!paymentContext) return;
        setPaymentBusy(true);
        setPaymentError(null);
        setPaymentFlowState("payment_initiated");
        try {
            const session = await fakePaymentAdapter.initiate(paymentContext);
            setPaymentSessionId(session.sessionId);
            const resolved = await fakePaymentAdapter.resolve(session.sessionId);
            if (resolved.lastOutcome === "success") {
                setPaymentFlowState("payment_success");
                setCheckoutState({
                    id: session.sessionId,
                    propertyId: paymentContext.propertyId,
                    amount: paymentContext.amount,
                    status: "success",
                    message: "Payment successful. Owner contact unlocked.",
                    updatedAt: new Date().toISOString(),
                    unlockedPhone: property?.owner.whatsappNumber,
                    unlockedName: property?.owner.ownerName,
                    unlockedDocuments: property?.owner.documents || [],
                });
                setIsUnlocked(true);
                return;
            }
            setPaymentFlowState("payment_failed");
        } catch (err) {
            setPaymentFlowState("payment_failed");
            setPaymentError(err instanceof Error ? err.message : "Unable to process payment.");
        } finally {
            setPaymentBusy(false);
        }
    };

    const handleOverlayRetry = async () => {
        if (!paymentSessionId) {
            await handleOverlayPayNow();
            return;
        }
        setPaymentBusy(true);
        setPaymentError(null);
        setPaymentFlowState("payment_initiated");
        try {
            const resolved = await fakePaymentAdapter.retry(paymentSessionId);
            if (resolved.lastOutcome === "success") {
                setPaymentFlowState("payment_success");
                setCheckoutState({
                    id: resolved.sessionId,
                    propertyId: resolved.context.propertyId,
                    amount: resolved.context.amount,
                    status: "success",
                    message: "Payment successful. Owner contact unlocked.",
                    updatedAt: new Date().toISOString(),
                    unlockedPhone: property?.owner.whatsappNumber,
                    unlockedName: property?.owner.ownerName,
                    unlockedDocuments: property?.owner.documents || [],
                });
                setIsUnlocked(true);
                return;
            }
            setPaymentFlowState("payment_failed");
        } catch (err) {
            setPaymentFlowState("payment_failed");
            setPaymentError(err instanceof Error ? err.message : "Unable to retry payment.");
        } finally {
            setPaymentBusy(false);
        }
    };

    const handleFlowContinueFromSuccess = () => {
        setPaymentFlowState("idle");
        setPaymentContext(null);
        setPaymentSessionId(null);
        setPaymentError(null);
        router.replace(`/booking/${slug}`);
    };

    useEffect(() => {
        if (!isUnlocked) return;
        const syncUnlockState = async () => {
            try {
                const status = await rentalsService.getMyPassStatus();
                const data = (status as { data?: unknown }).data as
                    | { has_one_day_active?: boolean; has_weekly_active?: boolean; one_day_pass_expires_at?: string; weekly_pass_expires_at?: string }
                    | undefined;
                if (!data) return;
                if (data.has_weekly_active || data.has_one_day_active) {
                    setActivePassInfo({
                        type: data.has_weekly_active ? "weekly" : "one_day",
                        expiresAt: data.has_weekly_active ? data.weekly_pass_expires_at || null : data.one_day_pass_expires_at || null,
                    });
                }
            } catch {
                // keep UI optimistic for fake payment mode
            }
        };
        void syncUnlockState();
    }, [isUnlocked]);

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
        setPaymentSessionId(null);
        setPaymentError(null);
    };

    const reopenPaywall = () => {
        setPaymentFlowState("paywall");
    };

    const showMobilePayButtons = !isUnlocked && paymentFlowState === "idle";

    if (loading) {
        return (
            <main className="min-h-screen bg-[#050507] p-6 text-white">
                <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#101014] p-8 text-center">
                    Loading property details...
                </div>
            </main>
        );
    }

    if (error !== null || property === null) {
        return (
            <main className="min-h-screen bg-[#050507] p-6 text-white">
                <div className="mx-auto max-w-4xl rounded-2xl border border-red-500/30 bg-[#101014] p-8 text-center">
                    {error || "Property not found"}
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
        <main className="min-h-screen bg-[#050507] pb-28 text-white md:pb-10">
            {/* Hero image */}
            <div className="relative h-56 w-full sm:h-72 md:h-[400px]">
                <img src={activeImage} alt={property.title} className="h-full w-full object-cover" />
                <button
                    onClick={() => router.back()}
                    className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold backdrop-blur-sm md:left-4 md:top-4"
                >
                    ← Back
                </button>
            </div>

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
                <div className="mx-auto mt-2 flex max-w-[1180px] gap-2 overflow-x-auto px-4 md:px-6 lg:px-8">
                    {galleryImages.map((image, index) => (
                        <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border transition-colors md:h-16 md:w-24 ${
                                activeImageIndex === index ? "border-[#B7F041]" : "border-white/20"
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
                <section className="space-y-4 md:space-y-5">
                    {/* Title & price */}
                    <div>
                        <h1 className="text-2xl font-bold leading-tight md:text-3xl">{property.title}</h1>
                        <p className="mt-1.5 text-base text-[#AFAFAF]">{property.locality}, {property.city}</p>
                        <p className="mt-2 text-2xl font-bold text-[#B7F041]">
                            ₹{property.pricePerMonth.toLocaleString("en-IN")} <span className="text-sm font-medium text-[#B7F041]/80">/ Month</span>
                        </p>
                        <p className="text-sm text-[#B3B3B3]">
                            ₹{property.deposit.toLocaleString("en-IN")} Deposit &nbsp;•&nbsp; {property.furnished ? "Furnished" : "Unfurnished"}
                        </p>
                    </div>

                    {/* Map preview */}
                    <div className="rounded-2xl border border-white/15 bg-[#111116] p-4">
                        <h2 className="text-lg font-semibold">Map Preview</h2>
                        <div className="relative mt-3 h-44 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(120deg,#1d1d24,#101015)] md:h-52">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(175,122,235,0.25),transparent_45%)]" />
                            <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/70 px-3 py-2.5 text-center">
                                <p className="text-sm font-bold text-white">{property.mapPreviewLabel}</p>
                                <p className="mt-0.5 text-xs text-[#B7F041] md:text-sm">{property.mapPreviewSubLabel}</p>
                            </div>
                        </div>
                        <p className="mt-3 text-base text-white/70 leading-relaxed">{property.description}</p>
                    </div>

                    {/* Amenities */}
                    {property.amenities.length > 0 && (
                        <div className="rounded-2xl border border-white/15 bg-[#111116] p-4">
                            <h2 className="text-lg font-semibold">What this place offers</h2>
                            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                                {property.amenities.map((amenity) => (
                                    <p key={amenity} className="text-base text-white/80">• {amenity}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Highlights */}
                    {property.highlights.length > 0 && (
                        <div className="rounded-2xl border border-white/15 bg-[#111116] p-4">
                            <h2 className="text-lg font-semibold">Highlights</h2>
                            <div className="mt-3 space-y-2">
                                {property.highlights.map((highlight) => (
                                    <p key={highlight} className="text-base text-white/80">• {highlight}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Right — owner & unlock */}
                <aside className="space-y-3 md:sticky md:top-4 md:h-fit">
                    <OwnerCard owner={effectiveOwner} isUnlocked={isUnlocked} onUnlock={isUnlocked ? undefined : handlePayNow} />

                    <UnlockCard
                        offer={property.unlockOffer}
                        checkoutState={checkoutState}
                        onPayNow={() => openPaymentFlow("one_day")}
                        onActivatePass={handleActivatePass}
                        activePassInfo={activePassInfo && !isUnlocked ? activePassInfo : null}
                    />
                </aside>
            </div>

            <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0c0c12] p-4 md:hidden">
                {isUnlocked ? null : activePassInfo ? (
                    <div className="flex items-center gap-3 rounded-xl border border-[#B7F041]/30 bg-[#111116] px-4 py-3">
                        <span className="text-lg">{activePassInfo.type === "weekly" ? "⭐" : "✅"}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#B7F041] truncate">
                                {activePassInfo.type === "weekly" ? "7-Day Pass" : "1-Day Pass"} Active
                            </p>
                            <p className="text-xs text-white/50">Tap "Unlock to Contact" to reveal</p>
                        </div>
                        <button
                            onClick={handlePayNow}
                            disabled={paymentBusy}
                            className="rounded-xl bg-[#A67AEB] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 shrink-0"
                        >
                            Unlock
                        </button>
                    </div>
                ) : showMobilePayButtons ? (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleActivatePass("one_day")}
                            disabled={paymentBusy}
                            className="rounded-xl border border-[#B7F041]/40 bg-[#0d0d14] px-3 py-3 text-sm font-semibold text-[#DFF8A2] disabled:opacity-50"
                        >
                            {paymentBusy ? "..." : "Get ₹99 Pass"}
                        </button>
                        <button
                            onClick={() => handleActivatePass("weekly")}
                            disabled={paymentBusy}
                            className="rounded-xl border border-[#A67AEB]/40 bg-[#0d0d14] px-3 py-3 text-sm font-semibold text-[#E9DCFF] disabled:opacity-50"
                        >
                            {paymentBusy ? "..." : "Get ₹249 Pass"}
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
