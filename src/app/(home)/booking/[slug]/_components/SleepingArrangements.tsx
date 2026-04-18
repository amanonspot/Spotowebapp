"use client";

import React, { useState } from "react";
import BedroomCard from "./BedroomCard";

interface Bedroom {
    title: string;
    description: string;
    imageUrl?: string;
    imageAlt?: string;
}

interface SleepingArrangementsProps {
    bedrooms?: Bedroom[];
}

const SleepingArrangements: React.FC<SleepingArrangementsProps> = ({
    bedrooms = [],
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    
    if (!bedrooms || bedrooms.length === 0) {
        return null;
    }
    const itemsPerPage = 2;
    const totalPages = Math.ceil(bedrooms.length / itemsPerPage);

    const currentBedrooms = bedrooms.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrevious = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    };

    return (
        <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-black">
                    Where you&apos;ll sleep
                </h2>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="p-1.5 sm:p-2 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg
                                className="w-3 h-3 sm:w-4 sm:h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <span className="text-xs sm:text-sm text-gray-600">
                            {currentPage}/{totalPages}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="p-1.5 sm:p-2 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg
                                className="w-3 h-3 sm:w-4 sm:h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {currentBedrooms.map((bedroom, index) => (
                    <BedroomCard
                        key={index}
                        title={bedroom.title}
                        description={bedroom.description}
                        imageUrl={bedroom.imageUrl}
                        imageAlt={bedroom.imageAlt}
                    />
                ))}
            </div>
        </div>
    );
};

export default SleepingArrangements;
