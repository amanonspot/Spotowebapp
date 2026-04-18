"use client";

import React from "react";

interface PrimaryButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: "purple" | "green" | "ghost";
    className?: string;
    type?: "button" | "submit" | "reset";
}

export default function PrimaryButton({
    children,
    onClick,
    disabled = false,
    variant = "purple",
    className = "",
    type = "button",
}: PrimaryButtonProps) {
    const variantClasses =
        variant === "green"
            ? "bg-[#B7F041] text-[#141414]"
            : variant === "ghost"
            ? "bg-transparent border border-[#AF7AEB] text-white"
            : "bg-[#A67AEB] text-white";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`rounded-xl px-6 py-3 text-base font-semibold transition-all duration-150 hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AF7AEB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f] disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses} ${className}`}
        >
            {children}
        </button>
    );
}
