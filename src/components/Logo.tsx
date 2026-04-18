"use client";
import React from "react";
import Image from "next/image";
import lightLogo from "../../public/logos/light.png";
import darkLogo from "../../public/logos/dark.png";

interface LogoProps {
    className?: string;
    variant?: "light" | "dark"; // light = white logo for dark bg, dark = dark logo for white bg
}

export default function Logo({ className = "", variant = "light" }: LogoProps) {
    const logoSrc = variant === "light" ? lightLogo : darkLogo;
    
    // Extract width classes if provided in className, otherwise use defaults
    const hasCustomWidth = className.includes('w-[') || className.includes('!w-[');
    const defaultWidthClass = hasCustomWidth ? '' : 'w-[240px] md:w-[480px]';
    
    return (
        <div
            className={`flex items-center justify-center ${className}`}
            style={{
                filter: variant === "light" 
                    ? "drop-shadow(0 0 20px rgba(175, 122, 235, 0.3)) drop-shadow(0 0 40px rgba(175, 122, 235, 0.1))"
                    : "none",
            }}
        >
            <Image
                src={logoSrc}
                alt="SPOTO"
                width={500}
                height={100}
                className={`${defaultWidthClass} h-auto mobile-logo object-contain`}
                priority
            />
        </div>
    );
}
