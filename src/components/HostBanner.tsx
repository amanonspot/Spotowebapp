"use client";
import React from "react";

interface HostBannerProps {
    onClick?: () => void;
    className?: string;
}

export default function HostBanner({
    onClick,
    className = "",
}: HostBannerProps) {
    return (
        <div className={`w-full max-w-6xl mx-auto px-4 ${className}`}>
            <div
                className="bg-[#9D7BD8] rounded-3xl p-6 md:p-8 cursor-pointer hover:scale-[1.01] transition-all duration-300 group mobile-host-banner relative overflow-hidden shadow-lg shadow-[#9D7BD8]/20"
                onClick={onClick}
            >
                <div className="relative z-10 flex items-center justify-between">
                    <h3 className="text-[#5A4A6A] text-xl md:text-3xl lg:text-4xl font-semibold font-opensans">
                        Host your Property on{" "}
                        <span className="font-black text-[#2D2438]">SPOTO</span>{" "}
                        ✨
                    </h3>
                    <div className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 flex-shrink-0 ml-4">
                        <svg
                            className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7 17L17 7M17 7H7M17 7v10"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
