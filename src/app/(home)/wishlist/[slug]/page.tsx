"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import BottomNavigation from "@/components/BottomNavigation";

export default function WishlistDetailPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isSaved, setIsSaved] = useState(true);

    // Mock data - in real app, fetch based on slug
    const propertyData: Record<string, any> = {
        nice: {
            id: "nice",
            title: "Nice",
            dateRange: "May 14 - 19",
            guests: "Guests",
            badge: "SUPERHOST",
            images: [
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            ],
            rating: "4.98",
            reviewCount: "61",
            description: "Entire home in Putnam Valley",
            subtitle: "Modern luxury in woods 5B 3.5B.",
            pricePerNight: "$1,700",
            totalPrice: "$10,156",
        },
        chill: {
            id: "chill",
            title: "Chill",
            dateRange: "Any week",
            guests: "Guests",
            badge: "SUPERHOST",
            images: [
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            ],
            rating: "4.85",
            reviewCount: "42",
            description: "Cozy Beachfront Villa",
            subtitle: "Relaxing getaway by the sea 4B 3B.",
            pricePerNight: "$2,200",
            totalPrice: "$15,400",
        },
    };

    const property = propertyData[slug] || propertyData.nice;

    const handleBack = () => {
        router.back();
    };

    const handleShare = () => {
        // TODO: Implement share functionality
        console.log("Share clicked");
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
    };

    const handleImageChange = (index: number) => {
        setCurrentImageIndex(index);
    };

    const handleViewDetails = () => {
        // Navigate to full booking page
        router.push(`/booking/${slug}`);
    };

    return (
        <div className="min-h-screen bg-black pb-24">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Back Button */}
                        <button
                            onClick={handleBack}
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                        >
                            <svg
                                className="w-4 h-4 text-black"
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

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                            >
                                <svg
                                    className="w-4 h-4 text-black"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                                    />
                                </svg>
                            </button>

                            {/* Menu Button */}
                            <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                                <svg
                                    className="w-4 h-4 text-black"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4">
                {/* Title and Date */}
                <div className="mb-4">
                    <h1 className="text-white text-2xl font-bold mb-3 font-montserrat">
                        {property.title}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-opensans">
                            {property.dateRange}
                        </span>
                        <button className="px-3 py-1 border border-white/30 rounded-full text-white text-xs font-opensans hover:bg-white/10 transition-colors">
                            {property.guests}
                        </button>
                    </div>
                </div>

                {/* Image Carousel */}
                <div className="mb-4">
                    <div className="relative rounded-xl overflow-hidden">
                        {/* Main Image */}
                        <div className="relative h-64 bg-gray-800">
                            <img
                                src={property.images[currentImageIndex]}
                                alt={property.title}
                                className="w-full h-full object-cover"
                            />

                            {/* Badge */}
                            <div className="absolute top-3 left-3">
                                <span className="bg-white text-black px-2.5 py-0.5 rounded-md text-[10px] font-semibold font-opensans">
                                    {property.badge}
                                </span>
                            </div>

                            {/* Heart Icon */}
                            <button
                                onClick={handleSave}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
                            >
                                <svg
                                    className={`w-4 h-4 ${
                                        isSaved
                                            ? "fill-red-500 text-red-500"
                                            : "text-white"
                                    }`}
                                    fill={isSaved ? "currentColor" : "none"}
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

                            {/* Image Indicators */}
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                                {property.images.map(
                                    (_: any, index: number) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                handleImageChange(index)
                                            }
                                            className={`w-1 h-1 rounded-full transition-all ${
                                                currentImageIndex === index
                                                    ? "bg-white w-4"
                                                    : "bg-white/50"
                                            }`}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Property Details */}
                <div>
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                        <svg
                            className="w-3.5 h-3.5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-white font-semibold text-sm font-opensans">
                            {property.rating} ({property.reviewCount})
                        </span>
                    </div>

                    {/* Description */}
                    <h2 className="text-white text-base font-semibold mb-1 font-montserrat">
                        {property.description}
                    </h2>
                    <p className="text-white text-base font-semibold mb-4 font-montserrat">
                        {property.subtitle}
                    </p>

                    {/* Price */}
                    <div className="mb-3">
                        <div className="text-white text-base font-opensans mb-0.5">
                            <span className="font-semibold">
                                {property.pricePerNight}
                            </span>{" "}
                            night ·{" "}
                            <span className="font-semibold">
                                {property.totalPrice}
                            </span>{" "}
                            total
                        </div>
                        <div className="text-white/70 text-xs font-opensans">
                            {property.totalPrice} total
                        </div>
                    </div>

                    {/* View Full Details Button */}
                    <button
                        onClick={handleViewDetails}
                        className="w-full bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white py-3 rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all font-montserrat mt-2"
                    >
                        View Full Details
                    </button>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNavigation activeTab="home" />
        </div>
    );
}
