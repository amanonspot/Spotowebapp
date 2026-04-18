import React from "react";

interface PriceDetailsProps {
    bookingData?: any;
}

const PriceDetails: React.FC<PriceDetailsProps> = ({ bookingData }) => {
    // NO HARDCODED VALUES - Use only actual booking data
    const basePrice = bookingData?.base_price || 0;
    const serviceFee = bookingData?.service_fee || 0;
    const taxes = bookingData?.taxes || 0;
    const total = bookingData?.total || 0;

    // Log pricing details for debugging
    console.log('💰 PriceDetails component - bookingData:', bookingData);
    console.log('💰 PriceDetails - Displaying:', {
        basePrice,
        serviceFee,
        taxes,
        total
    });
    
    // Check if pricing data is missing or invalid
    const isPricingMissing = !bookingData || total === 0;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
            <h3 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6">
                Price Details
            </h3>
            
            {isPricingMissing && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-red-800">
                            <p className="font-semibold">Pricing Data Missing</p>
                            <p>Pricing information is not available. Please start the booking again from the property page.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="border-t border-gray-200 pt-4 sm:pt-6">
                {/* Price breakdown items */}
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-600">Base price</span>
                        <span className="text-black font-medium">{formatPrice(basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-600">Service fee</span>
                        <span className="text-black font-medium">{formatPrice(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-600">Taxes</span>
                        <span className="text-black font-medium">{formatPrice(taxes)}</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
                    <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-semibold text-black">
                            Total (INR)
                        </span>
                        <span className="text-base sm:text-lg font-bold text-black">
                            {formatPrice(total)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceDetails;
