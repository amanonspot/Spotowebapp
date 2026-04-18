import React, { useState } from "react";
import { Event } from "@/lib/api/types";
import { useFeatures } from "@/lib/hooks";

interface FeaturesSectionProps {
    event?: Event | null;
    title?: string;
    showAllText?: string;
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
    event,
    title = "Features",
    showAllText = "Show all",
}) => {
    const [showAllModal, setShowAllModal] = useState(false);
    
    // Use dynamic data from API
    const { features: dynamicFeatures, loading, error } = useFeatures(event?.id);
    
    // Get features from event data or API
    const getFeatures = () => {
        // If we have dynamic data from API, use it
        if (dynamicFeatures && dynamicFeatures.length > 0) {
            return dynamicFeatures.map(feature => feature.name);
        }
        
        // Fallback to event data
        if (event && event.features_keywords && event.features_keywords.length > 0) {
            return event.features_keywords.map(feature => feature.name);
        }

        // If no features found, return default ones
        return getDefaultFeatures();
    };

    const getDefaultFeatures = (): string[] => {
        return [
            "Swimming pool",
            "Garden",
            "Balcony",
            "Terrace",
            "BBQ grill",
            "Fireplace",
            "Hot tub",
            "Sauna",
            "Gym",
            "Game room",
            "Library",
            "Workspace"
        ];
    };

    const features = getFeatures();
    const totalFeatures = features.length;
    
    // Show only first 3 features by default
    const displayedFeatures = showAllModal ? features : features.slice(0, 3);

    return (
        <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4 sm:mb-6">
                {title}
            </h2>
            
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading features...</span>
                </div>
            )}
            
            {error && (
                <div className="text-red-600 text-sm mb-4">
                    Error loading features: {error}
                </div>
            )}
            
            {!loading && (
                <>
                    <div className="space-y-3">
                        {displayedFeatures.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-gray-700">{feature}</span>
                            </div>
                        ))}
                    </div>
                    
                    {totalFeatures > 3 && (
                        <button 
                            onClick={() => setShowAllModal(!showAllModal)}
                            className="mt-4 text-sm sm:text-base font-semibold text-black hover:text-gray-700 transition-colors duration-200 underline flex items-center gap-2"
                        >
                            <span>
                                {showAllModal ? 'Show less' : `${showAllText} ${totalFeatures} features`}
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

export default FeaturesSection;
