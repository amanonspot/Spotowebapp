"use client";
import React, { useState, useEffect } from "react";
import { Event } from "@/lib/api/types";

interface PropertyDetailsProps {
    event?: Event | null;
    truncateLength?: number;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({
    event,
    truncateLength = 300,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isModalOpen]);
    if (!event) {
        return null;
    }

    const getPropertyType = () => {
        if (event.property_types && event.property_types.length > 0) {
            return event.property_types
                .map((type: any) => type.name || type)
                .join(", ");
        }
        return "Property";
    };

    const getEventType = () => {
        if (typeof event.event_type === "string") {
            return event.event_type;
        } else if (event.event_type?.type_name) {
            return event.event_type.type_name;
        }
        return "Event";
    };

    const getVenueDetails = () => {
        if (!event.venue) return null;

        return {
            name: event.venue.venue_name || "Venue",
            type: event.venue.venue_type || "Venue",
            address: event.venue.venue_address || "Address not available",
            capacity: event.venue.venue_capacity || "Capacity not specified",
        };
    };

    const getSpaceInfo = () => {
        if (
            !event.space_info_keywords ||
            event.space_info_keywords.length === 0
        ) {
            return null;
        }

        return event.space_info_keywords.map((space) => space.name).join(", ");
    };

    const getPaxInfo = () => {
        if (!event.pax_size_keywords || event.pax_size_keywords.length === 0) {
            return null;
        }

        return event.pax_size_keywords.map((pax) => pax.name).join(", ");
    };

    const venueDetails = getVenueDetails();
    const spaceInfo = getSpaceInfo();
    const paxInfo = getPaxInfo();

    return (
        <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-6">
                Property Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Type & Event Type */}
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                            Property Type
                        </h3>
                        <p className="text-gray-700">{getPropertyType()}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                            Event Type
                        </h3>
                        <p className="text-gray-700">{getEventType()}</p>
                    </div>

                    {spaceInfo && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Space Information
                            </h3>
                            <p className="text-gray-700">{spaceInfo}</p>
                        </div>
                    )}

                    {paxInfo && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Guest Capacity
                            </h3>
                            <p className="text-gray-700">{paxInfo}</p>
                        </div>
                    )}
                </div>

                {/* Venue Details */}
                {venueDetails && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Venue Name
                            </h3>
                            <p className="text-gray-700">{venueDetails.name}</p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Venue Type
                            </h3>
                            <p className="text-gray-700">{venueDetails.type}</p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Address
                            </h3>
                            <p className="text-gray-700">
                                {venueDetails.address}
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Capacity
                            </h3>
                            <p className="text-gray-700">
                                {venueDetails.capacity}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {event.event_details && (
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                        Stay Description
                    </h3>
                    {(() => {
                        const description = event.event_details;
                        const isLongText = description.length > truncateLength;
                        const truncatedText = isLongText
                            ? description.substring(0, truncateLength).trim() +
                              "..."
                            : description;

                        return (
                            <>
                                <p className="text-gray-700 whitespace-pre-line">
                                    {truncatedText}
                                </p>
                                {isLongText && (
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="text-black hover:text-gray-700 transition-colors duration-200 cursor-pointer font-semibold mt-2"
                                    >
                                        Show more &gt;
                                    </button>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}

            {/* Description Modal */}
            {isModalOpen && event.event_details && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 h-screen"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-black">
                                Stay Description
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                aria-label="Close"
                            >
                                <svg
                                    className="w-5 h-5 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6 overflow-y-auto">
                            <p className="text-black leading-relaxed whitespace-pre-line">
                                {event.event_details}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                            >
                                {typeof tag === "string" ? tag : tag.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyDetails;
