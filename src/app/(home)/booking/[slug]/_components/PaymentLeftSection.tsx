import React from "react";
import TripDetails from "./TripDetails";
import ConfirmPayButton from "./ConfirmPayButton";

interface PaymentLeftSectionProps {
    bookingData?: any;
    eventData?: any;
    orderId?: string;
}

const PaymentLeftSection: React.FC<PaymentLeftSectionProps> = ({ bookingData, eventData, orderId }) => {
    return (
        <div className="space-y-8 sm:space-y-10">
            {/* Confirm and Pay Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-2">
                    Review and confirm
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                    Review your booking details before confirming your reservation
                </p>
            </div>

            {/* Trip Details */}
            <TripDetails bookingData={bookingData} eventData={eventData} />

            {/* Confirm and Pay Button - Payment options removed as requested */}
            <ConfirmPayButton bookingData={bookingData} orderId={orderId} />
        </div>
    );
};

export default PaymentLeftSection;
