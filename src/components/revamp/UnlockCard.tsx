"use client";

import React from "react";
import { CheckoutState, UnlockOffer } from "@/lib/adapters/types";

interface UnlockCardProps {
    offer: UnlockOffer;
    checkoutState: CheckoutState | null;
    onPayNow?: () => void;
    onActivatePass?: (passType: "one_day" | "weekly") => void;
    activePassInfo?: { type: "one_day" | "weekly"; expiresAt: string | null } | null;
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
                <p className="text-xl font-semibold leading-snug text-white/90">
                    In Top Bengaluru Localities 📍
                </p>
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

            {/* Buttons */}
            <div className="grid gap-2.5 px-4 pb-4 pt-3">

                {/* Active pass badge */}
                {activePassInfo && (
                    <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-[#B7F041]/25 bg-[#B7F041]/5 px-3 py-3 ring-1 ring-[#B7F041]/10">
                        <span className="mt-0.5 text-lg">
                            {activePassInfo.type === "weekly" ? "⭐" : "✅"}
                        </span>
                        <div>
                            <p className="text-sm font-bold text-[#B7F041]">
                                {activePassInfo.type === "weekly" ? "7-Day Unlimited Pass" : "1-Day Unlimited Pass"} — Active
                            </p>
                            {activePassInfo.expiresAt ? (
                                <p className="mt-0.5 text-xs text-white/45">
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
                                <p className="mt-0.5 text-xs text-white/45">Unlimited contacts while active</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 99 Pass button */}
                <button
                    type="button"
                    onClick={() => onActivatePass?.("one_day")}
                    className="btn-shimmer group relative rounded-xl border border-[#B7F041]/35 bg-[#0d0d14] px-4 py-3 text-center text-base font-semibold text-[#DFF8A2] hover:border-[#B7F041]/60 hover:bg-[#B7F041]/8 active:scale-[0.97]"
                >
                    <span className="flex items-center justify-center gap-2">
                        <span className="text-base">⚡</span>
                        Get ₹99 Day Pass
                        <span className="ml-auto rounded-full bg-[#B7F041]/15 px-2 py-0.5 text-xs text-[#B7F041]">24hrs</span>
                    </span>
                </button>

                {/* 249 Pass button */}
                <button
                    type="button"
                    onClick={() => onActivatePass?.("weekly")}
                    className="btn-shimmer group relative rounded-xl border border-[#A67AEB]/35 bg-[#0d0d14] px-4 py-3 text-center text-base font-semibold text-[#E9DCFF] hover:border-[#A67AEB]/60 hover:bg-[#A67AEB]/8 active:scale-[0.97]"
                >
                    <span className="flex items-center justify-center gap-2">
                        <span className="text-base">🌟</span>
                        Get ₹249 Weekly Pass
                        <span className="ml-auto rounded-full bg-[#A67AEB]/15 px-2 py-0.5 text-xs text-[#A67AEB]">7 days</span>
                    </span>
                </button>
            </div>
        </section>
    );
}
