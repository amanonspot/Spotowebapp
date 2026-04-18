"use client";
import React from "react";
import CategoryGrid from "./CategoryGrid";
import EnhancedSearchBar from "./EnhancedSearchBar";

interface SearchSectionProps {
    onCategorySelect?: (category: string) => void;
    selectedCategory?: string | null;
    onSearch?: () => void;
    onWhereChange?: (value: string) => void;
    onCheckInChange?: (value: string) => void;
    onCheckOutChange?: (value: string) => void;
    onGuestsChange?: (value: string) => void;
    initialWhere?: string;
    className?: string;
}

export default function SearchSection({
    onCategorySelect,
    selectedCategory,
    onSearch,
    onWhereChange,
    onCheckInChange,
    onCheckOutChange,
    onGuestsChange,
    initialWhere = "",
    className = "",
}: SearchSectionProps) {
    return (
        <div className={`w-full max-w-6xl mx-auto px-4 -mt-10 md:-mt-28 ${className}`}>
            {/* Prompt */}
            <p className="text-white text-xl md:text-2xl font-semibold pb-6 md:pb-8 pt-0 mt-0 text-center mobile-neon-text leading-none" style={{ marginTop: '-20px' }}>
                What are you looking for?
            </p>

            {/* Mobile Filter Buttons */}
            <div className="md:hidden">
                <div className="flex flex-col gap-3 mb-4">
                    <button className="w-full mobile-filter-button rounded-xl py-4 px-5 text-left text-white/70">
                        <span className="text-sm font-medium">Destination</span>
                    </button>
                    <button className="w-full mobile-filter-button rounded-xl py-4 px-5 text-left text-white/70">
                        <span className="text-sm font-medium">Dates</span>
                    </button>
                    <button className="w-full mobile-filter-button rounded-xl py-4 px-5 text-left text-white/70">
                        <span className="text-sm font-medium">Guests</span>
                    </button>
                </div>

                {/* Explore Button */}
                <button
                    onClick={onSearch}
                    className="w-full bg-[#AF7AEB] hover:bg-[#9575e6] rounded-xl py-4 px-5 flex items-center justify-center gap-2 font-semibold text-white transition-all mobile-explore-button"
                >
                    <span>Explore</span>
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
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                    </svg>
                </button>
            </div>

            {/* Desktop Category buttons */}
            <div className="hidden md:flex justify-center mb-6 md:mb-8">
                <CategoryGrid 
                    onCategorySelect={onCategorySelect}
                    selectedCategory={selectedCategory}
                />
            </div>

            {/* Desktop Search bar */}
            <div className="hidden md:flex justify-center">
                <EnhancedSearchBar
                    onSearch={onSearch}
                    onWhereChange={onWhereChange}
                    onCheckInChange={onCheckInChange}
                    onCheckOutChange={onCheckOutChange}
                    onGuestsChange={onGuestsChange}
                    initialWhere={initialWhere}
                />
            </div>
        </div>
    );
}
