"use client";
import React, { useState, useEffect, useRef } from "react";

interface CategoryTabsProps {
    categories: string[];
    selectedCategory?: string | null;
    onCategorySelect?: (category: string) => void;
    className?: string;
    titleRef?: React.RefObject<HTMLDivElement | null>;
}

export default function CategoryTabs({
    categories,
    selectedCategory,
    onCategorySelect,
    className = "",
    titleRef,
}: CategoryTabsProps) {
    const [isSticky, setIsSticky] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Scroll detection for sticky header
    useEffect(() => {
        const handleScroll = () => {
            if (titleRef?.current) {
                // Use provided title ref to detect when title scrolls past
                const titleBottom = titleRef.current.getBoundingClientRect().bottom;
                setIsSticky(titleBottom <= 0);
            } else if (containerRef.current) {
                // Fallback: track when container itself reaches top
                const containerTop = containerRef.current.getBoundingClientRect().top;
                setIsSticky(containerTop <= 0);
            }
        };

        window.addEventListener("scroll", handleScroll);
        // Check initial state
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [titleRef]);

    const handleCategoryClick = (category: string) => {
        if (onCategorySelect) {
            // Pass the category directly - the parent will handle toggle logic
            onCategorySelect(category);
        }
    };

    if (categories.length === 0) {
        return null;
    }

    return (
        <div ref={containerRef} className={`w-full ${className}`}>
            {/* Placeholder when sticky to prevent layout shift */}
            {isSticky && <div className="h-[80px]" />}
            
            <div
                ref={filterRef}
                className={`hidden md:flex w-full overflow-x-auto px-4 md:px-24 py-6 gap-3 md:gap-4 md:justify-center mobile-filter-tabs transition-all duration-300 ${
                    isSticky
                        ? "fixed top-0 left-0 right-0 z-50 bg-[#120A1A]/95 backdrop-blur-lg border-b border-[#976ADD]/30 shadow-lg shadow-black/20"
                        : ""
                }`}
            >
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={`px-6 md:px-10 py-3 rounded-xl text-sm md:text-md font-montserrat font-semibold transition-all duration-200 whitespace-nowrap mobile-touch-target mobile-filter-tab mobile-button ${
                            selectedCategory === category
                                ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-[#AF7AEB]/30 scale-105"
                                : "bg-[#262929] text-[#A0A0A0] hover:bg-[#3a3a3a] hover:text-white border border-white/10 hover:scale-105"
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
    );
}

