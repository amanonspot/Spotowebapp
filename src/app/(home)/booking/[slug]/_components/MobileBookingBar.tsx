"use client";
import React, { useState, useMemo } from "react";
import BookingCard from "./BookingCard";

interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface MobileBookingBarProps {
    slug: string;
    event: any;
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
    onGuestCountChange?: (count: number) => void;
    price?: string;
    nights?: number;
}

export default function MobileBookingBar({
    slug,
    event,
    dateRange,
    onDateRangeChange,
    onGuestCountChange,
    price,
    nights,
}: MobileBookingBarProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate proper pricing with service fees and taxes from billing_info
    const calculatedPricing = useMemo(() => {
        const rawPrice = parseFloat(price || event?.event_price || event?.price || "0");
        const numberOfNights = nights || 1;
        
        // Calculate base price (price * nights)
        const basePrice = rawPrice * numberOfNights;
        
        // Get dynamic fees and taxes from event billing_info
        const billingInfo = event?.billing_info;
        const platformFeePercentage = billingInfo?.fees?.platform_fee?.percentage || 5.0;
        const gstPercentage = billingInfo?.taxes?.gst_tier_info?.gst_percentage || 0.0;
        
        // Calculate service fee and taxes using dynamic percentages
        const serviceFee = Math.round(basePrice * (platformFeePercentage / 100));
        const taxes = Math.round(basePrice * (gstPercentage / 100));
        const total = basePrice + serviceFee + taxes;
        
        return {
            basePrice,
            serviceFee,
            taxes,
            total,
            nights: numberOfNights,
            platformFeePercentage,
            gstPercentage
        };
    }, [price, event, nights]);

    const displayNights = calculatedPricing.nights;

    const handleReserveClick = () => {
        // Scroll to booking card on desktop, open modal on mobile
        const bookingCard = document.getElementById("booking-card");
        if (bookingCard && window.innerWidth >= 1024) {
            bookingCard.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            {/* Fixed Bottom Bar - Mobile Only */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 lg:hidden shadow-lg">
                <div className="flex items-center justify-between gap-4">
                    {/* Price Section */}
                    <div className="flex-1">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-black">
                                    ₹{calculatedPricing.total.toLocaleString('en-IN')}
                                </span>
                                <span className="text-xs text-gray-500">total</span>
                            </div>
                            <div className="text-xs text-gray-600">
                                ₹{calculatedPricing.basePrice.toLocaleString('en-IN')} × {displayNights} {displayNights === 1 ? "night" : "nights"} + fees
                            </div>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-sm text-purple-600 font-semibold hover:text-purple-700 underline mt-1"
                        >
                            Show breakdown
                        </button>
                    </div>

                    {/* Reserve Button - Brand Color */}
                    <button
                        onClick={handleReserveClick}
                        style={{ backgroundColor: '#A67AEB' }}
                        className="text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:opacity-90 whitespace-nowrap"
                    >
                        Reserve
                    </button>
                </div>
            </div>

            {/* Booking Card Modal - Mobile Only */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
                        {/* Header with Close Button */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between rounded-t-3xl z-10">
                            <h3 className="text-lg font-bold text-black">
                                Booking Details
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                aria-label="Close"
                            >
                                <svg
                                    className="w-6 h-6 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Booking Card Content */}
                        <div className="px-4 py-6">
                            <BookingCard
                                slug={slug}
                                event={event}
                                dateRange={dateRange}
                                onDateRangeChange={onDateRangeChange}
                                onGuestCountChange={onGuestCountChange}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Add slide-up animation */}
            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
}


