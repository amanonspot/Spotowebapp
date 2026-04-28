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
            className={`flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E10] transition-all hover:border-[#AF7AEB]/50 ${
                compact ? "min-w-[240px] sm:min-w-[280px]" : "w-full"
            }`}
        >
            <button
                type="button"
                onClick={onClick}
                className="flex flex-1 flex-col w-full text-left transition active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7AEB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f]"
            >
                <div className={`relative w-full overflow-hidden ${compact ? "h-40 sm:h-48" : "h-48 sm:h-56"}`}>
                    <BlurImage
                        src={property.image}
                        alt={property.title}
                        wrapperClassName="h-full w-full"
                        className="h-full w-full"
                        loading="lazy"
                    />
                    <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-[#d8d8d8]">
                        {property.badges[0] || "Featured"}
                    </div>
                </div>

                <div className="flex flex-1 flex-col justify-between space-y-1.5 p-4">
                    <h3 className="line-clamp-2 text-lg font-bold text-white">{property.title}</h3>
                    <p className="text-sm text-[#AAAAAA]">{property.locality}</p>
                    <p className="text-lg font-bold text-[#B7F041]">
                        ₹{property.pricePerMonth.toLocaleString("en-IN")}
                        <span className="text-sm font-medium text-[#B7F041]/80"> / Month</span>
                    </p>
                    <p className="text-sm text-[#9A9A9A]">
                        ₹{property.deposit.toLocaleString("en-IN")} Deposit • {property.furnished ? "Furnished" : "Unfurnished"}
                    </p>
                </div>
            </button>
        </article>
    );
}
