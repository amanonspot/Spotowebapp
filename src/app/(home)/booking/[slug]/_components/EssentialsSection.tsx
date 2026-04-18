import React, { useState } from "react";
import { Event } from "@/lib/api/types";
import { useEssentials } from "@/lib/hooks";

interface EssentialsSectionProps {
    event?: Event | null;
    title?: string;
    showAllText?: string;
}

const EssentialsSection: React.FC<EssentialsSectionProps> = ({
    event,
    title = "Essentials",
    showAllText = "Show all",
}) => {
    const [showAllModal, setShowAllModal] = useState(false);
    
    // Use dynamic data from API
    const { essentials: dynamicEssentials, loading, error } = useEssentials(event?.id);
    
    // Get essentials from event data or API
    const getEssentials = () => {
        // If we have dynamic data from API, use it
        if (dynamicEssentials && dynamicEssentials.length > 0) {
            return dynamicEssentials.map(essential => essential.name);
        }
        
        // Fallback to event data
        if (event && event.essentials_keywords && event.essentials_keywords.length > 0) {
            return event.essentials_keywords.map(essential => essential.name);
        }

        // If no essentials found, return default ones
        return getDefaultEssentials();
    };

    const getDefaultEssentials = (): string[] => {
        return [
            "Wifi",
            "Kitchen",
            "Free parking",
            "Air conditioning",
            "Heating",
            "Washer",
            "Dryer",
            "Hair dryer",
            "Iron",
            "TV",
            "Cable TV",
            "Laptop friendly workspace"
        ];
    };

    const essentials = getEssentials();
    const totalEssentials = essentials.length;
    
    // Show only first 3 essentials by default
    const displayedEssentials = showAllModal ? essentials : essentials.slice(0, 3);

    return (
        <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
                {title}
            </h2>
            
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-gray-600">Loading essentials...</span>
                </div>
            )}
            
            {error && (
                <div className="text-red-600 text-sm mb-4">
                    Error loading essentials: {error}
                </div>
            )}
            
            {!loading && (
                <>
                    <div className="space-y-3">
                        {displayedEssentials.map((essential, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">{essential}</span>
                            </div>
                        ))}
                    </div>
                    
                    {totalEssentials > 3 && (
                        <button 
                            onClick={() => setShowAllModal(!showAllModal)}
                            className="mt-4 text-sm sm:text-base font-semibold text-black hover:text-gray-700 transition-colors duration-200 underline flex items-center gap-2"
                        >
                            <span>
                                {showAllModal ? 'Show less' : `${showAllText} ${totalEssentials} essentials`}
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
                </>
            )}
        </div>
    );
};

export default EssentialsSection;
