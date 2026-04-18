import React from "react";
import { Event } from "@/lib/api/types";
import { MapPin } from "lucide-react";

interface LocationSectionProps {
    event?: Event | null;
}

const LocationSection: React.FC<LocationSectionProps> = ({ event }) => {
    const getLocationString = () => {
        if (!event?.location) {
            return "Port Angeles, Washington, United States";
        }

        const { location_city, location_state, location_country } = event.location;
        const parts = [location_city, location_state, location_country].filter(Boolean);
        return parts.join(", ");
    };

    // Get coordinates from event data (same logic as MapComponent)
    const getCoordinates = () => {
        if (!event) {
            return null;
        }

        // Check venue coordinates first (API has them swapped)
        if (event.venue?.venue_latitude && event.venue?.venue_longitude) {
            const rawLat = typeof event.venue.venue_latitude === 'string' 
                ? parseFloat(event.venue.venue_latitude)
                : event.venue.venue_latitude;
            const rawLng = typeof event.venue.venue_longitude === 'string'
                ? parseFloat(event.venue.venue_longitude)
                : event.venue.venue_longitude;
            
            // IMPORTANT: The API has these swapped, so we need to correct them
            // venue_latitude in API is actually longitude, venue_longitude is actually latitude
            const lat = rawLng;  // Use venue_longitude as latitude
            const lng = rawLat;  // Use venue_latitude as longitude
            
            // Validate coordinates are valid numbers and in correct ranges
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat, lng };
            }
        }

        // Check event coordinates (these should be correct, not swapped)
        if (event.latitude && event.longitude) {
            const lat = typeof event.latitude === 'string' 
                ? parseFloat(event.latitude)
                : event.latitude;
            const lng = typeof event.longitude === 'string'
                ? parseFloat(event.longitude)
                : event.longitude;
            
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat, lng };
            }
        }

        return null;
    };

    const handleLocationClick = () => {
        const coords = getCoordinates();
        if (coords) {
            // Open Google Maps directions
            const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
            window.open(url, '_blank');
        } else {
            // Fallback: use location string for search
            const searchQuery = encodeURIComponent(getLocationString());
            const url = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
            window.open(url, '_blank');
        }
    };

    return (
        <div className="w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Where you&apos;ll be
            </h2>
            <button
                onClick={handleLocationClick}
                className="flex items-center gap-2 text-base sm:text-lg text-gray-700 mb-4 sm:mb-6 hover:text-[#AF7AEB] transition-colors group"
            >
                <MapPin className="w-5 h-5 text-[#AF7AEB] group-hover:scale-110 transition-transform" />
                <span className="underline decoration-dotted">{getLocationString()}</span>
            </button>
        </div>
    );
};

export default LocationSection;
