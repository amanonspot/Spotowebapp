"use client";
import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import lightLogo from "../../public/logos/light.png";
import darkLogo from "../../public/logos/dark.png";

interface LogoProps {
    className?: string;
    /** light = wordmark for dark backgrounds; dark = for light headers */
    variant?: "light" | "dark";
}

export default function Logo({ className = "", variant = "light" }: LogoProps) {
    const logoSrc = variant === "light" ? lightLogo : darkLogo;

    const hasCustomWidth = className.includes("w-[") || className.includes("!w-[");
    const defaultWidthClass = hasCustomWidth ? "" : "w-[240px] md:w-[480px]";

    const glowClass = variant === "light" ? "spoto-logo-glow" : "spoto-logo-glow-dark";

    return (
        <div className={cn("flex items-center justify-center", glowClass, className)}>
            <Image
                src={logoSrc}
                alt="SPOTO"
                width={500}
                height={100}
                className={cn(defaultWidthClass, "h-auto mobile-logo object-contain")}
                priority
            />
        </div>
    );
}
