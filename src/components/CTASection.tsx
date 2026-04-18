"use client";
import React from "react";

interface CTASectionProps {
    onClick?: () => void;
    className?: string;
}

export default function CTASection({
    onClick,
    className = "",
}: CTASectionProps) {
    return (
        <div className={`relative w-full ${className}`}>
            {/* Background Image - Full Width */}
            <div className="relative h-[500px] md:h-[600px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10" />
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
                    }}
                />

                {/* Content */}
                <div className="relative z-20 h-full flex items-center">
                    <div className="w-full max-w-6xl mx-auto px-4">
                        <div className="flex items-center justify-start">
                            <div className="text-left max-w-md">
                                <h2 className="text-white text-5xl md:text-6xl font-bold mb-6 leading-tight">
                                    Questions<br />
                                    about<br />
                                    <span className="text-white">hosting?</span>
                                </h2>
                                <button
                                    onClick={onClick}
                                    className="bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                                >
                                    Ask our Team
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
