import React from "react";

interface RatingCategory {
    name: string;
    rating: number;
    icon: React.ReactNode;
}

interface RatingBreakdownProps {
    categories?: RatingCategory[];
    starDistribution?: { stars: number; count: number; percentage: number }[];
}

const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
    categories = [
        {
            name: "Cleanliness",
            rating: 4.9,
            icon: (
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                </svg>
            ),
        },
        {
            name: "Accuracy",
            rating: 4.8,
            icon: (
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
        },
        {
            name: "Check-in",
            rating: 5.0,
            icon: (
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                </svg>
            ),
        },
        {
            name: "Communication",
            rating: 4.9,
            icon: (
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            ),
        },
        {
            name: "Location",
            rating: 4.9,
            icon: (
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            ),
        },
        {
            name: "Value",
            rating: 4.6,
            icon: (
                <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                </svg>
            ),
        },
    ],
    starDistribution = [
        { stars: 5, count: 320, percentage: 87 },
        { stars: 4, count: 35, percentage: 10 },
        { stars: 3, count: 8, percentage: 2 },
        { stars: 2, count: 2, percentage: 1 },
        { stars: 1, count: 1, percentage: 0 },
    ],
}) => {
    return (
        <div className="mb-8">
            {/* Star Distribution */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-black mb-4">
                    Rating breakdown
                </h3>
                <div className="space-y-2">
                    {starDistribution.map((item) => (
                        <div
                            key={item.stars}
                            className="flex items-center gap-3"
                        >
                            <span className="text-sm text-black w-8">
                                {item.stars}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-black h-2 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">
                                {item.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Ratings */}
            <div>
                <h3 className="text-lg font-semibold text-black mb-4">
                    Detailed ratings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((category, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <div className="text-black">
                                    {category.icon}
                                </div>
                                <span className="text-black">
                                    {category.name}
                                </span>
                            </div>
                            <span className="text-black font-medium">
                                {category.rating}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RatingBreakdown;
