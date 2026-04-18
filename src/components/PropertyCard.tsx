"use client";
import React from "react";
import { useWishlist } from "@/lib/hooks/useWishlist";

interface PropertyCardProps {
    id?: string;
    title: string;
    location: string;
    price: string;
    image: string;
    className?: string;
    onClick?: () => void;
    status?: string;
    rating?: string;
    isLoading?: boolean;
}

export default function PropertyCard({
    id,
    title,
    location,
    price,
    image,
    className = "",
    onClick,
    status,
    rating,
    isLoading = false,
}: PropertyCardProps) {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const isFavorite = id ? isInWishlist(id) : false;

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (id) {
            toggleWishlist(id);
        }
    };
    return (
        <div 
            className={`${className} bg-[#20162B] rounded-xl overflow-hidden transition-all duration-300 mobile-property-card mobile-button shadow-lg shadow-black/20 border border-white/5 ${
                isLoading 
                    ? 'cursor-wait opacity-75' 
                    : 'cursor-pointer hover:scale-105 active:scale-95'
            }`}
            onClick={isLoading ? undefined : onClick}
            style={{ padding: 0 }}
        >
            <div className="relative h-48 md:h-56 w-full overflow-hidden" style={{ margin: 0, padding: 0 }}>
                <img
                    src={image}
                    alt={title}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    style={{ 
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%',
                        margin: 0,
                        padding: 0,
                        display: 'block'
                    }}
                />
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span className="text-white text-xs font-medium">Loading...</span>
                        </div>
                    </div>
                )}

                {/* Heart icon for wishlist */}
                <button
                    onClick={handleWishlistClick}
                    className="absolute top-3 right-3 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:bg-black/50 transition-colors z-10"
                >
                    <svg
                        className={`w-4 h-4 drop-shadow-lg ${
                            isFavorite ? 'text-red-500 fill-red-500' : 'text-white'
                        }`}
                        fill={isFavorite ? 'currentColor' : 'none'}
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

            <div className="p-4 md:p-5">
                {/* Mobile: Add status/tag */}
                {status && (
                    <div className="md:hidden mb-2">
                        <span className="text-xs text-white font-montserrat font-semibold bg-gradient-to-r from-[#AF7AEB]/20 to-[#9575e6]/20 px-3 py-1 rounded-full border border-[#AF7AEB]/30 backdrop-blur-sm">
                            {status}
                        </span>
                    </div>
                )}
                {/* Rating for mobile */}
                {rating && (
                    <div className="md:hidden mb-2 flex items-center gap-1">
                        <svg
                            className="w-3 h-3 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-white font-medium">
                            {rating}
                        </span>
                    </div>
                )}
                <h3 className="text-white font-montserrat font-semibold text-sm md:text-base mb-1 line-clamp-2">
                    {title}
                </h3>
                <p className="text-[#A0A0A0] text-sm md:text-base mb-2 flex items-center gap-1 font-opensans">
                    <svg
                        className="w-3 h-3 text-[#AF7AEB]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    {location}
                </p>
                <p className="text-[#BFD041] font-montserrat font-semibold text-sm md:text-base drop-shadow-lg">
                    {price}
                </p>
            </div>
        </div>
    );
}
