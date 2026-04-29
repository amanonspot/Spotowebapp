"use client";

import React, { useEffect, useState } from "react";

const SLIDES = [
    {
        passType: "one_day" as const,
        eyebrow: "Zero Brokerage · Verified Home Owners",
        headline: "Unlimited Day Pass ₹99",
    },
    {
        passType: "weekly" as const,
        eyebrow: "Zero Brokerage · Verified Home Owners",
        headline: "7-Day Unlimited Pass ₹249",
    },
];

/** Fast enough to notice both passes; slow enough to read */
const ROTATION_MS = 6500;

interface HomePromoBannerRotatorProps {
    onBannerClick?: (passType: "one_day" | "weekly") => void;
}

export default function HomePromoBannerRotator({ onBannerClick }: HomePromoBannerRotatorProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % SLIDES.length);
        }, ROTATION_MS);
        return () => window.clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full rounded-[28px] border border-[#A67AEB]/40 bg-[#A67AEB] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-white/25 hover:shadow-[0_16px_48px_rgba(166,122,235,0.35)] sm:rounded-[32px]">
            <div className="overflow-hidden rounded-[28px] sm:rounded-[32px]">
                <div
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                    {SLIDES.map((slide) => (
                        <div key={slide.passType} className="relative w-full flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => onBannerClick?.(slide.passType)}
                                className="group flex w-full min-h-[70px] flex-col items-center justify-center gap-0.5 px-5 py-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#A67AEB] sm:min-h-[82px] md:min-h-[88px] lg:min-h-[92px] sm:py-4"
                                aria-label={
                                    slide.passType === "weekly"
                                        ? "Open SPOTO 7-day pass paywall"
                                        : "Open SPOTO 1-day pass paywall"
                                }
                            >
                                <span className="text-[11px] font-medium tracking-wide text-white/95 sm:text-xs">
                                    {slide.eyebrow}
                                </span>
                                <span className="text-base font-bold leading-tight tracking-tight text-[#14141a] sm:text-lg md:text-xl">
                                    {slide.headline}
                                </span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-center gap-1.5 pb-2 pt-0.5" aria-hidden>
                {SLIDES.map((_, i) => (
                    <span
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${
                            i === activeIndex ? "w-4 bg-white/90" : "w-1 bg-black/25"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
