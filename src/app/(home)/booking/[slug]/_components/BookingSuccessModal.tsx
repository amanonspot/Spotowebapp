"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface BookingSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId?: string;
}

const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({ isOpen, onClose, orderId }) => {
    const router = useRouter();
    const [countdown, setCountdown] = React.useState(5);

    // Reset countdown when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setCountdown(5);
        }
    }, [isOpen]);

    // Auto-redirect to My Bookings after 5 seconds
    React.useEffect(() => {
        if (!isOpen) return;

        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    // Auto-redirect to My Bookings
                    onClose();
                    if (orderId) {
                        router.push(`/my-bookings/${orderId}`);
                    } else {
                        router.push('/my-bookings');
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [isOpen, orderId, onClose, router]);

    if (!isOpen) return null;

    const handleGoToMyBookings = () => {
        onClose();
        // Go to specific booking details page if we have orderId
        if (orderId) {
            router.push(`/my-bookings/${orderId}`);
        } else {
            router.push('/my-bookings');
        }
    };

    const handleGoHome = () => {
        onClose();
        router.push('/');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fadeInSlideDown">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg 
                            className="w-10 h-10 text-white" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M5 13l4 4L19 7" 
                            />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                    Booking Submitted!
                </h2>

                {/* Message */}
                <div className="text-center space-y-4 mb-6">
                    <p className="text-gray-700 leading-relaxed">
                        Your payment has been completed and booking has been submitted successfully!
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                        Your booking is now waiting for confirmation from the admin.
                    </p>
                    
                    {/* Countdown with Progress Bar */}
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                            Redirecting to <span className="font-semibold text-[#A67AEB]">My Bookings</span> in <span className="font-bold text-[#A67AEB]">{countdown}</span> seconds...
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] transition-all duration-1000 ease-linear"
                                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleGoToMyBookings}
                        style={{ backgroundColor: '#A67AEB' }}
                        className="w-full text-white py-3.5 px-6 rounded-lg font-bold hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        Go to My Bookings Now
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200"
                    >
                        Back to Home
                    </button>
                </div>

                {/* Info Note */}
                <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 text-center">
                        <strong>Note:</strong> You will receive a confirmation email once the admin approves your booking.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccessModal;


