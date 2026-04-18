import React from "react";
import { Event } from "@/lib/api/types";

interface FeatureBadge {
    label: string;
}

interface FeatureBadgesProps {
    event?: Event | null;
}

const FeatureBadges: React.FC<FeatureBadgesProps> = ({ event }) => {
    // Get feature badges from event data
    const getFeatureBadges = (): FeatureBadge[] => {
        if (!event) {
            return getDefaultBadges();
        }

        const badges: FeatureBadge[] = [];

        // Add features from features_keywords
        if (event.features_keywords && event.features_keywords.length > 0) {
            event.features_keywords.forEach(feature => {
                badges.push({ label: feature.name });
            });
        }

        // Add property types
        if (event.property_types && event.property_types.length > 0) {
            event.property_types.forEach((type: any) => {
                badges.push({ label: type.name || type });
            });
        }

        // Add event type as a badge
        if (event.event_type) {
            if (typeof event.event_type === 'string') {
                badges.push({ label: event.event_type });
            } else if (event.event_type.type_name) {
                badges.push({ label: event.event_type.type_name });
            }
        }

        // Add venue type if available
        if (event.venue?.venue_type) {
            badges.push({ label: event.venue.venue_type });
        }

        // If no badges found, return default ones
        if (badges.length === 0) {
            return getDefaultBadges();
        }

        return badges;
    };

    const getDefaultBadges = (): FeatureBadge[] => {
        return [
            { label: "Premium Property" },
            { label: "Great Location" },
            { label: "Host Verified" },
        ];
    };

    const badges = getFeatureBadges();

    return (
        <div className="flex flex-wrap gap-3 mb-8">
            {badges.map((badge, index) => (
                <div
                    key={index}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                    {badge.label}
                </div>
            ))}
        </div>
    );
};

export default FeatureBadges;
