"use client";

import React from "react";
import { CheckoutState, UnlockOffer } from "@/lib/adapters/types";
import PrimaryButton from "@/components/revamp/PrimaryButton";

interface UnlockCardProps {
    offer: UnlockOffer;
    checkoutState: CheckoutState | null;
    onPayNow: () => void;
    onActivatePass?: (passType: "one_day" | "weekly") => void;
}

export default function UnlockCard({ offer, checkoutState, onPayNow, onActivatePass }: UnlockCardProps) {
    const paywall = checkoutState?.status === "paywall" ? checkoutState.paywall : undefined;
    return (
        <section className="overflow-hidden rounded-2xl border border-white/20 bg-[#111116]">
            <div className="bg-[#2A2A2A] px-4 py-3 text-2xl font-bold text-[#B7F041]">{offer.headline}</div>
            <div className="space-y-3 px-5 py-4">
                <p className="text-5xl font-semibold text-white/90">In Top Bengaluru Localities📍</p>
                <p className="text-3xl text-white/75">{offer.subHeadline}</p>
                <ul className="space-y-2 text-3xl text-white/85">
                    {offer.bullets.map((bullet) => (
                        <li key={bullet}>• {bullet}</li>
                    ))}
                </ul>
            </div>
            <div className="bg-[#B7F041] px-5 py-4 text-center text-3xl font-bold text-[#161616]">{offer.ctaLabel}</div>

            {checkoutState && (
                <div
                    className={`mx-5 mt-4 rounded-xl px-4 py-3 text-center text-sm font-semibold ${
                        checkoutState.status === "success"
                            ? "bg-green-500/20 text-green-300"
                            : checkoutState.status === "failed"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-[#A67AEB]/20 text-[#D6C0FF]"
                    }`}
                >
                    {checkoutState.message}
                </div>
            )}

            {paywall ? (
                <div className="grid gap-2 px-5 pt-3">
                    <button
                        type="button"
                        onClick={() => onActivatePass?.("one_day")}
                        className="rounded-xl border border-[#B7F041]/40 bg-[#0d0d14] px-4 py-2 text-sm font-semibold text-[#DFF8A2]"
                    >
                        Get One-Day Pass · ₹{paywall.oneDay.price}
                    </button>
                    <button
                        type="button"
                        onClick={() => onActivatePass?.("weekly")}
                        className="rounded-xl border border-[#A67AEB]/40 bg-[#0d0d14] px-4 py-2 text-sm font-semibold text-[#E9DCFF]"
                    >
                        Get Weekly Pass · ₹{paywall.weekly.price}
                    </button>
                </div>
            ) : null}

            <div className="p-5">
                <PrimaryButton onClick={onPayNow} className="w-full text-lg">
                    Get 99 Unlimited Pass
                </PrimaryButton>
            </div>
        </section>
    );
}
