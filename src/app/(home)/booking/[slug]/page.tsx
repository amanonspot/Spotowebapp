"use client";

import React, { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OwnerCard from "@/components/revamp/OwnerCard";
import UnlockCard from "@/components/revamp/UnlockCard";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import { authAdapter, checkoutAdapter, propertyAdapter } from "@/lib/adapters";
import { CheckoutState, PropertyDetail } from "@/lib/adapters/types";
import { requireAuthThenContinue } from "@/lib/auth/requireAuthAction";
import { RENTALS_MOCK_MODE } from "@/lib/rentals";
import { rentalsService } from "@/lib/rentals/service";

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
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [canRetryUnlock, setCanRetryUnlock] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [unlocking, setUnlocking] = useState(false);
    const [activePassInfo, setActivePassInfo] = useState<{
        type: "one_day" | "weekly";
        expiresAt: string | null;
    } | null>(null);
    const resumeHandledRef = useRef(false);
    const resumeAction = searchParams.get("resume");
    const resumePassType = searchParams.get("passType") === "one_day" ? "one_day" : "weekly";

    const loadRazorpayScript = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            // Already loaded
            if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
                resolve();
                return;
            }
            const existing = document.querySelector<HTMLScriptElement>(
                'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            );
            if (existing) {
                // Script tag exists but may still be loading — wait for it
                if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
                    resolve();
                } else {
                    existing.addEventListener("load", () => resolve());
                    existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout script.")));
                }
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Unable to load Razorpay checkout script."));
            document.body.appendChild(script);
        });
    };

    const openRazorpayCheckout = async (state: CheckoutState) => {
        if (!state.payment) return;
        if (typeof window === "undefined") return;

        await loadRazorpayScript();

        const RazorpayCtor = (
            window as unknown as { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } }
        ).Razorpay;

        if (!RazorpayCtor) {
            throw new Error("Razorpay checkout is unavailable.");
        }

        const razorpay = new RazorpayCtor({
            key: state.payment.razorpayKeyId,
            order_id: state.payment.razorpayOrderId,
            amount: state.payment.amount,
            currency: state.payment.currency,
            name: "SPOTO",
            description: "Rental pass purchase",
            handler: async (_response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
                // Show processing state while backend webhook activates the pass
                setCheckoutState((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: "pending",
                              message: "Payment received. Activating your pass...",
                              updatedAt: new Date().toISOString(),
                          }
                        : prev
                );

                // Retry confirmUnlock — backend webhook may take a moment to activate the pass
                const MAX_ATTEMPTS = 5;
                const RETRY_DELAY_MS = 2000;

                for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                    if (attempt > 0) {
                        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
                    }
                    try {
                        const resolved = await checkoutAdapter.confirmUnlock(state.id);
                        if (resolved.status === "success") {
                            setCheckoutState(resolved);
                            setIsUnlocked(true);
                            return;
                        }
                        // Not paywall means some other state — stop retrying
                        if (resolved.status !== "paywall") {
                            setCheckoutState(resolved);
                            return;
                        }
                    } catch {
                        // continue to next attempt
                    }
                }

                // Pass still not activated after all retries — show retry button
                setCanRetryUnlock(true);
                setCheckoutState((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: "pending",
                              message: "Payment received! Tap 'Retry Unlock' below to reveal owner contact.",
                              updatedAt: new Date().toISOString(),
                          }
                        : prev
                );
            },
            modal: {
                ondismiss: () => {
                    // User closed the Razorpay modal without completing payment
                    setCheckoutState((prev) =>
                        prev && prev.status === "pending"
                            ? {
                                  ...prev,
                                  status: "paywall",
                                  message: "Payment was cancelled. Choose a pass to unlock owner contact.",
                                  updatedAt: new Date().toISOString(),
                              }
                            : prev
                    );
                },
            },
            theme: { color: "#A67AEB" },
        });
        razorpay.open();
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

        const runResumeAction = async () => {
            try {
                if (resumeAction === "unlock") {
                    await runUnlockFlow();
                    return;
                }

                let baseState = checkoutState;
                if (!baseState || (baseState.status !== "paywall" && baseState.status !== "pending")) {
                    baseState = await runUnlockFlow();
                }
                if (baseState) {
                    await runPassActivation(resumePassType, baseState);
                }
            } finally {
                router.replace(`/booking/${slug}`);
            }
        };

        void runResumeAction();
    }, [checkoutState, property, resumeAction, resumePassType, router, slug]);

    const runUnlockFlow = async (): Promise<CheckoutState | null> => {
        if (property === null) return null;
        setUnlocking(true);
        try {
            const pending = await checkoutAdapter.startUnlock({
                propertyId: property.id,
                amount: property.unlockOffer.weeklyPassPrice,
            });
            setCheckoutState(pending);

            if (RENTALS_MOCK_MODE) {
                setShowCheckoutModal(true);
                return pending;
            }

            const resolved = await checkoutAdapter.confirmUnlock(pending.id);
            setCheckoutState(resolved);
            if (resolved.status === "success") {
                setIsUnlocked(true);
            }
            return resolved;
        } catch (unlockError) {
            setCheckoutState((prev) =>
                prev
                    ? {
                          ...prev,
                          status: "failed",
                          message: unlockError instanceof Error ? unlockError.message : "Unable to unlock owner contact.",
                          updatedAt: new Date().toISOString(),
                      }
                    : prev
            );
            return null;
        } finally {
            setUnlocking(false);
        }
    };

    const handlePayNow = async () => {
        if (property === null) return;
        await requireAuthThenContinue({
            router,
            intent: {
                type: "unlock_contact",
                propertyId: property.id,
            },
            onAuthenticated: async () => {
                await runUnlockFlow();
            },
        });
    };

    const runPassActivation = async (
        passType: "one_day" | "weekly",
        baseState: CheckoutState | null = checkoutState
    ): Promise<CheckoutState | null> => {
        if (!baseState) return null;
        setUnlocking(true);
        try {
            const initiated = await checkoutAdapter.activatePass(baseState.id, passType);
            setCheckoutState(initiated);
            await openRazorpayCheckout(initiated);
            return initiated;
        } catch (passError) {
            setCheckoutState((prev) =>
                prev
                    ? {
                          ...prev,
                          status: "failed",
                          message: passError instanceof Error ? passError.message : "Unable to initiate pass payment.",
                          updatedAt: new Date().toISOString(),
                      }
                    : prev
            );
            return null;
        } finally {
            setUnlocking(false);
        }
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

                // Check if user already has an active pass
                setUnlocking(true);
                try {
                    const res = await rentalsService.getMyPassStatus();
                    const status = (res as any)?.data ?? (res as any);
                    const hasOneDay = Boolean(status?.has_one_day_active);
                    const hasWeekly = Boolean(status?.has_weekly_active);

                    if (hasOneDay || hasWeekly) {
                        // Pass is active — show info, don't open payment
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
                    setUnlocking(false);
                }

                // No active pass — go straight to payment (skip free credit consumption)
                let baseState = checkoutState;
                if (!baseState || baseState.status === "success") {
                    baseState = await checkoutAdapter.startUnlock({
                        propertyId: property.id,
                        amount: property.unlockOffer.weeklyPassPrice,
                    });
                    setCheckoutState(baseState);
                }
                await runPassActivation(passType, baseState);
            },
        });
    };

    const handleRetryUnlock = async () => {
        setCanRetryUnlock(false);
        await runUnlockFlow();
    };

    const completeCheckout = async (outcome: "success" | "failed") => {
        if (checkoutState === null) return;

        const resolved = await checkoutAdapter.confirmUnlock(checkoutState.id, outcome);
        setCheckoutState(resolved);

        if (resolved.status === "success") {
            setIsUnlocked(true);
        }

        setShowCheckoutModal(false);
    };

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
                        onPayNow={handlePayNow}
                        onActivatePass={handleActivatePass}
                        activePassInfo={activePassInfo && !isUnlocked ? activePassInfo : null}
                    />
                    {canRetryUnlock && (
                        <button
                            onClick={handleRetryUnlock}
                            disabled={unlocking}
                            className="w-full rounded-xl border border-[#B7F041]/50 bg-[#B7F041]/10 px-4 py-3 text-base font-semibold text-[#B7F041] hover:bg-[#B7F041]/20 transition-colors disabled:opacity-50"
                        >
                            {unlocking ? "Unlocking..." : "Retry Unlock"}
                        </button>
                    )}
                </aside>
            </div>

            <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0c0c12] p-4 md:hidden">
                {isUnlocked ? null : canRetryUnlock ? (
                    <button
                        onClick={handleRetryUnlock}
                        disabled={unlocking}
                        className="w-full rounded-xl border border-[#B7F041]/50 bg-[#B7F041]/10 px-4 py-3 text-base font-semibold text-[#B7F041] disabled:opacity-50"
                    >
                        {unlocking ? "Unlocking..." : "Retry Unlock"}
                    </button>
                ) : activePassInfo ? (
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
                            disabled={unlocking}
                            className="rounded-xl bg-[#A67AEB] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 shrink-0"
                        >
                            Unlock
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleActivatePass("one_day")}
                            disabled={unlocking}
                            className="rounded-xl border border-[#B7F041]/40 bg-[#0d0d14] px-3 py-3 text-sm font-semibold text-[#DFF8A2] disabled:opacity-50"
                        >
                            {unlocking ? "..." : "Get ₹99 Pass"}
                        </button>
                        <button
                            onClick={() => handleActivatePass("weekly")}
                            disabled={unlocking}
                            className="rounded-xl border border-[#A67AEB]/40 bg-[#0d0d14] px-3 py-3 text-sm font-semibold text-[#E9DCFF] disabled:opacity-50"
                        >
                            {unlocking ? "..." : "Get ₹249 Pass"}
                        </button>
                    </div>
                )}
            </div>

            {RENTALS_MOCK_MODE && showCheckoutModal ? (
                <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm">
                    <div className="mx-auto mt-24 w-[92%] max-w-md rounded-2xl border border-white/20 bg-[#121218] p-5 text-white">
                        <h3 className="text-xl font-semibold">Prototype Checkout</h3>
                        <p className="mt-2 text-sm text-white/70">Select a simulated outcome for this payment attempt.</p>

                        <div className="mt-5 grid grid-cols-1 gap-3">
                            <PrimaryButton onClick={() => completeCheckout("success")} variant="green">
                                Simulate Success
                            </PrimaryButton>
                            <PrimaryButton onClick={() => completeCheckout("failed")} variant="ghost">
                                Simulate Failure
                            </PrimaryButton>
                            <button
                                onClick={() => setShowCheckoutModal(false)}
                                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
