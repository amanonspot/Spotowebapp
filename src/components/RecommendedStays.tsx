"use client";
import React, { useState, useEffect } from "react";
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

interface RecommendedStaysProps {
    properties: Property[];
    className?: string;
    onPropertyClick?: (property: Property) => void;
    loadingPropertyId?: string | null;
}

export default function RecommendedStays({
    properties,
    className = "",
    onPropertyClick,
    loadingPropertyId,
}: RecommendedStaysProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [mouseStart, setMouseStart] = useState<number | null>(null);
    const [mouseEnd, setMouseEnd] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
    const [hasSwiped, setHasSwiped] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (!autoPlayEnabled || properties.length === 0) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % properties.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [properties.length, autoPlayEnabled]);

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
        // Prevent navigation if user just swiped or is currently dragging
        if (hasSwiped || isDragging) {
            return;
        }
        
        // Use property.id directly instead of extracting from image URL
        console.log('RecommendedStays - Clicked property:', property);
        console.log('RecommendedStays - Property ID:', property.id);
        console.log('RecommendedStays - Navigating to:', `/booking/${property.id}`);
        router.push(`/booking/${property.id}`);

        // Call the optional callback
        if (onPropertyClick) {
            onPropertyClick(property);
        }
    };

    const getCardStyle = (index: number) => {
        const diff = index - currentIndex;
        const normalizedDiff = (diff + properties.length) % properties.length;
        const actualDiff =
            normalizedDiff > properties.length / 2
                ? normalizedDiff - properties.length
                : normalizedDiff;

        // Mobile: Show center card with minimal side card visibility (like Canva design)
        if (isMobile) {
            if (actualDiff === 0) {
                // Center card - prominent
                return {
                    transform: "translateX(-50%) scale(1.05)",
                    opacity: 1,
                    zIndex: 30,
                    left: "50%",
                };
            } else if (actualDiff === -1) {
                // Left card - barely visible sliver only
                return {
                    transform: "translateX(-50%) scale(0.8)",
                    opacity: 0.3,
                    zIndex: 20,
                    left: "-18%",
                };
            } else if (actualDiff === 1) {
                // Right card - barely visible sliver only
                return {
                    transform: "translateX(-50%) scale(0.8)",
                    opacity: 0.3,
                    zIndex: 20,
                    left: "118%",
                };
            } else {
                // Hidden cards
                return {
                    transform: "translateX(-50%) scale(0.7)",
                    opacity: 0,
                    zIndex: 10,
                    left: actualDiff < 0 ? "-30%" : "130%",
                };
            }
        }

        // Desktop: Show center card larger with side cards
        if (actualDiff === 0) {
            // Center card - larger
            return {
                transform: "translateX(-50%) scale(1.2)",
                opacity: 1,
                zIndex: 30,
                left: "50%",
            };
        } else if (actualDiff === -1) {
            // Left card - smaller
            return {
                transform: "translateX(-50%) scale(0.85)",
                opacity: 0.7,
                zIndex: 20,
                left: "15%",
            };
        } else if (actualDiff === 1) {
            // Right card - smaller
            return {
                transform: "translateX(-50%) scale(0.85)",
                opacity: 0.7,
                zIndex: 20,
                left: "85%",
            };
        } else {
            // Hidden cards
            return {
                transform: "translateX(-50%) scale(0.7)",
                opacity: 0,
                zIndex: 10,
                left: actualDiff < 0 ? "-20%" : "120%",
            };
        }
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
        setAutoPlayEnabled(false); // Disable auto-play when user interacts
        setTimeout(() => setAutoPlayEnabled(true), 10000); // Re-enable after 10 seconds
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % properties.length);
        setAutoPlayEnabled(false);
        setTimeout(() => setAutoPlayEnabled(true), 10000);
    };

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + properties.length) % properties.length);
        setAutoPlayEnabled(false);
        setTimeout(() => setAutoPlayEnabled(true), 10000);
    };

    // Minimum swipe distance (in pixels)
    const minSwipeDistance = 50;

    // Touch handlers for mobile
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) {
            setTouchStart(null);
            setTouchEnd(null);
            return;
        }
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            setHasSwiped(true);
            goToNext();
        } else if (isRightSwipe) {
            setHasSwiped(true);
            goToPrev();
        } else {
            setHasSwiped(false);
        }
        
        // Reset swipe flag after a short delay
        setTimeout(() => setHasSwiped(false), 300);
        
        setTouchStart(null);
        setTouchEnd(null);
    };

    // Mouse handlers for desktop
    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setMouseStart(e.clientX);
        setMouseEnd(null);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || mouseStart === null) return;
        setMouseEnd(e.clientX);
    };

    const onMouseUp = () => {
        if (!mouseStart || mouseEnd === null) {
            setIsDragging(false);
            setHasSwiped(false);
            return;
        }
        
        const distance = mouseStart - mouseEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            setHasSwiped(true);
            goToNext();
        } else if (isRightSwipe) {
            setHasSwiped(true);
            goToPrev();
        } else {
            setHasSwiped(false);
        }
        
        // Reset swipe flag after a short delay
        setTimeout(() => setHasSwiped(false), 300);
        
        setIsDragging(false);
        setMouseStart(null);
        setMouseEnd(null);
    };

    const onMouseLeave = () => {
        setIsDragging(false);
        setMouseStart(null);
        setMouseEnd(null);
    };

    return (
        <div className={`w-full max-w-6xl mx-auto px-4 ${className}`}>
            <h2 className="text-white text-xl md:text-2xl font-semibold mb-6 md:mb-8 mobile-section-title mobile-neon-text">
                Recommended Stays
            </h2>

            <div className="relative h-[420px] sm:h-[460px] md:h-[520px] lg:h-[540px] mb-6">
                <div 
                    className="relative w-full h-full flex items-center justify-center overflow-hidden px-2 sm:px-0 cursor-grab active:cursor-grabbing select-none"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseLeave}
                >
                    {properties.map((property, index) => (
                        <div
                            key={property.id}
                            className="absolute transition-all duration-500 ease-in-out w-full max-w-[280px] sm:max-w-[300px] md:max-w-[340px] lg:max-w-[360px] pointer-events-auto"
                            style={getCardStyle(index)}
                        >
                            <PropertyCard
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
                        </div>
                    ))}
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center mt-4 gap-2 absolute bottom-0 left-1/2 -translate-x-1/2">
                    {properties.map((_, index) => (
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
            </div>
        </div>
    );
}
