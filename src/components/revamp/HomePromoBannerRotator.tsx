"use client";

import React from "react";

interface HomePromoBannerRotatorProps {
    onBannerClick?: () => void;
}

export default function HomePromoBannerRotator({ onBannerClick }: HomePromoBannerRotatorProps) {
    return (
        <div className="relative w-full rounded-[28px] border border-[#A67AEB]/40 bg-[#A67AEB] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-white/25 hover:shadow-[0_16px_48px_rgba(166,122,235,0.35)] sm:rounded-[32px]">
            <div className="overflow-hidden rounded-[28px] sm:rounded-[32px]">
                <button
                    type="button"
                    onClick={() => onBannerClick?.()}
                    className="group flex w-full min-h-[70px] flex-col items-center justify-center gap-0.5 px-5 py-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#A67AEB] sm:min-h-[82px] md:min-h-[88px] lg:min-h-[92px] sm:py-4"
                    aria-label="Open SPOTO day pass paywall — ₹99"
                >
                    <span className="text-[11px] font-medium tracking-wide text-white/95 sm:text-xs">
                        Zero Brokerage · Verified Home Owners
                    </span>
                    <span className="text-base font-bold leading-tight tracking-tight text-[#14141a] sm:text-lg md:text-xl">
                        Unlimited Day Pass ₹99
                    </span>
                </button>
            </div>
        </div>
    );
}
