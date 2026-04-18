"use client";

import React, { useEffect, useRef, useState } from "react";
import { Event } from "@/lib/api/types";
import config from "@/config/config";
import { loadGooglePlacesScript } from "@/lib/utils/googlePlaces";

interface MapComponentProps {
    event?: Event | null;
    zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
    event,
    zoom = 14,
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentZoom, setCurrentZoom] = useState(zoom);

    // Get coordinates from event data
    const getCoordinates = () => {
        if (!event) {
            return { lat: 12.9716, lng: 77.5946 }; // Default to Bangalore
        }

        // Check venue coordinates first (API returns as strings, need to parse)
        // NOTE: API has lat/lng swapped - venue_latitude is actually longitude and vice versa
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
            // Latitude: -90 to 90, Longitude: -180 to 180
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                console.log('📍 Using venue coordinates (corrected):', { lat, lng });
                console.log('📍 Raw API values (swapped):', { venue_latitude: rawLat, venue_longitude: rawLng });
                return { lat, lng };
            }
        }

        // Check event coordinates
        if (event.latitude && event.longitude) {
            const lat = typeof event.latitude === 'string' 
                ? parseFloat(event.latitude)
                : event.latitude;
            const lng = typeof event.longitude === 'string'
                ? parseFloat(event.longitude)
                : event.longitude;
            
            if (!isNaN(lat) && !isNaN(lng)) {
                console.log('📍 Using event coordinates:', { lat, lng });
                return { lat, lng };
            }
        }

        // Default to Bangalore if no valid coordinates found
        console.log('📍 No valid coordinates found, using default Bangalore coordinates');
        return { lat: 12.9716, lng: 77.5946 };
    };

    const { lat, lng } = getCoordinates();

    useEffect(() => {
        if (!mapRef.current || !config.googleMapsApiKey) {
            console.warn('Map container or Google Maps API key not available');
            setIsLoading(false);
            return;
        }

        const initMap = async () => {
            try {
                // Load Google Maps script using centralized loader
                await loadGooglePlacesScript();

                // Create map instance
                const map = new google.maps.Map(mapRef.current!, {
                    center: { lat, lng },
                    zoom: zoom,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    zoomControl: false,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                });

                // Create marker for the property using brand color purple
                const propertyMarker = new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: event?.venue_name || event?.event_title || "Property Location",
                    icon: {
                        // Purple location pin icon with brand color
                        url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMjQgNEMxNi4yNyA0IDEwIDEwLjI3IDEwIDE4YzAgOS4yNSAxNCAxOSAxNCAxOXMxNC05Ljc1IDE0LTE5YzAtNy43My02LjI3LTE0LTE0LTE0em0wIDE5LjVjLTMuMDMgMC01LjUtMi40Ny01LjUtNS41czIuNDctNS41IDUuNS01LjUgNS41IDIuNDcgNS41IDUuNS0yLjQ3IDUuNS01LjUgNS41eiIgZmlsbD0iI0E2N0FFQiIvPgo8L3N2Zz4=",
                        scaledSize: new google.maps.Size(48, 48),
                        anchor: new google.maps.Point(24, 48)
                    }
                });

                markersRef.current.push(propertyMarker);

                // Create info window for property
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px; min-width: 200px;">
                            <h3 style="margin: 0 0 4px 0; font-weight: 600; color: #333;">${event?.venue_name || event?.event_title || "Property Location"}</h3>
                            <p style="margin: 0; color: #666; font-size: 14px;">${event?.venue?.venue_address || "View on map"}</p>
                        </div>
                    `
                });

                propertyMarker.addListener("click", () => {
                    infoWindow.open(map, propertyMarker);
                });

                // Add nearby points of interest with brand color
                const nearbyMarkers = [
                    {
                        position: { lat: lat + 0.001, lng: lng + 0.001 },
                        title: "Shopping Center",
                        icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNBNjdBRUIiLz4KPHBhdGggZD0iTTcgOUgxM1YxNUg3VjhMMCA4VjEySDdNMTQgOUgyMFYxNUgxNFY4TDIwIDhWMTJIMTRNMTEgMTJIMTlNMTYgOVYxNU0xMiAxNVY5TTEwIDE3SDIwTDE2IDE5SDEwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEuNSIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4="
                    },
                    {
                        position: { lat: lat - 0.001, lng: lng + 0.001 },
                        title: "Metro Station",
                        icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNBNjdBRUIiLz4KPHBhdGggZD0iTTE1IDhMMTIgMTJIOUgxNVg3SDE1IiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxNSIgeT0iMjAiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5VPC90ZXh0Pgo8L3N2Zz4="
                    }
                ];

                nearbyMarkers.forEach((markerData) => {
                    const marker = new google.maps.Marker({
                        position: markerData.position,
                        map: map,
                        title: markerData.title,
                        icon: {
                            url: markerData.icon,
                            scaledSize: new google.maps.Size(30, 30),
                            anchor: new google.maps.Point(15, 30)
                        }
                    });

                    const infoWin = new google.maps.InfoWindow({
                        content: `<div style="padding: 4px;"><strong>${markerData.title}</strong></div>`
                    });

                    marker.addListener("click", () => {
                        infoWin.open(map, marker);
                    });

                    markersRef.current.push(marker);
                });

                // Listen to zoom changes
                map.addListener("zoom_changed", () => {
                    setCurrentZoom(map.getZoom() || zoom);
                });

                mapInstanceRef.current = map;
                setIsLoading(false);
            } catch (error) {
                console.error("Error loading Google Maps:", error);
                setIsLoading(false);
            }
        };

        initMap();

        // Cleanup function
        return () => {
            markersRef.current.forEach((marker) => {
                marker.setMap(null);
            });
            markersRef.current = [];
            mapInstanceRef.current = null;
        };
    }, [lat, lng, zoom, event]);

    const handleZoomIn = () => {
        if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom() || 14;
            mapInstanceRef.current.setZoom(Math.min(currentZoom + 1, 20));
        }
    };

    const handleZoomOut = () => {
        if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom() || 14;
            mapInstanceRef.current.setZoom(Math.max(currentZoom - 1, 1));
        }
    };

    return (
        <div className="relative w-full h-72 sm:h-80 lg:h-96 rounded-lg overflow-hidden border border-gray-200 shadow-md">
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-4">
                        {/* Spinning loader */}
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-gray-300 border-t-[#AF7AEB] rounded-full animate-spin"></div>
                        </div>
                        <div className="text-gray-600 text-sm font-medium">Loading map...</div>
                    </div>
                </div>
            )}
            
            {/* Map Container */}
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Custom Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                {/* Zoom Controls */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    <button
                        onClick={handleZoomIn}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        aria-label="Zoom in"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                            <line x1="11" y1="8" x2="11" y2="14"/>
                            <line x1="8" y1="11" x2="14" y2="11"/>
                        </svg>
                    </button>
                    <div className="border-t border-gray-200">
                        <button
                            onClick={handleZoomOut}
                            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            aria-label="Zoom out"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                                <line x1="8" y1="11" x2="14" y2="11"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Zoom Level Display */}
            <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-lg shadow-lg border border-gray-200 text-sm text-gray-600">
                Zoom: {currentZoom}
            </div>
        </div>
    );
};

export default MapComponent;
