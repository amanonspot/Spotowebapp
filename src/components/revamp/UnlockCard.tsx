"use client";

import React from "react";
import { CheckoutState, UnlockOffer } from "@/lib/adapters/types";

interface UnlockCardProps {
    offer: UnlockOffer;
    checkoutState: CheckoutState | null;
    /** Opens ₹99 day pass payment flow */
    onActivatePass?: () => void;
    activePassInfo?: { expiresAt: string | null } | null;
}

function ActivePassActivatedBanner({
    activePassInfo,
}: {
    activePassInfo: NonNullable<UnlockCardProps["activePassInfo"]>;
}) {
    return (
        <div className="animate-fade-up animate-pass-glow-cyan overflow-hidden rounded-xl bg-[#0a1214]">
            <div className="relative overflow-hidden bg-cyan-950/25 px-4 py-2.5 text-center">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(105deg, transparent 28%, rgba(34,211,238,0.18) 46%, rgba(20,184,166,0.12) 54%, transparent 72%)",
                        backgroundSize: "200% 100%",
                        animation: "spoto-shimmer 3.2s ease-in-out infinite",
                    }}
                />
                <p className="relative text-base font-semibold tracking-tight text-[#a5f3fc]">Pass is activated</p>
            </div>
            <div className="relative px-4 py-4">
                <span className="absolute right-3 top-2.5 animate-pass-pin-cyan select-none text-xl" aria-hidden="true">
                    📍
                </span>
                <p className="pr-10 text-sm leading-relaxed text-white/70">Your access pass is active.</p>
                <p className="mt-1.5 pr-10 text-sm font-semibold leading-snug text-white/92">
                    Direct owner contact + exact map location unlocked
                </p>
                {activePassInfo.expiresAt ? (
                    <p className="mt-2.5 text-xs text-white/45">
                        Expires:{" "}
                        {new Date(activePassInfo.expiresAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                ) : (
                    <p className="mt-2.5 text-xs text-white/45">Enjoy unlimited contacts while your pass is active</p>
                )}
            </div>
        </div>
    );
}

export default function UnlockCard({ offer, checkoutState, onActivatePass, activePassInfo }: UnlockCardProps) {
    const visibleCheckoutState = checkoutState;
    return (
        <section className="overflow-hidden rounded-2xl border border-white/15 bg-[#111116] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {/* Animated shimmer header */}
            <div className="relative overflow-hidden bg-[#2A2A2A] px-4 py-3">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: "linear-gradient(105deg, transparent 30%, rgba(183,240,65,0.12) 50%, transparent 70%)",
                        backgroundSize: "200% 100%",
                        animation: "spoto-shimmer 3.5s ease-in-out infinite",
                    }}
                />
                <p className="relative text-base font-bold text-[#B7F041]">{offer.headline}</p>
            </div>

            {/* Body */}
            <div className="space-y-2 px-4 py-4">
                <p className="text-xl font-semibold leading-snug text-white/90">In Top Bengaluru Localities 📍</p>
                <p className="text-base text-white/65">{offer.subHeadline}</p>
                <ul className="space-y-1.5">
                    {offer.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-center gap-2 text-base text-white/75">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B7F041]/70" />
                            {bullet}
                        </li>
                    ))}
                </ul>
            </div>

            {/* CTA strip */}
            <div className="relative overflow-hidden bg-[#B7F041] px-4 py-3 text-center">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
                        backgroundSize: "200% 100%",
                        animation: "spoto-shimmer 4s ease-in-out infinite 1s",
                    }}
                />
                <p className="relative text-base font-bold text-[#161616]">{offer.ctaLabel}</p>
            </div>

            {/* Checkout status message */}
            {visibleCheckoutState && (
                <div
                    className={`animate-fade-in mx-4 mt-3 rounded-xl px-3 py-2.5 text-center text-sm font-semibold ${
                        visibleCheckoutState.status === "success"
                            ? "bg-green-500/15 text-green-300 ring-1 ring-green-500/20"
                            : visibleCheckoutState.status === "failed"
                              ? "bg-red-500/15 text-red-300 ring-1 ring-red-500/20"
                              : "bg-[#A67AEB]/15 text-[#D6C0FF] ring-1 ring-[#A67AEB]/20"
                    }`}
                >
                    {visibleCheckoutState.message}
                </div>
            )}

            {/* Button / Active state */}
            <div className="grid gap-2.5 px-4 pb-4 pt-3">
                {activePassInfo ? (
                    <ActivePassActivatedBanner activePassInfo={activePassInfo} />
                ) : (
                    <button
                        type="button"
                        onClick={() => onActivatePass?.()}
                        className="btn-shimmer group relative rounded-xl border border-[#B7F041]/35 bg-[#0d0d14] px-4 py-3 text-center text-base font-semibold text-[#DFF8A2] hover:border-[#B7F041]/60 hover:bg-[#B7F041]/8 active:scale-[0.97]"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span className="text-base">⚡</span>
                            Get ₹99 Day Pass
                            <span className="ml-auto rounded-full bg-[#B7F041]/15 px-2 py-0.5 text-xs text-[#B7F041]">24hrs</span>
                        </span>
                    </button>
                )}
            </div>
        </section>
    );
}
