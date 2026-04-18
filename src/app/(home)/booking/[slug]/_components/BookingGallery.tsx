"use client";

import Image from "next/image";
import { Share2, Heart } from "lucide-react";
import { Event } from "@/lib/api/types";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface GalleryImage {
    id: string;
    src: string;
    alt: string;
}

interface BookingGalleryProps {
    event?: Event | null;
}

const BookingGallery: React.FC<BookingGalleryProps> = ({ event }) => {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const isSaved = event ? isInWishlist(event.id) : false;
    const [isSharing, setIsSharing] = useState(false);
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    // Get ALL gallery images from event media (for modal view)
    const getAllGalleryImages = (): GalleryImage[] => {
        if (!event) {
            return getFallbackImages();
        }

        // Check for event_gallery first (from API response)
        if (event.event_gallery?.image && event.event_gallery.image.length > 0) {
            return event.event_gallery.image.map((src: string, index: number) => ({
                id: `gallery-${index}`,
                src: src,
                alt: `${event.event_title} - Image ${index + 1}`,
            }));
        }

        // Check for event_media (from API response)
        if (event.event_media?.image && event.event_media.image.length > 0) {
            return event.event_media.image.map((src: string, index: number) => ({
                id: `media-${index}`,
                src: src,
                alt: `${event.event_title} - Image ${index + 1}`,
            }));
        }

        // Check for display_image
        if (event.display_image) {
            return [{
                id: "display",
                src: event.display_image,
                alt: `${event.event_title} - Main Image`,
            }];
        }

        // Check legacy media structure
        if (event.media && event.media.length > 0) {
            return event.media
                .filter(m => m.media_type === 'image' && !m.is_deleted && !m.is_hidden)
                .sort((a, b) => a.media_priority_ranking - b.media_priority_ranking)
                .map((m, index) => ({
                    id: m.id,
                    src: m.media_file,
                    alt: `${event.event_title} - Image ${index + 1}`,
                }));
        }

        // Return fallback images if no images found
        return getFallbackImages();
    };

    // Get first 5 gallery images for thumbnail grid (with placeholders if needed)
    const getGalleryImages = (): GalleryImage[] => {
        const allImages = getAllGalleryImages();
        const images = allImages.slice(0, 5);

        // Fill with placeholders if less than 5 images
        while (images.length < 5) {
            images.push({
                id: `placeholder-${images.length}`,
                src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop",
                alt: "Property image",
            });
        }

        return images;
    };

    const getFallbackImages = (): GalleryImage[] => {
        return [
            {
                id: "1",
                src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop",
                alt: "Property image",
            },
            {
                id: "2",
                src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop",
                alt: "Property image",
            },
            {
                id: "3",
                src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop",
                alt: "Property image",
            },
            {
                id: "4",
                src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop",
                alt: "Property image",
            },
            {
                id: "5",
                src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop",
                alt: "Property image",
            },
        ];
    };

    const galleryImages = getGalleryImages(); // For thumbnail grid (first 5)
    const allGalleryImages = getAllGalleryImages(); // For "View all" modal (all images)

    const handleShare = async () => {
        if (isSharing) return;
        
        setIsSharing(true);
        
        try {
            const currentUrl = window.location.href;
            const shareTitle = event?.event_title || event?.venue_name || "Check out this property on Spoto";
            const shareText = `Check out this amazing property: ${shareTitle}`;
            
            // Check if Web Share API is supported (mobile devices)
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: currentUrl,
                });
                toast.success("Shared successfully!");
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(currentUrl);
                toast.success("Link copied to clipboard!");
            }
        } catch (error) {
            console.error("Error sharing:", error);
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
            } catch (clipboardError) {
                toast.error("Unable to share. Please copy the URL manually.");
            }
        } finally {
            setIsSharing(false);
        }
    };

    const handleSave = () => {
        if (event) {
            toggleWishlist(event.id);
        }
    };

    const handleViewAllPhotos = () => {
        setShowAllPhotos(true);
        setCurrentPhotoIndex(0);
    };

    const handleCloseGallery = () => {
        setShowAllPhotos(false);
    };

    const handleNextPhoto = () => {
        setCurrentPhotoIndex((prev) => (prev + 1) % allGalleryImages.length);
    };

    const handlePrevPhoto = () => {
        setCurrentPhotoIndex((prev) => 
            prev === 0 ? allGalleryImages.length - 1 : prev - 1
        );
    };

    // Touch swipe handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;
        
        const swipeDistance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50; // Minimum swipe distance in pixels
        
        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                // Swiped left - next photo
                handleNextPhoto();
            } else {
                // Swiped right - previous photo
                handlePrevPhoto();
            }
        }
        
        // Reset touch positions
        touchStartX.current = null;
        touchEndX.current = null;
    };

    // Keyboard navigation and body scroll lock
    useEffect(() => {
        if (!showAllPhotos) return;

        // Lock body scroll
        document.body.style.overflow = 'hidden';

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseGallery();
            } else if (e.key === 'ArrowRight') {
                handleNextPhoto();
            } else if (e.key === 'ArrowLeft') {
                handlePrevPhoto();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            // Unlock body scroll
            document.body.style.overflow = 'unset';
        };
    }, [showAllPhotos, currentPhotoIndex]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="w-full bg-white">
            {/* Header with Title and Actions - Mobile Optimized */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-6 gap-3 sm:gap-0">
                    <h1 className="text-base sm:text-2xl lg:text-3xl font-semibold text-gray-900 leading-tight line-clamp-2">
                        {event?.event_title || event?.venue_name || "Property Details"}
                    </h1>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition ${
                                isSharing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <Share2 size={16} className={`sm:w-5 sm:h-5 ${isSharing ? 'animate-pulse' : ''}`} />
                            <span className="hidden sm:inline">
                                {isSharing ? 'Sharing...' : 'Share'}
                            </span>
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            <Heart
                                size={16}
                                className={`sm:w-5 sm:h-5 ${
                                    isSaved ? "fill-red-500 text-red-500" : ""
                                }`}
                            />
                            <span className="hidden sm:inline">
                                Save
                            </span>
                        </button>
                    </div>
                </div>

                {/* Gallery Grid - Mobile Optimized */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2 md:gap-4 rounded-lg md:rounded-2xl overflow-hidden">
                    {/* Large Image - Full width on mobile */}
                    <div 
                        className="md:col-span-2 relative h-56 sm:h-64 md:h-80 min-h-56 cursor-pointer"
                        onClick={() => {
                            setCurrentPhotoIndex(0);
                            handleViewAllPhotos();
                        }}
                    >
                        <Image
                            src={galleryImages[0].src}
                            alt={galleryImages[0].alt}
                            fill
                            className="object-cover rounded-lg md:rounded-2xl"
                            priority
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
                        />
                    </div>

                    {/* Right Side Images - 2x2 Grid (Hidden on very small mobile) */}
                    <div className="md:col-span-1 grid grid-cols-2 gap-1 sm:gap-2 md:gap-4">
                        {/* Top Row */}
                        <div 
                            className="relative h-20 sm:h-28 md:h-36 cursor-pointer"
                            onClick={() => {
                                setCurrentPhotoIndex(1);
                                handleViewAllPhotos();
                            }}
                        >
                            <Image
                                src={galleryImages[1].src}
                                alt={galleryImages[1].alt}
                                fill
                                className="object-cover rounded-lg md:rounded-2xl"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                        </div>

                        <div 
                            className="relative h-20 sm:h-28 md:h-36 cursor-pointer"
                            onClick={() => {
                                setCurrentPhotoIndex(2);
                                handleViewAllPhotos();
                            }}
                        >
                            <Image
                                src={galleryImages[2].src}
                                alt={galleryImages[2].alt}
                                fill
                                className="object-cover rounded-lg md:rounded-2xl"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                        </div>

                        {/* Bottom Row */}
                        <div 
                            className="relative h-20 sm:h-28 md:h-36 cursor-pointer"
                            onClick={() => {
                                setCurrentPhotoIndex(3);
                                handleViewAllPhotos();
                            }}
                        >
                            <Image
                                src={galleryImages[3].src}
                                alt={galleryImages[3].alt}
                                fill
                                className="object-cover rounded-lg md:rounded-2xl"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                        </div>

                        {/* Image 5 with "View all photos" overlay */}
                        <div 
                            className="relative h-20 sm:h-28 md:h-36 group cursor-pointer"
                            onClick={() => {
                                setCurrentPhotoIndex(4);
                                handleViewAllPhotos();
                            }}
                        >
                            <Image
                                src={galleryImages[4].src}
                                alt={galleryImages[4].alt}
                                fill
                                className="object-cover rounded-lg md:rounded-2xl"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-lg md:rounded-2xl flex items-center justify-center group-hover:bg-black/50 transition-all">
                                <button className="bg-white text-gray-900 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-md sm:rounded-lg font-semibold hover:bg-gray-100 transition text-[10px] sm:text-xs md:text-sm pointer-events-none">
                                    View all
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full-Screen Photo Gallery Modal */}
            {showAllPhotos && (
                <div className="fixed inset-0 z-[9999] bg-black flex flex-col" style={{ margin: 0, padding: 0 }}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 md:p-6 bg-black border-b border-gray-800">
                        <button
                            onClick={handleCloseGallery}
                            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
                            aria-label="Close gallery"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm font-medium">Close</span>
                        </button>
                        <div className="text-white text-sm font-medium">
                            {currentPhotoIndex + 1} / {allGalleryImages.length}
                        </div>
                    </div>

                    {/* Photo Viewer */}
                    <div 
                        className="flex-1 relative w-full h-full min-h-0 flex items-center justify-center bg-black touch-pan-x"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="relative w-full h-full max-w-7xl mx-auto p-4 md:p-8">
                            <img
                                src={allGalleryImages[currentPhotoIndex].src}
                                alt={allGalleryImages[currentPhotoIndex].alt}
                                className="w-full h-full object-contain pointer-events-none select-none"
                                style={{ maxHeight: '100%', maxWidth: '100%' }}
                            />
                        </div>

                        {/* Navigation Buttons */}
                        {allGalleryImages.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevPhoto}
                                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-20"
                                    aria-label="Previous photo"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleNextPhoto}
                                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-20"
                                    aria-label="Next photo"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="bg-black border-t border-gray-800 p-3 md:p-4 overflow-x-auto">
                        <div className="flex gap-2 justify-start md:justify-center min-w-min mx-auto">
                            {allGalleryImages.map((image, index) => (
                                <button
                                    key={image.id}
                                    onClick={() => setCurrentPhotoIndex(index)}
                                    className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                        index === currentPhotoIndex
                                            ? 'border-white scale-110'
                                            : 'border-gray-700 opacity-60 hover:opacity-100 hover:border-gray-500'
                                    }`}
                                >
                                    <img
                                        src={image.src}
                                        alt={image.alt}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingGallery;
