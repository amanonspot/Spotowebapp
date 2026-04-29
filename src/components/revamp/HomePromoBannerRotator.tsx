"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

const BANNER_SOURCES = [
    {
        src: "/assets/banners/home-pass-banner-1.png",
        alt: "Directly connect with homeowners day pass banner",
    },
    {
        src: "/assets/banners/home-pass-banner-2.png",
        alt: "Zero brokerage verified homeowners day pass banner",
    },
];

const ROTATION_MS = 20_000;

interface HomePromoBannerRotatorProps {
    onBannerClick?: (passType: "one_day" | "weekly") => void;
}

export default function HomePromoBannerRotator({ onBannerClick }: HomePromoBannerRotatorProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [failedIndices, setFailedIndices] = useState<number[]>([]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % BANNER_SOURCES.length);
        }, ROTATION_MS);

        return () => window.clearInterval(interval);
    }, []);

    const safeIndex = useMemo(() => {
        if (!failedIndices.includes(activeIndex)) return activeIndex;
        const fallback = activeIndex === 0 ? 1 : 0;
        return failedIndices.includes(fallback) ? activeIndex : fallback;
    }, [activeIndex, failedIndices]);

    return (
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/10">
            <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
                {BANNER_SOURCES.map((banner, idx) => (
                    <div key={banner.src} className="relative w-full flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => onBannerClick?.("one_day")}
                            className="group relative block w-full overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F041]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]"
                            aria-label="Open SPOTO day pass paywall"
                        >
                            <div className="star-motion pointer-events-none absolute left-2 top-2 z-10 text-lg motion-safe:animate-[spotoStarFloat_2200ms_ease-in-out_infinite] sm:left-4 sm:top-4 sm:text-2xl">
                                ✨
                            </div>
                            <div className="arrow-motion pointer-events-none absolute right-2 top-2 z-10 text-lg text-white/85 motion-safe:animate-[spotoArrowDrift_1800ms_ease-in-out_infinite] sm:right-4 sm:top-4 sm:text-2xl">
                                ↗
                            </div>
                            <div className="relative w-full">
                                <Image
                                    src={failedIndices.includes(idx) ? BANNER_SOURCES[safeIndex].src : banner.src}
                                    alt={banner.alt}
                                    width={1380}
                                    height={372}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 860px"
                                    className="h-auto w-full object-contain transition-transform duration-500 group-active:scale-[0.995]"
                                    priority={idx === 0}
                                    onError={() =>
                                        setFailedIndices((prev) => (prev.includes(idx) ? prev : [...prev, idx]))
                                    }
                                />
                            </div>
                        </button>
                    </div>
                ))}
            </div>
            <style jsx>{`
                @keyframes spotoStarFloat {
                    0% {
                        transform: translate3d(0, 0, 0) scale(1);
                        opacity: 0.9;
                    }
                    50% {
                        transform: translate3d(0, -3px, 0) scale(1.07);
                        opacity: 1;
                    }
                    100% {
                        transform: translate3d(0, 0, 0) scale(1);
                        opacity: 0.9;
                    }
                }
                @keyframes spotoArrowDrift {
                    0% {
                        transform: translate3d(0, 0, 0) rotate(0deg);
                        opacity: 0.85;
                    }
                    50% {
                        transform: translate3d(1px, -3px, 0) rotate(4deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translate3d(0, 0, 0) rotate(0deg);
                        opacity: 0.85;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .star-motion,
                    .arrow-motion {
                        animation: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
