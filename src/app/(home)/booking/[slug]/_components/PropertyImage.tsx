import React from "react";

interface PropertyImageProps {
    eventData?: any;
    bookingData?: any;
}

const PropertyImage: React.FC<PropertyImageProps> = ({ eventData, bookingData }) => {
    const displayImage = eventData?.event_media?.[0]?.media_file || 
                         eventData?.display_image || 
                         "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";
    
    const propertyDescription = bookingData?.property_description || 
                               eventData?.event_title || 
                               eventData?.venue_name || 
                               "Spacious rooms with washrooms and music";

    return (
        <div className="w-full">
            {/* Property Image */}
            <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden shadow-md">
                <img
                    src={displayImage}
                    alt="Property image"
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Property Description */}
            <div className="mt-4 sm:mt-5">
                <p className="text-black text-sm sm:text-base font-medium">
                    {propertyDescription}
                </p>
            </div>
        </div>
    );
};

export default PropertyImage;
