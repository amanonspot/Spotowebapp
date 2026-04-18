"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookingSuccessModal from "../../_components/BookingSuccessModal";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showModal, setShowModal] = useState(false);
    
    // Get order_id from URL params to redirect to specific booking
    const orderId = searchParams.get('order_id');

    useEffect(() => {
        // Show the success modal after a brief delay
        const timer = setTimeout(() => {
            setShowModal(true);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handleModalClose = () => {
        setShowModal(false);
        // Redirect to specific booking details page if we have order_id
        if (orderId) {
            router.push(`/my-bookings/${orderId}`);
        } else {
            // Fallback to My Bookings list page
            router.push('/my-bookings');
        }
    };

    return (
        <div className="w-full min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing your booking...</p>
            </div>

            {/* Booking Success Modal */}
            <BookingSuccessModal 
                isOpen={showModal} 
                onClose={handleModalClose}
                orderId={orderId || undefined}
            />
        </div>
    );
}

