"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "./Logo";
import MobileSearchModal from "./MobileSearchModal";
import Pagination from "./Pagination";
import Header from "./Header";
import RecommendedStays from "./RecommendedStays";
import { whatsappUtils } from "@/lib/utils/whatsapp";

interface Property {
    id: string;
    title: string;
    location: string;
    price: string;
    image: string;
    status?: string;
    rating?: string;
}

interface MobileHomeViewProps {
    location?: string;
    onLocationClick?: () => void;
    onLocationChange?: (location: string) => void;
    onProfileClick?: () => void;
    onSearchClick?: () => void;
    onCategoryClick?: (category: string) => void;
    onHostBannerClick?: () => void;
    properties?: Property[];
    recommendedProperties?: Property[];
    onPropertyClick?: (property: Property) => void;
    loadingPropertyId?: string | null;
    // Pagination props
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
    // Categories props
    categories?: string[];
    selectedCategory?: string | null;
}

export default function MobileHomeView({
    location = "Bangalore",
    onLocationClick,
    onLocationChange,
    onProfileClick,
    onSearchClick,
    onCategoryClick,
    onHostBannerClick,
    properties = [],
    recommendedProperties = [],
    onPropertyClick,
    loadingPropertyId,
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    categories: propCategories,
    selectedCategory,
}: MobileHomeViewProps) {
    const router = useRouter();
    const [isSticky, setIsSticky] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const titleRef = useRef<HTMLDivElement>(null);

    // Categories for "What are you looking for?" section
    const searchCategories = [
        { id: "Home Stays", label: "Home Stays" },
        { id: "Spoto Stays", label: "Spoto Stays" },
        { id: "Safari Stays", label: "Safari Stays" },
        { id: "Villas", label: "Villas" },
        { id: "Hostels", label: "Hostels" },
    ];

    // Fixed filter options for Explore Stays section (matching desktop)
    const exploreStaysFilters = [
        { id: "Home Stays", label: "Home Stays" },
        { id: "Villas", label: "Villas" },
        { id: "Studio 1 bhk", label: "Studio 1 bhk" },
        { id: "Couple Friendly", label: "Couple Friendly" },
        { id: "Traveler Hostel", label: "Traveler Hostel" },
        { id: "Budget Stays", label: "Budget Stays" },
    ];

    // Scroll detection for sticky header
    useEffect(() => {
        const handleScroll = () => {
            if (titleRef.current) {
                const titleBottom =
                    titleRef.current.getBoundingClientRect().bottom;
                setIsSticky(titleBottom <= 0);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Extract slug from image URL for navigation
    const getSlugFromImage = (imageUrl: string) => {
        try {
            const match = imageUrl.match(/photo-([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                return match[1];
            }
            const urlParts = imageUrl.split("/");
            const lastPart = urlParts[urlParts.length - 1].split("?")[0];
            return lastPart.replace(/\.[^/.]+$/, "");
        } catch {
            return "property";
        }
    };

    const handlePropertyCardClick = (property: Property) => {
        // Use property.id directly instead of extracting from image URL
        router.push(`/booking/${property.id}`);
        if (onPropertyClick) {
            onPropertyClick(property);
        }
    };

    const handleFilterClick = (filterId: string) => {
        // Pass the category to parent - parent will handle toggle logic
        // This matches desktop behavior where parent decides if it should toggle or set
        onCategoryClick?.(filterId);
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] pb-24">
            <div
                className="rounded-b-4xl mb-2 pb-0"
                style={{
                    background:
                        "linear-gradient(180deg, #1D1528 0%, #231B31 12%, #060606 42%, #060606 75%, transparent 100%)",
                    borderBottom: "1px solid #976ADD",
                }}
            >
                {/* Header Section with bottom border */}
                <div className="px-6 pt-2 pb-2 ">
                    {/* Use the same Header component for consistency */}
                    <Header
                        location={location}
                        onLocationClick={onLocationClick}
                        onLocationChange={onLocationChange}
                        onProfileClick={onProfileClick}
                        showHomeIcon={false}
                    />

                    {/* Search Bar */}
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Search bar clicked - opening modal');
                            setIsSearchModalOpen(true);
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Search bar touched - opening modal');
                            setIsSearchModalOpen(true);
                        }}
                        className="w-full bg-[#1A1A1A] rounded-full px-4 py-3 flex items-center gap-3 border border-white/10 shadow-md cursor-pointer active:scale-[0.98] transition-transform touch-manipulation select-none relative z-10"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setIsSearchModalOpen(true);
                            }
                        }}
                    >
                        <svg
                            className="w-5 h-5 text-gray-400 pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <div className="flex-1 text-left pointer-events-none">
                            <div className="text-white text-sm">
                                {location && location !== "Bangalore" ? location : "Where to?"}
                            </div>
                            <div className="text-gray-500 text-xs">
                                {location && location !== "Bangalore" ? "Any week · Add guests" : "Anywhere · Any week · Add guests"}
                            </div>
                        </div>
                        <div 
                            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 active:scale-95 transition-all relative z-20"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Filter icon clicked - triggering search');
                                if (onSearchClick) {
                                    onSearchClick();
                                }
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Filter icon touched - triggering search');
                                if (onSearchClick) {
                                    onSearchClick();
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onSearchClick) {
                                        onSearchClick();
                                    }
                                }
                            }}
                        >
                            <svg
                                className="w-4 h-4 text-gray-400 pointer-events-none"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* SPOTO Logo with border-bottom */}
                <div className="flex justify-center py-0 -mt-24 -mb-12">
                    <Logo className="mb-0 -mb-58 !w-[300px]" />
                </div>
            </div>

            {/* What are you looking for Section with border-bottom */}
            <div className="px-6 py-4 mt-4 border-b border-white/5">
                <h2 className="text-white text-center text-lg font-semibold mb-4 tracking-tight">
                    What are you looking for?
                </h2>

                {/* Category Buttons */}
                <div className="space-y-3">
                    {/* First Row - 2 buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        {searchCategories.slice(0, 2).map((category, index) => (
                            <div key={index} className="relative">
                                <div 
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(90deg, rgba(192, 132, 252, 0.7) 0%, rgba(124, 58, 237, 0.7) 100%)',
                                        borderRadius: '16px',
                                    }}
                                />
                                <button
                                    onClick={() => handleFilterClick(category.id)}
                                    className="relative w-full px-4 py-5 text-white font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
                                    style={{
                                        background: selectedCategory?.toLowerCase() === category.id.toLowerCase()
                                            ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.2), rgba(124, 58, 237, 0.15))'
                                            : 'rgba(26, 26, 26, 0.95)',
                                        borderRadius: '16px',
                                        margin: `0 0 ${selectedCategory?.toLowerCase() === category.id.toLowerCase() ? '2.5px' : '2px'} 0`,
                                        textShadow: '0 0 1px rgba(255, 255, 255, 0.2)',
                                    }}
                                >
                                    <span className="relative z-10">{category.label}</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Second Row - 3 buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        {searchCategories.slice(2, 5).map((category, index) => (
                            <div key={index + 2} className="relative">
                                <div 
                                    className="absolute inset-0"
                                    style={{
                                        background: 'linear-gradient(90deg, rgba(192, 132, 252, 0.7) 0%, rgba(124, 58, 237, 0.7) 100%)',
                                        borderRadius: '16px',
                                    }}
                                />
                                <button
                                    onClick={() => handleFilterClick(category.id)}
                                    className="relative w-full px-3 py-5 text-white font-bold text-xs transition-all duration-200 hover:opacity-90 active:scale-95"
                                    style={{
                                        background: selectedCategory?.toLowerCase() === category.id.toLowerCase()
                                            ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.2), rgba(124, 58, 237, 0.15))'
                                            : 'rgba(26, 26, 26, 0.95)',
                                        borderRadius: '16px',
                                        margin: `0 0 ${selectedCategory?.toLowerCase() === category.id.toLowerCase() ? '2.5px' : '2px'} 0`,
                                        textShadow: '0 0 1px rgba(255, 255, 255, 0.2)',
                                    }}
                                >
                                    <span className="relative z-10">{category.label}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recommended Stays Section */}
            {recommendedProperties.length > 0 && (
                <div className="py-8 border-b border-white/5">
                    <RecommendedStays
                        properties={recommendedProperties}
                        onPropertyClick={onPropertyClick}
                        loadingPropertyId={loadingPropertyId}
                    />
                </div>
            )}

            {/* Host Property Banner with border-bottom */}
            <div className="px-6 py-8 border-b border-white/5">
                <button
                    onClick={onHostBannerClick}
                    className="w-full bg-gradient-to-r from-[#B794F6] to-[#A78BFA] rounded-2xl p-6 flex items-center justify-between active:scale-98 transition-all shadow-lg shadow-purple-500/20"
                >
                    <div className="text-left">
                        <div className="text-white/80 text-sm mb-1">
                            Host your Property on
                        </div>
                        <div className="text-black text-xl font-bold">
                            SPOTO ✨
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <svg
                            className="w-5 h-5 text-white"
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
                    </div>
                </button>
            </div>

            {/* Property Listings */}
            {properties.length > 0 && (
                <div className="py-8">
                    {/* Title - will be used for scroll detection */}
                    <h3
                        ref={titleRef}
                        className="text-white text-lg font-semibold mb-6 px-6 font-montserrat"
                    >
                        Explore Stays
                    </h3>

                    {/* Placeholder when sticky */}
                    {isSticky && <div className="h-[120px]" />}

                    {/* Sticky Header with Title and Filters */}
                    {isSticky && (
                        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-purple-500/30 shadow-lg shadow-black/20">
                            {/* Title */}
                            <div className="px-6 pt-5 pb-3">
                                <h3 className="text-white text-lg font-semibold font-montserrat">
                                    Explore Stays
                                </h3>
                            </div>

                            {/* Filters */}
                            <div className="px-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                                {exploreStaysFilters.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() =>
                                            handleFilterClick(category.id)
                                        }
                                        className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                            selectedCategory?.toLowerCase() === category.id.toLowerCase()
                                                ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-purple-500/30"
                                                : "bg-[#1A1A1A] text-gray-400 border border-white/10 hover:bg-white/5"
                                        }`}
                                    >
                                        {category.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter Buttons - Non-sticky version */}
                    {!isSticky && (
                        <div className="px-6 mb-6 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                            {exploreStaysFilters.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() =>
                                        handleFilterClick(category.id)
                                    }
                                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                                        selectedCategory?.toLowerCase() === category.id.toLowerCase()
                                            ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-purple-500/30"
                                            : "bg-[#1A1A1A] text-gray-400 border border-white/10 hover:bg-white/5"
                                    }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-6 px-6">
                        {properties.map((property) => (
                            <div
                                key={property.id}
                                onClick={() =>
                                    handlePropertyCardClick(property)
                                }
                                className={`transition-all ${
                                    loadingPropertyId === property.id
                                        ? 'cursor-wait opacity-75'
                                        : 'active:scale-[0.99] cursor-pointer'
                                }`}
                            >
                                {/* Property Image - Increased height, full width */}
                                <div className="relative h-96 w-full rounded-2xl overflow-hidden">
                                    <img
                                        src={property.image}
                                        alt={property.title}
                                        className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Loading overlay */}
                                    {loadingPropertyId === property.id && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span className="text-white text-xs font-medium">Loading...</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Heart Icon */}
                                    <button className="absolute top-4 right-4 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-black/50 transition-colors">
                                        <svg
                                            className="w-5 h-5 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* Property Details - Separated from image */}
                                <div className="pt-4">
                                    {/* Status */}
                                    {property.status && (
                                        <div className="mb-2">
                                            <span className="text-xs text-white font-semibold font-montserrat">
                                                {property.status}
                                            </span>
                                        </div>
                                    )}

                                    {/* Title */}
                                    <h4 className="text-white font-bold text-lg mb-2 line-clamp-2 font-montserrat leading-tight">
                                        {property.title}
                                    </h4>

                                    {/* Location */}
                                    <p className="text-purple-300 text-sm mb-3 font-opensans">
                                        {property.location}
                                    </p>

                                    {/* Price */}
                                    <div className="text-lg font-bold text-purple-400 font-montserrat">
                                        {property.price}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Pagination for mobile */}
                    {totalPages && totalPages > 1 && (
                        <div className="px-6 mt-6">
                            <Pagination
                                currentPage={currentPage || 1}
                                totalPages={totalPages}
                                onPageChange={onPageChange || (() => {})}
                                totalItems={totalItems || 0}
                                itemsPerPage={itemsPerPage || 12}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Questions about hosting section */}
            <div className="px-6 py-8 mt-4">
                <div className="relative rounded-3xl overflow-hidden h-64">
                    {/* Background Image with gradient overlay */}
                    <div className="absolute inset-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage:
                                    "url('https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')",
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
                    </div>

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-center px-8">
                        <h2 className="text-white text-4xl font-bold mb-6 leading-tight font-montserrat">
                            Questions
                            <br />
                            about
                            <br />
                            hosting?
                        </h2>
                        <button 
                            onClick={() => whatsappUtils.contactForHosting()}
                            className="bg-white text-black px-6 py-3 rounded-lg font-semibold text-sm font-montserrat hover:bg-gray-100 active:scale-95 transition-all w-fit flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            Ask our Team
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Search Modal */}
            <MobileSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                initialLocation={location}
                onNext={(data) => {
                    // Navigate to search page with properly formatted parameters
                    const searchParams = new URLSearchParams();
                    
                    // Location
                    if (data.location && data.location !== "Anywhere") {
                        searchParams.set("location", data.location);
                    }
                    
                    // Date range - parse "when" into checkIn and checkOut
                    if (data.when && data.when !== "Any week") {
                        // Try full format first: "Mar 7, 2025 - Mar 14, 2025"
                        const fullDateMatch = data.when.match(/(.+?)\s*-\s*(.+)/);
                        if (fullDateMatch) {
                            const checkIn = fullDateMatch[1].trim();
                            const checkOut = fullDateMatch[2].trim();
                            searchParams.set("checkIn", checkIn);
                            searchParams.set("checkOut", checkOut);
                            console.log('📅 Mobile search dates:', { checkIn, checkOut });
                        }
                    }
                    
                    // Guests - should be a number string, not descriptive text
                    if (data.guests) {
                        searchParams.set("guests", data.guests);
                    }
                    
                    router.push(`/search?${searchParams.toString()}`);
                    setIsSearchModalOpen(false);
                }}
            />
        </div>
    );
}
