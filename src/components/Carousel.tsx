"use client";
import React, { useState, useEffect } from "react";

interface CarouselProps {
    children: React.ReactNode[];
    className?: string;
    autoPlay?: boolean;
    autoPlayInterval?: number;
    showDots?: boolean;
    showArrows?: boolean;
}

export default function Carousel({
    children,
    className = "",
    autoPlay = true,
    autoPlayInterval = 5000,
    showDots = true,
    showArrows = true,
}: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const nextSlide = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev + 1) % children.length);
        setTimeout(() => setIsTransitioning(false), 300);
    };

    const prevSlide = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(
            (prev) => (prev - 1 + children.length) % children.length
        );
        setTimeout(() => setIsTransitioning(false), 300);
    };

    const goToSlide = (index: number) => {
        if (isTransitioning || index === currentIndex) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 300);
    };

    useEffect(() => {
        if (!autoPlay) return;

        const interval = setInterval(nextSlide, autoPlayInterval);
        return () => clearInterval(interval);
    }, [autoPlay, autoPlayInterval, isTransitioning]);

    return (
        <div className={`relative w-full ${className}`}>
            {/* Carousel container */}
            <div className="relative overflow-hidden rounded-xl">
                <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`,
                    }}
                >
                    {children.map((child, index) => (
                        <div key={index} className="w-full flex-shrink-0">
                            {child}
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation arrows */}
            {showArrows && children.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        disabled={isTransitioning}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors disabled:opacity-50 carousel-arrows hidden sm:block"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        disabled={isTransitioning}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors disabled:opacity-50 carousel-arrows hidden sm:block"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                </>
            )}

            {/* Dots indicator */}
            {showDots && children.length > 1 && (
                <div className="flex justify-center mt-4 gap-2 carousel-dots">
                    {children.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentIndex
                                    ? "bg-[#AF7AEB]"
                                    : "bg-[#404040] hover:bg-[#606060]"
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
