"use client";

import React from "react";
import { PropertyListItem } from "@/lib/adapters/types";
import BlurImage from "@/components/revamp/BlurImage";

interface RevampPropertyCardProps {
    property: PropertyListItem;
    onClick?: () => void;
    compact?: boolean;
}

export default function RevampPropertyCard({ property, onClick, compact = false }: RevampPropertyCardProps) {
    return (
        <article
            className={`group card-hover flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E10] ${
                compact ? "min-w-[240px] sm:min-w-[280px]" : "w-full"
            }`}
        >
            <button
                type="button"
                onClick={onClick}
                className="flex flex-1 flex-col w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7AEB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f]"
            >
                {/* Image container with zoom + gradient overlay */}
                <div className={`relative w-full overflow-hidden ${compact ? "h-40 sm:h-48" : "h-48 sm:h-56"}`}>
                    <BlurImage
                        src={property.image}
                        alt={property.title}
                        wrapperClassName="h-full w-full"
                        className="img-zoom h-full w-full"
                        loading="lazy"
                    />

                    {/* Dark gradient overlay at bottom */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Badge */}
                    <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                        {property.badges[0] || "Featured"}
                    </div>

                    {/* Price on image bottom (appears on hover) */}
                    <div className="absolute bottom-3 right-3 rounded-xl bg-black/70 px-2.5 py-1 text-sm font-bold text-[#B7F041] backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        ₹{property.pricePerMonth.toLocaleString("en-IN")}/mo
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-7 text-white transition-colors group-hover:text-[#E9DCFF]">
                        {property.title}
                    </h3>
                    <p className="mt-1 flex min-h-[1.25rem] items-center gap-1 text-sm text-[#AAAAAA]">
                        <span className="text-[10px]">📍</span>
                        {property.locality}
                    </p>
                    <div className="mt-auto space-y-1">
                        <p className="text-lg font-bold text-[#B7F041]">
                            ₹{property.pricePerMonth.toLocaleString("en-IN")}
                            <span className="text-sm font-medium text-[#B7F041]/70"> / Month</span>
                        </p>
                        <p className="line-clamp-1 min-h-[1.25rem] text-sm text-[#9A9A9A]">
                            ₹{property.deposit.toLocaleString("en-IN")} Deposit
                            <span className="mx-1.5 text-white/20">•</span>
                            {property.furnished ? "Furnished" : "Unfurnished"}
                        </p>
                    </div>
                </div>
            </button>
        </article>
    );
}
