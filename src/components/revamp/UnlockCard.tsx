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
        <section className="overflow-hidden rounded-2xl border border-white/20 bg-[#111116]">
            {/* Header */}
            <div className="bg-[#2A2A2A] px-4 py-3 text-base font-bold text-[#B7F041]">
                {offer.headline}
            </div>

            {/* Body */}
            <div className="space-y-2 px-4 py-4">
                <p className="text-xl font-semibold leading-snug text-white/90">
                    In Top Bengaluru Localities 📍
                </p>
                <p className="text-base text-white/70">{offer.subHeadline}</p>
                <ul className="space-y-1 text-base text-white/80">
                    {offer.bullets.map((bullet) => (
                        <li key={bullet}>• {bullet}</li>
                    ))}
                </ul>
            </div>

            {/* CTA strip */}
            <div className="bg-[#B7F041] px-4 py-3 text-center text-base font-bold text-[#161616]">
                {offer.ctaLabel}
            </div>

            {/* Checkout state message */}
            {visibleCheckoutState && (
                <div
                    className={`mx-4 mt-3 rounded-xl px-3 py-2.5 text-center text-sm font-semibold md:mx-5 ${
                        visibleCheckoutState.status === "success"
                            ? "bg-green-500/20 text-green-300"
                            : visibleCheckoutState.status === "failed"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-[#A67AEB]/20 text-[#D6C0FF]"
                    }`}
                >
                    {visibleCheckoutState.message}
                </div>
            )}

            {/* Buttons */}
            <div className="grid gap-2 px-4 pb-4 pt-3 md:px-5">
                {activePassInfo && (
                    <div className="mb-1 flex items-start gap-2 rounded-xl border border-[#B7F041]/30 bg-[#0d0d14] px-3 py-2.5">
                        <span className="mt-0.5 text-base">
                            {activePassInfo.type === "weekly" ? "⭐" : "✅"}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-[#B7F041]">
                                {activePassInfo.type === "weekly" ? "7-Day Unlimited Pass" : "1-Day Unlimited Pass"} — Active
                            </p>
                            {activePassInfo.expiresAt && (
                                <p className="mt-0.5 text-xs text-white/50">
                                    Expires:{" "}
                                    {new Date(activePassInfo.expiresAt).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => onActivatePass?.("one_day")}
                    className="rounded-xl border border-[#B7F041]/40 bg-[#0d0d14] px-4 py-3 text-sm font-semibold text-[#DFF8A2] transition-colors hover:bg-[#B7F041]/5 active:scale-[0.98] md:text-base"
                >
                    Get 99 Unlimited Pass
                </button>
                <button
                    type="button"
                    onClick={() => onActivatePass?.("weekly")}
                    className="rounded-xl border border-[#A67AEB]/40 bg-[#0d0d14] px-4 py-3 text-sm font-semibold text-[#E9DCFF] transition-colors hover:bg-[#A67AEB]/5 active:scale-[0.98] md:text-base"
                >
                    Get 249 Unlimited Pass
                </button>
            </div>
        </section>
    );
}
