import React from "react";

interface TripDetailsProps {
    bookingData?: any;
    eventData?: any;
}

const TripDetails: React.FC<TripDetailsProps> = ({ bookingData, eventData }) => {
    const hostName = bookingData?.host || eventData?.venue_name || 'Host';
    const propertyDescription = bookingData?.property_description || eventData?.event_title || 'Private room in home hosted by Aman';
    const dates = bookingData?.dates || '6-7 March';
    const guests = bookingData?.guests || 2;

    return (
        <div className="border-b border-gray-200 pb-6 sm:pb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-black mb-4 sm:mb-6">
                Your trip
            </h2>

            <div className="space-y-4 sm:space-y-5">
                {/* Property Description */}
                <div>
                    <p className="text-black font-medium text-sm sm:text-base">
                        {propertyDescription}
                    </p>
                </div>

                {/* Dates */}
                <div>
                    <p className="text-sm text-gray-600 mb-1">Dates</p>
                    <p className="text-black font-medium text-sm sm:text-base">
                        {dates}
                    </p>
                </div>

                {/* Guests */}
                <div>
                    <p className="text-sm text-gray-600 mb-1">Guests</p>
                    <p className="text-black font-medium text-sm sm:text-base">
                        {guests} {guests === 1 ? 'guest' : 'guests'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TripDetails;
