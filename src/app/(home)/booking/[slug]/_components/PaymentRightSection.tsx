import React from "react";
import PropertyImage from "./PropertyImage";
import PriceDetails from "./PriceDetails";

interface PaymentRightSectionProps {
    bookingData?: any;
    eventData?: any;
}

const PaymentRightSection: React.FC<PaymentRightSectionProps> = ({ bookingData, eventData }) => {
    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Property Image */}
            <PropertyImage eventData={eventData} bookingData={bookingData} />

            {/* Price Details */}
            <PriceDetails bookingData={bookingData} />
        </div>
    );
};

export default PaymentRightSection;
