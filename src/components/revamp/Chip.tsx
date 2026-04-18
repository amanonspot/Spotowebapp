"use client";

import React from "react";

interface ChipProps {
    label: string;
    selected?: boolean;
    onClick?: () => void;
    className?: string;
}

export default function Chip({ label, selected = false, onClick, className = "" }: ChipProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7AEB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f] ${
                selected
                    ? "border-[#B7F041] bg-[#B7F041] text-[#101010]"
                    : "border-white/25 bg-[#151515] text-white hover:border-[#AF7AEB]/70 hover:bg-[#1a1a1f]"
            } ${className}`}
        >
            {label}
        </button>
    );
}
