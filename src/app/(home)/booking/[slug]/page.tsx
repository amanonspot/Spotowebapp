"use client";

import React, { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OwnerCard from "@/components/revamp/OwnerCard";
import UnlockCard from "@/components/revamp/UnlockCard";
import { authAdapter, checkoutAdapter, propertyAdapter } from "@/lib/adapters";
import { CheckoutState, PropertyDetail, UnlockPaymentContext, UnlockPaymentFlowState } from "@/lib/adapters/types";
import { requireAuthThenContinue } from "@/lib/auth/requireAuthAction";
import { rentalsService } from "@/lib/rentals/service";
import UnlockPaymentFlowOverlay from "@/app/(home)/booking/[slug]/_components/UnlockPaymentFlowOverlay";
import PropertyMediaPreview from "@/components/revamp/PropertyMediaPreview";
import { extractLatLngFromGoogleMapsUrl } from "@/lib/maps/parseGoogleMapsUrl";
import { isVideoMediaUrl } from "@/lib/rentals/mediaUtils";
import type { PropertyMediaItem } from "@/lib/rentals/mediaUtils";
import { runRazorpayCheckout } from "@/lib/payments/razorpayCheckout";
import { pushEvent, ANALYTICS_EVENTS, generateEventId } from "@/lib/analytics";
import { mpViewContent, mpInitiateCheckout, mpPurchase, mpLead } from "@/lib/analytics/metaPixel";

interface PageProps {
    params: Promise<{ slug: string }>;
}

function formatListingDate(iso?: string): string | null {
    if (!iso?.trim()) return null;
    const d = new Date(iso.trim());
    if (Number.isNaN(d.getTime())) return iso.trim();
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatBhkFallback(bhk: string): string {
    const t = bhk.trim();
    if (!t) return "";
    const asBhk = t.match(/^(\d+)_bhk$/i);
    if (asBhk) return `${asBhk[1]} BHK`;
    const asRk = t.match(/^(\d+)_rk$/i);
    if (asRk) return `${asRk[1]} RK`;
    return t
        .replace(/_/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

type PassStatusDto = {
    has_one_day_active?: boolean;
    has_weekly_active?: boolean;
    one_day_pass_expires_at?: string | null;
    weekly_pass_expires_at?: string | null;
};

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
        expiresAt: string | null;
    } | null>(null);
    const [passStatusHydrated, setPassStatusHydrated] = useState(false);
    const resumeHandledRef = useRef(false);
    const passEventIdRef = useRef<string>('');
    const resumeAction = searchParams.get("resume");
    const paymentAmount = 99;

    // ── Engagement tracking refs ───────────────────────────────────────────────
    const pageEnteredAtRef = useRef<number>(Date.now());
    const paywallOpenedAtRef = useRef<number | null>(null);
    const sawPaywallRef = useRef(false);

    const openPaymentFlow = (amount = paymentAmount, trigger: 'no_credits' | 'buy_pass_cta' | 'resume' = 'no_credits') => {
        const context: UnlockPaymentContext = {
            propertyId: property?.id || slug,
            returnPath: `/booking/${slug}`,
            passType: "one_day",
            amount,
        };
        setPaymentContext(context);
        setPaymentError(null);
        setPaymentFlowState("paywall");

        // Track paywall view
        sawPaywallRef.current = true;
        paywallOpenedAtRef.current = Date.now();
        if (property) {
            pushEvent(ANALYTICS_EVENTS.PASS_PAYWALL_VIEWED, {
                property_id: property.id,
                city: property.city ?? '',
                bhk: property.bhk ?? '',
                rent: property.pricePerMonth ?? 0,
                trigger,
            });
            mpInitiateCheckout({ property_id: property.id, amount: amount });
        }
    };

    const mapPassStatusToInfo = (data: PassStatusDto | undefined | null) => {
        if (!data) return null;
        if (data.has_one_day_active) {
            return { expiresAt: data.one_day_pass_expires_at ?? null };
        }
        if (data.has_weekly_active) {
            return { expiresAt: data.weekly_pass_expires_at ?? null };
        }
        return null;
    };

    const refreshPassStatus = useCallback(async () => {
        const session = authAdapter.getSession();
        if (!session.isAuthenticated) {
            setActivePassInfo(null);
            setPassStatusHydrated(true);
            return null;
        }

        try {
            const response = await rentalsService.getMyPassStatus();
            const raw = response as { data?: PassStatusDto } & PassStatusDto | undefined;
            const data = (raw && typeof raw === "object" && "data" in raw && raw.data
                ? raw.data
                : raw) as PassStatusDto | undefined;
            const mapped = mapPassStatusToInfo(data);
            setActivePassInfo(mapped);
            setPassStatusHydrated(true);
            return mapped;
        } catch {
            // Keep previous known backend truth; fallback to inactive only when no status has ever been hydrated.
            if (!passStatusHydrated) {
                setActivePassInfo(null);
            }
            return null;
        }
    }, [passStatusHydrated]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                setLoading(true);
                const detail = await propertyAdapter.getPropertyDetail(slug);
                if (mounted) {
                    setProperty(detail);
                    pushEvent(ANALYTICS_EVENTS.PROPERTY_DETAIL_VIEWED, {
                        property_id: detail.id,
                        city: detail.city ?? '',
                        locality: detail.locality ?? '',
                        bhk: detail.bhk ?? '',
                        rent: detail.pricePerMonth ?? 0,
                        property_type: detail.propertyTypes?.[0] ?? '',
                    });
                    mpViewContent({
                        property_id: detail.id,
                        city: detail.city ?? '',
                        bhk: detail.bhk ?? '',
                        rent: detail.pricePerMonth ?? 0,
                    });
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

    // ── Property detail exit tracking ─────────────────────────────────────────
    useEffect(() => {
        pageEnteredAtRef.current = Date.now();
        return () => {
            const timeSpent = Math.round((Date.now() - pageEnteredAtRef.current) / 1000);
            pushEvent(ANALYTICS_EVENTS.PROPERTY_DETAIL_EXITED, {
                property_id: slug,
                time_spent_seconds: timeSpent,
                was_unlocked: false,
                saw_paywall: sawPaywallRef.current,
            });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            openPaymentFlow(paymentAmount, 'resume');
            router.replace(`/booking/${slug}`);
        };

        runResumeAction();
    }, [property, resumeAction, router, slug]);

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

                pushEvent(ANALYTICS_EVENTS.PROPERTY_UNLOCK_CLICKED, {
                    property_id: property.id,
                    city: property.city ?? '',
                    bhk: property.bhk ?? '',
                    rent: property.pricePerMonth ?? 0,
                    credits_available: 0,
                    has_pass: Boolean(activePassInfo),
                    unlock_method_available: activePassInfo ? 'pass' : 'credit',
                });

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
                        pushEvent(ANALYTICS_EVENTS.PROPERTY_UNLOCK_SUCCESS, {
                            property_id: property.id,
                            city: property.city ?? '',
                            bhk: property.bhk ?? '',
                            rent: property.pricePerMonth ?? 0,
                            unlock_method: 'credit',
                        });
                        mpLead({ property_id: property.id, city: property.city ?? '' });
                        return;
                    }

                    if (result.status === "paywall") {
                        const oneDayPrice = result.paywall?.oneDay?.price || paymentAmount;
                        openPaymentFlow(oneDayPrice, 'no_credits');
                        pushEvent(ANALYTICS_EVENTS.PROPERTY_UNLOCK_FAILED, {
                            property_id: property.id,
                            city: property.city ?? '',
                            bhk: property.bhk ?? '',
                            rent: property.pricePerMonth ?? 0,
                            failure_reason: 'no_credits',
                        });
                        return;
                    }

                    setPaymentError(result.message || "Unable to unlock owner contact.");
                    pushEvent(ANALYTICS_EVENTS.PROPERTY_UNLOCK_FAILED, {
                        property_id: property.id,
                        city: property.city ?? '',
                        failure_reason: 'api_error',
                    });
                } catch (error) {
                    setPaymentError(error instanceof Error ? error.message : "Unable to unlock owner contact.");
                } finally {
                    void refreshPassStatus();
                    setUnlockBusy(false);
                }
            },
        });
    };

    const handleActivatePass = async () => {
        if (property === null || paymentBusy || unlockBusy) return;
        await requireAuthThenContinue({
            router,
            intent: {
                type: "buy_pass",
                propertyId: property.id,
                passType: "one_day",
            },
            onAuthenticated: async () => {
                if (isUnlocked) return;

                // Check if user already has an active pass
                setUnlockBusy(true);
                try {
                    const activePass = await refreshPassStatus();
                    if (activePass) {
                        // Pass already active — show info, don't open payment
                        return;
                    }
                } catch {
                    // If check fails, proceed to payment anyway
                } finally {
                    setUnlockBusy(false);
                }

                openPaymentFlow(99, 'buy_pass_cta');
            },
        });
    };

    const handleOverlayPayNow = async () => {
        if (!paymentContext || !property) return;
        setPaymentBusy(true);
        setPaymentError(null);
        setPaymentFlowState("payment_initiated");

        const eventId = generateEventId();
        passEventIdRef.current = eventId;

        pushEvent(ANALYTICS_EVENTS.PASS_PURCHASE_STARTED, {
            pass_price: paymentContext.amount,
            currency: 'INR',
            source: 'property_detail',
            property_id: property.id,
        }, eventId);

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
            const passState = await checkoutAdapter.activatePass(baseState.id);
            setCheckoutState(passState);

            if (passState.status === "failed" || !passState.payment?.razorpayOrderId) {
                setPaymentFlowState("payment_failed");
                setPaymentError(passState.message || "Failed to initiate payment.");
                return;
            }

            // Step 3: Open Razorpay checkout
            const outcome = await runRazorpayCheckout(passState.payment);

            if (outcome.status !== "success" || !outcome.paymentId || !outcome.signature) {
                setPaymentFlowState("payment_failed");
                const timeOnPaywall = paywallOpenedAtRef.current
                    ? Math.round((Date.now() - paywallOpenedAtRef.current) / 1000)
                    : 0;
                pushEvent(ANALYTICS_EVENTS.PASS_PURCHASE_CANCELLED, {
                    pass_price: paymentContext.amount,
                    currency: 'INR',
                    property_id: property.id,
                    property_city: property.city ?? '',
                    property_bhk: property.bhk ?? '',
                }, passEventIdRef.current);
                pushEvent(ANALYTICS_EVENTS.PASS_PAYWALL_DISMISSED, {
                    property_id: property.id,
                    city: property.city ?? '',
                    bhk: property.bhk ?? '',
                    time_spent_seconds: timeOnPaywall,
                    reached_razorpay: true,
                });
                return;
            }

            // Step 4: Verify payment server-side + unlock contact atomically.
            // Backend verifies Razorpay signature — no webhook, no race condition.
            const session = authAdapter.getSession();
            const unlocked = await checkoutAdapter.verifyAndUnlock({
                razorpayPaymentId: outcome.paymentId,
                razorpayOrderId: outcome.orderId ?? passState.payment.razorpayOrderId,
                razorpaySignature: outcome.signature,
                propertyId: property.id,
                name: session.userName ?? undefined,
                phone: session.phone ?? undefined,
            });

            setCheckoutState(unlocked);

            if (unlocked.status === "success") {
                setIsUnlocked(true);
                setPaymentFlowState("payment_success");
                await refreshPassStatus();
                pushEvent(ANALYTICS_EVENTS.PASS_PURCHASE_COMPLETED, {
                    pass_price: paymentContext.amount,
                    currency: 'INR',
                    razorpay_payment_id: outcome.paymentId,
                }, passEventIdRef.current);
                mpPurchase({
                    property_id: property.id,
                    amount: paymentContext.amount,
                    pass_type: paymentContext.passType,
                    event_id: passEventIdRef.current,
                });
                mpLead({ property_id: property.id, city: property.city ?? '' });
            } else {
                setPaymentFlowState("payment_failed");
                setPaymentError(unlocked.message || "Payment received. Contact will unlock shortly — please refresh.");
            }
        } catch (err) {
            setPaymentFlowState("payment_failed");
            setPaymentError(err instanceof Error ? err.message : "Unable to process payment.");
            pushEvent(ANALYTICS_EVENTS.PASS_PURCHASE_FAILED, {
                pass_price: paymentContext?.amount ?? 99,
                currency: 'INR',
                failure_reason: err instanceof Error ? err.message : 'unknown',
            }, passEventIdRef.current);
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
        void refreshPassStatus();
    }, [property?.id, isUnlocked, refreshPassStatus]);

    useEffect(() => {
        if (checkoutState?.status === "success") {
            setIsUnlocked(true);
        }
    }, [checkoutState?.status]);

    const closePaywallToDropoff = () => {
        setPaymentFlowState("dropoff_prompt");
    };

    const dismissDropoff = () => {
        const timeOnPaywall = paywallOpenedAtRef.current
            ? Math.round((Date.now() - paywallOpenedAtRef.current) / 1000)
            : 0;
        pushEvent(ANALYTICS_EVENTS.PASS_PAYWALL_DISMISSED, {
            property_id: property?.id ?? slug,
            city: property?.city ?? '',
            bhk: property?.bhk ?? '',
            time_spent_seconds: timeOnPaywall,
            reached_razorpay: false,
        });
        paywallOpenedAtRef.current = null;
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
    const galleryMedia: PropertyMediaItem[] =
        property.galleryMedia && property.galleryMedia.length > 0
            ? property.galleryMedia
            : (property.galleryImages && property.galleryImages.length > 0
                  ? property.galleryImages
                  : property.image
                    ? [property.image]
                    : []
              ).map((url) => ({
                  url,
                  mediaType: isVideoMediaUrl(url) ? "video" : "image",
              }));
    const activeMedia = galleryMedia[Math.min(activeImageIndex, galleryMedia.length - 1)] || galleryMedia[0];

    /** Map + directions: same gate as owner contact — listing unlocked or any active day/weekly pass */
    const hasMapAccess = isUnlocked || Boolean(activePassInfo);

    const mapEmbedSrc = (() => {
        const latRaw = property.latitude?.trim();
        const lngRaw = property.longitude?.trim();
        if (latRaw && lngRaw) {
            const la = parseFloat(latRaw);
            const lo = parseFloat(lngRaw);
            if (
                Number.isFinite(la) &&
                Number.isFinite(lo) &&
                la >= -90 &&
                la <= 90 &&
                lo >= -180 &&
                lo <= 180
            ) {
                return `https://maps.google.com/maps?q=${encodeURIComponent(latRaw)},${encodeURIComponent(lngRaw)}&z=16&output=embed`;
            }
        }
        if (property.mapUrl) {
            const extracted = extractLatLngFromGoogleMapsUrl(property.mapUrl);
            if (extracted) {
                return `https://maps.google.com/maps?q=${encodeURIComponent(extracted.lat)},${encodeURIComponent(extracted.lng)}&z=16&output=embed`;
            }
        }
        return null;
    })();

    const propertyDetailRows: { label: string; value: string }[] = [];
    const pushDetail = (label: string, value: string | undefined | null) => {
        const v = typeof value === "string" ? value.trim() : "";
        if (v) propertyDetailRows.push({ label, value: v });
    };

    const locationLine = [property.locality, property.city].filter(Boolean).join(", ");
    pushDetail("Location", locationLine);

    const addr = property.addressLine?.trim();
    if (addr) {
        pushDetail("Address", addr);
    }

    if (property.propertyTypeLabel) {
        pushDetail("Property type", property.propertyTypeLabel);
    }

    const bhkDisplay = property.bhkLabel?.trim() || formatBhkFallback(property.bhk);
    if (bhkDisplay) {
        pushDetail("BHK", bhkDisplay);
    }

    if (property.builtUpAreaSqft != null && property.builtUpAreaSqft > 0) {
        pushDetail("Built-up area", `${property.builtUpAreaSqft.toLocaleString("en-IN")} sq ft`);
    }

    if (property.furnishingLabel) {
        pushDetail("Furnishing", property.furnishingLabel);
    }

    if (property.availabilityLabel) {
        pushDetail("Availability", property.availabilityLabel);
    }

    const availableFromLabel = formatListingDate(property.availableFrom);
    if (availableFromLabel) {
        pushDetail("Available from", availableFromLabel);
    }

    return (
        <main className="min-h-screen bg-[#040405] pb-28 text-white md:pb-10">
            {/* Hero image with gradient overlay */}
            <div className="relative h-56 w-full overflow-hidden sm:h-72 md:h-[420px]">
                {activeMedia ? (
                    <PropertyMediaPreview
                        item={activeMedia}
                        alt={property.title}
                        className="h-full w-full object-cover transition-all duration-500"
                        controls={activeMedia.mediaType === "video"}
                        autoPlay={activeMedia.mediaType === "video"}
                        muted
                        loop
                    />
                ) : null}
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                        <h1 className="line-clamp-2 flex-1 text-xl font-bold leading-snug text-white drop-shadow-lg sm:text-2xl md:text-3xl lg:text-[2rem]">
                            {property.title}
                        </h1>
                        {property.isVerified === true ? (
                            <span className="shrink-0 self-start rounded border border-[#B7F041]/35 bg-[#B7F041]/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#DFF8A2] sm:self-auto">
                                Verified
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-2 truncate text-sm text-white/65 md:text-base">{locationLine || property.city || property.locality}</p>
                </div>
            </div>

            {/* Thumbnail strip */}
            {galleryMedia.length > 1 && (
                <div className="scrollbar-hide mx-auto mt-2 flex max-w-[1180px] gap-2 overflow-x-auto px-4 md:px-6 lg:px-8">
                    {galleryMedia.map((media, index) => (
                        <button
                            key={`${media.url}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border transition-all duration-200 md:h-16 md:w-24 ${
                                activeImageIndex === index
                                    ? "border-[#B7F041] shadow-[0_0_10px_rgba(183,240,65,0.3)] scale-105"
                                    : "border-white/15 opacity-70 hover:opacity-100"
                            }`}
                        >
                            {media.mediaType === "video" ? (
                                <video src={media.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                            ) : (
                                <img src={media.url} alt={`${property.title}-${index + 1}`} className="h-full w-full object-cover" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Main content grid */}
            <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-4 px-4 py-5 md:grid-cols-[1fr_360px] md:gap-6 md:px-6 md:py-6 lg:grid-cols-[1fr_380px] lg:px-8">
                {/* Left — property details */}
                <section className="animate-fade-up space-y-3 md:space-y-4">
                    <div className="rounded-xl border border-white/10 bg-[#101015] px-4 py-4 md:px-6 md:py-5">
                        <p className="text-2xl font-semibold tabular-nums text-[#B7F041] md:text-3xl">
                            ₹{property.pricePerMonth.toLocaleString("en-IN")}
                            <span className="text-base font-medium text-[#B7F041]/65 md:text-lg"> / mo</span>
                        </p>
                        <p className="mt-2 text-sm text-white/55 md:text-base">
                            Deposit ₹{property.deposit.toLocaleString("en-IN")}
                            <span className="mx-2 text-white/20">|</span>
                            {property.furnished ? "Furnished" : "Unfurnished"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#111116] px-4 py-4 md:px-6 md:py-5">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50 md:text-sm">Particulars</h2>
                        <dl className="mt-4 space-y-0">
                            {propertyDetailRows.map((row, idx) => (
                                <div
                                    key={`${row.label}-${idx}`}
                                    className="grid grid-cols-1 gap-1 border-t border-white/[0.06] py-3.5 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(8.5rem,12rem)_minmax(0,1fr)] sm:items-start sm:gap-x-6 sm:py-3.5"
                                >
                                    <dt className="text-sm font-medium text-white/50 md:text-[15px] sm:pt-0.5">{row.label}</dt>
                                    <dd className="text-base leading-relaxed text-white/[0.9] md:text-[17px]">{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111116] px-4 py-4 md:px-6 md:py-5">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50 md:text-sm">Map</h2>
                        <div className="relative mt-3 h-40 w-full overflow-hidden rounded-lg border border-white/[0.06] bg-[linear-gradient(120deg,#1a1a22,#0f0f12)] md:h-44">
                            {hasMapAccess && mapEmbedSrc ? (
                                <iframe
                                    title={`Map — ${property.title}`}
                                    src={mapEmbedSrc}
                                    className="absolute inset-0 h-full w-full border-0"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    allowFullScreen
                                />
                            ) : hasMapAccess ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                                    <p className="text-sm text-white/65 md:text-base">No map coordinates on file.</p>
                                    {property.mapUrl ? (
                                        <a
                                            href={property.mapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-semibold text-[#B7F041] underline-offset-2 hover:underline md:text-base"
                                        >
                                            Open in Google Maps ↗
                                        </a>
                                    ) : null}
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(175,122,235,0.28),transparent_50%)]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(183,240,65,0.06),transparent_40%)]" />
                                    <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/80 px-3 py-2.5 text-center backdrop-blur-sm">
                                        <p className="text-sm font-medium text-white md:text-base">{property.mapPreviewLabel}</p>
                                        <p className="mt-1.5 text-xs leading-snug text-[#B7F041]/90 md:text-sm">{property.mapPreviewSubLabel}</p>
                                    </div>
                                </>
                            )}
                        </div>
                        {property.mapUrl && hasMapAccess ? (
                            <div className="mt-3 border-t border-white/[0.06] pt-3">
                                <a
                                    href={property.mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-[#B7F041] underline-offset-2 hover:underline md:text-base"
                                >
                                    Google Maps ↗
                                </a>
                            </div>
                        ) : null}
                    </div>

                    {property.description?.trim() ? (
                        <div className="rounded-xl border border-white/10 bg-[#111116] px-4 py-4 md:px-6 md:py-5">
                            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50 md:text-sm">Description</h2>
                            <p className="mt-3 whitespace-pre-wrap break-words text-base leading-[1.7] text-white/70 md:mt-4 md:text-lg">
                                {property.description}
                            </p>
                        </div>
                    ) : null}

                    {property.amenities.length > 0 && (
                        <div className="rounded-xl border border-white/10 bg-[#111116] px-4 py-4 md:px-6 md:py-5">
                            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50 md:text-sm">Amenities</h2>
                            <ul className="mt-3 columns-1 gap-x-8 sm:columns-2 md:mt-4">
                                {property.amenities.map((amenity) => (
                                    <li
                                        key={amenity}
                                        className="break-inside-avoid py-1.5 text-base text-white/75 md:text-[17px] [content-visibility:auto]"
                                    >
                                        {amenity}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {property.highlights.length > 0 && (
                        <div className="rounded-xl border border-white/10 bg-[#111116] px-4 py-4 md:px-6 md:py-5">
                            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50 md:text-sm">Highlights</h2>
                            <ul className="mt-3 space-y-2 md:mt-4">
                                {property.highlights.map((highlight) => (
                                    <li key={highlight} className="text-base text-white/75 md:text-[17px]">
                                        {highlight}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                {/* Right — owner & unlock */}
                <aside className="animate-slide-r space-y-3 md:sticky md:top-4 md:h-fit" style={{ animationDelay: "0.1s" }}>
                    <OwnerCard
                        owner={effectiveOwner}
                        isUnlocked={isUnlocked}
                        onUnlock={isUnlocked ? undefined : handlePayNow}
                        propertyId={property.id}
                        propertyCity={property.city ?? ''}
                        propertyBhk={property.bhk ?? ''}
                    />

                    <UnlockCard
                        offer={property.unlockOffer}
                        checkoutState={checkoutState}
                        onActivatePass={() => void handleActivatePass()}
                        activePassInfo={activePassInfo}
                    />
                </aside>
            </div>

            {/* Mobile bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0c0c12]/90 p-4 backdrop-blur-md md:hidden">
                {isUnlocked ? null : activePassInfo ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#B7F041]/25 bg-[#111116] px-4 py-3">
                        <span className="text-xl">✅</span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[#B7F041]">Pass active</p>
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
                    <button
                        onClick={() => void handleActivatePass()}
                        disabled={paymentBusy || unlockBusy}
                        className="btn-shimmer w-full rounded-xl border border-[#B7F041]/35 bg-[#0d0d14] px-4 py-3 text-sm font-bold text-[#DFF8A2] disabled:opacity-50"
                    >
                        {paymentBusy ? (
                            <span className="flex items-center justify-center gap-1.5">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#DFF8A2] border-t-transparent" />
                                ...
                            </span>
                        ) : (
                            "⚡ ₹99 Day Pass"
                        )}
                    </button>
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
