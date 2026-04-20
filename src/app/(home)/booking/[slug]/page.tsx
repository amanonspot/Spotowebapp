"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OwnerCard from "@/components/revamp/OwnerCard";
import UnlockCard from "@/components/revamp/UnlockCard";
import PrimaryButton from "@/components/revamp/PrimaryButton";
import { authAdapter, checkoutAdapter, propertyAdapter } from "@/lib/adapters";
import { CheckoutState, PropertyDetail } from "@/lib/adapters/types";
import { RENTALS_MOCK_MODE } from "@/lib/rentals";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default function BookingDetailPage({ params }: PageProps) {
    const router = useRouter();
    const { slug } = use(params);

    const [property, setProperty] = useState<PropertyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [unlocking, setUnlocking] = useState(false);

    const openRazorpayCheckout = async (state: CheckoutState) => {
        if (!state.payment) return;
        if (typeof window === "undefined") return;

        if (!(window as unknown as { Razorpay?: unknown }).Razorpay) {
            await new Promise<void>((resolve, reject) => {
                const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
                if (existing) {
                    resolve();
                    return;
                }
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error("Unable to load Razorpay checkout script."));
                document.body.appendChild(script);
            });
        }

        const RazorpayCtor = (window as unknown as { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } })
            .Razorpay;

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
            handler: () => {
                setCheckoutState((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: "pending",
                              message: "Payment received. Your pass will activate shortly.",
                              updatedAt: new Date().toISOString(),
                          }
                        : prev
                );
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

    const handlePayNow = async () => {
        if (property === null) return;
        const session = authAdapter.getSession();
        if (!session.isAuthenticated) {
            router.push("/auth/login");
            return;
        }

        setUnlocking(true);
        try {
            const pending = await checkoutAdapter.startUnlock({
                propertyId: property.id,
                amount: property.unlockOffer.weeklyPassPrice,
            });
            setCheckoutState(pending);

            if (RENTALS_MOCK_MODE) {
                setShowCheckoutModal(true);
                return;
            }

            const resolved = await checkoutAdapter.confirmUnlock(pending.id);
            setCheckoutState(resolved);
            if (resolved.status === "success") {
                setIsUnlocked(true);
            }
        } finally {
            setUnlocking(false);
        }
    };

    const handleActivatePass = async (passType: "one_day" | "weekly") => {
        if (!checkoutState) return;
        setUnlocking(true);
        try {
            const initiated = await checkoutAdapter.activatePass(checkoutState.id, passType);
            setCheckoutState(initiated);
            await openRazorpayCheckout(initiated);
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
        } finally {
            setUnlocking(false);
        }
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
              }
            : property.owner;
    const galleryImages =
        property.galleryImages && property.galleryImages.length > 0 ? property.galleryImages : [property.image];
    const activeImage = galleryImages[Math.min(activeImageIndex, galleryImages.length - 1)] || property.image;

    return (
        <main className="min-h-screen bg-[#050507] pb-28 text-white md:pb-10">
            <div className="relative h-[320px] w-full md:h-[420px]">
                <img src={activeImage} alt={property.title} className="h-full w-full object-cover" />
                <button
                    onClick={() => router.back()}
                    className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-2 text-sm font-semibold"
                >
                    ← Back
                </button>
            </div>
            {galleryImages.length > 1 ? (
                <div className="mx-auto mt-3 flex max-w-[1180px] gap-2 overflow-x-auto px-4 md:px-6 lg:px-8">
                    {galleryImages.map((image, index) => (
                        <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border ${
                                activeImageIndex === index ? "border-[#B7F041]" : "border-white/20"
                            }`}
                        >
                            <img src={image} alt={`${property.title}-${index + 1}`} className="h-full w-full object-cover" />
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[1.4fr_0.9fr] md:px-6 lg:px-8">
                <section className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold md:text-4xl">{property.title}</h1>
                        <p className="mt-2 text-lg text-[#AFAFAF]">{property.locality}, {property.city}</p>
                        <p className="mt-3 text-2xl font-bold text-[#B7F041]">₹{property.pricePerMonth.toLocaleString("en-IN")} / Month</p>
                        <p className="text-base text-[#B3B3B3]">₹{property.deposit.toLocaleString("en-IN")} Deposit • {property.furnished ? "Furnished" : "Unfurnished"}</p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-[#111116] p-4">
                        <h2 className="text-xl font-semibold">Map Preview</h2>
                        <div className="relative mt-3 h-52 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(120deg,#1d1d24,#101015)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(175,122,235,0.25),transparent_45%)]" />
                            <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/70 px-4 py-3 text-center">
                                <p className="text-sm font-bold text-white">{property.mapPreviewLabel}</p>
                                <p className="mt-1 text-sm text-[#B7F041]">{property.mapPreviewSubLabel}</p>
                            </div>
                        </div>
                        <p className="mt-3 text-sm text-white/70">{property.description}</p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-[#111116] p-4">
                        <h2 className="text-2xl font-semibold">What this place offers</h2>
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {property.amenities.map((amenity) => (
                                <p key={amenity} className="text-base text-white/85">• {amenity}</p>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-[#111116] p-4">
                        <h2 className="text-2xl font-semibold">Highlights</h2>
                        <div className="mt-3 space-y-2">
                            {property.highlights.map((highlight) => (
                                <p key={highlight} className="text-base text-white/85">• {highlight}</p>
                            ))}
                        </div>
                    </div>
                </section>

                <aside className="space-y-4 md:sticky md:top-4 md:h-fit">
                    <OwnerCard owner={effectiveOwner} isUnlocked={isUnlocked} />
                    <UnlockCard
                        offer={property.unlockOffer}
                        checkoutState={checkoutState}
                        onPayNow={handlePayNow}
                        onActivatePass={handleActivatePass}
                    />
                </aside>
            </div>

            <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0c0c12] p-4 md:hidden">
                <PrimaryButton onClick={handlePayNow} className="w-full text-lg">
                    {unlocking ? "Unlocking..." : isUnlocked ? "Owner Contacts Unlocked" : "Get 99 Unlimited Pass"}
                </PrimaryButton>
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
