"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import PropertyCard from "./PropertyCard";

interface Property {
    id: string;
    title: string;
    location: string;
    price: string;
    image: string;
    status?: string;
    rating?: string;
}

interface PropertyGridProps {
    properties: Property[];
    title: string;
    filterOptions?: string[];
    className?: string;
    onPropertyClick?: (property: Property) => void;
    onCategorySelect?: (category: string) => void;
    selectedCategory?: string | null;
    loadingPropertyId?: string | null;
    hideTitleOnDesktop?: boolean;
}

export default function PropertyGrid({
    properties,
    title,
    filterOptions = [],
    className = "",
    onPropertyClick,
    onCategorySelect,
    selectedCategory,
    loadingPropertyId,
    hideTitleOnDesktop = false,
}: PropertyGridProps) {
    const router = useRouter();
    const [isSticky, setIsSticky] = useState(false);
    const titleRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (titleRef.current && filterRef.current) {
                const titleBottom =
                    titleRef.current.getBoundingClientRect().bottom;
                // Make sticky only after scrolling past the title
                setIsSticky(titleBottom <= 0);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleFilterClick = (filter: string) => {
        // Call the parent's category select callback
        if (onCategorySelect) {
            onCategorySelect(selectedCategory === filter ? '' : filter);
        }
    };

    // Extract slug from image URL
    const getSlugFromImage = (imageUrl: string) => {
        try {
            // Extract the image ID from Unsplash URL
            const match = imageUrl.match(/photo-([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return match[1];
            }
            // Fallback: use the last part of the URL
            const urlParts = imageUrl.split("/");
            const lastPart = urlParts[urlParts.length - 1].split("?")[0];
            return lastPart.replace(/\.[^/.]+$/, ""); // Remove extension
        } catch {
            return "property";
        }
    };

    const handlePropertyClick = (property: Property) => {
        // Use property.id directly instead of extracting from image URL
        console.log('PropertyGrid - Clicked property:', property);
        console.log('PropertyGrid - Property ID:', property.id);
        console.log('PropertyGrid - Navigating to:', `/booking/${property.id}`);
        router.push(`/booking/${property.id}`);

        // Call the optional callback
        if (onPropertyClick) {
            onPropertyClick(property);
        }
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Section Title */}
            <h2
                ref={titleRef}
                className={`text-white text-lg md:text-4xl font-semibold mb-4 md:mb-8 text-left md:text-center px-4 md:px-0 mobile-section-title ${
                    hideTitleOnDesktop ? "hidden md:hidden" : ""
                }`}
            >
                {title}
            </h2>

            {/* Placeholder for sticky space */}
            {isSticky && filterOptions.length > 0 && (
                <div className="h-[72px] md:h-[80px]" />
            )}

            {/* Filter Options - Hidden on Mobile */}
            {filterOptions.length > 0 && (
                <div
                    ref={filterRef}
                    className={`hidden md:flex w-full overflow-x-auto px-4 md:px-24 py-6 gap-3 md:gap-0 md:justify-between mobile-filter-tabs transition-all duration-300 ${
                        isSticky
                            ? "fixed top-0 left-0 right-0 z-50 bg-[#120A1A]/95 backdrop-blur-lg border-b border-[#976ADD]/30 shadow-lg shadow-black/20"
                            : ""
                    }`}
                >
                    {filterOptions.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => handleFilterClick(filter)}
                            className={`px-6 md:px-10 py-3 rounded-xl text-sm md:text-md font-montserrat font-semibold transition-all duration-200 whitespace-nowrap mobile-touch-target mobile-filter-tab mobile-button ${
                                selectedCategory === filter
                                    ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-[#AF7AEB]/30"
                                    : "bg-[#262929] text-[#A0A0A0] hover:bg-[#3a3a3a] hover:text-white border border-white/10"
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            )}

            {/* Properties Grid */}
            <div className="mobile-property-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {properties.map((property) => (
                    <PropertyCard
                        key={property.id}
                        id={property.id}
                        title={property.title}
                        location={property.location}
                        price={property.price}
                        image={property.image}
                        onClick={() => handlePropertyClick(property)}
                        status={property.status}
                        rating={property.rating}
                        isLoading={loadingPropertyId === property.id}
                    />
                ))}
            </div>
        </div>
    );
}
