import React, { useState } from "react";
import AmenityItem from "./AmenityItem";
import { Event } from "@/lib/api/types";

interface Amenity {
    icon: React.ReactNode;
    label: string;
}

interface AmenitiesSectionProps {
    event?: Event | null;
    title?: string;
    showAllText?: string;
}

const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
    event,
    title = "What this place offers",
    showAllText = "Show all",
}) => {
    const [showAllModal, setShowAllModal] = useState(false);

    // Get amenities from event data
    const getAmenities = (): Amenity[] => {
        if (!event) {
            return getDefaultAmenities();
        }

        const amenities: Amenity[] = [];

        // Add amenities from amenities_keywords
        if (event.amenities_keywords && event.amenities_keywords.length > 0) {
            event.amenities_keywords.forEach(amenity => {
                amenities.push({
                    icon: getAmenityIcon(amenity.name),
                    label: amenity.name,
                });
            });
        }

        // Add features from features_keywords
        if (event.features_keywords && event.features_keywords.length > 0) {
            event.features_keywords.forEach(feature => {
                amenities.push({
                    icon: getAmenityIcon(feature.name),
                    label: feature.name,
                });
            });
        }

        // Add essentials from essentials_keywords
        if (event.essentials_keywords && event.essentials_keywords.length > 0) {
            event.essentials_keywords.forEach(essential => {
                amenities.push({
                    icon: getAmenityIcon(essential.name),
                    label: essential.name,
                });
            });
        }

        // If no amenities found, return default ones
        if (amenities.length === 0) {
            return getDefaultAmenities();
        }

        return amenities;
    };

    const getAmenityIcon = (amenityName: string): React.ReactNode => {
        const name = amenityName.toLowerCase();
        
        if (name.includes('wifi') || name.includes('internet')) {
            return (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
            );
        }
        
        if (name.includes('parking')) {
            return (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
            );
        }
        
        if (name.includes('kitchen')) {
            return (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
            );
        }
        
        // Default icon
        return (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        );
    };

    const getDefaultAmenities = (): Amenity[] => {
        return [
            {
                icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                ),
                label: "Wifi",
            },
            {
                icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                ),
                label: "Free parking",
            },
            {
                icon: (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                ),
                label: "Kitchen",
            },
        ];
    };

    const amenities = getAmenities();
    const totalAmenities = amenities.length;
    
    // Show only first 3 amenities by default
    const displayedAmenities = showAllModal ? amenities : amenities.slice(0, 3);

    return (
        <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
                {title}
            </h2>
            <div className="space-y-3">
                {displayedAmenities.map((amenity, index) => (
                    <AmenityItem
                        key={index}
                        icon={amenity.icon}
                        label={amenity.label}
                    />
                ))}
            </div>
            
            {totalAmenities > 3 && (
                <button 
                    onClick={() => setShowAllModal(!showAllModal)}
                    className="mt-4 text-sm sm:text-base font-semibold text-black hover:text-gray-700 transition-colors duration-200 underline flex items-center gap-2"
                >
                    <span>
                        {showAllModal ? 'Show less' : `${showAllText} ${totalAmenities} amenities`}
                    </span>
                    <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${showAllModal ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default AmenitiesSection;
