import React from "react";

interface FeaturedInProps {
    title?: string;
    items?: string[];
}

const FeaturedIn: React.FC<FeaturedInProps> = ({
    title = "Featured in",
    items = ["treehousetrippers, November 2022", "florb, March 2025"],
}) => {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <svg
                    className="w-5 h-5 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                </svg>
                <h3 className="font-bold text-black">{title}</h3>
            </div>
            <div className="space-y-1">
                {items.map((item, index) => (
                    <div key={index} className="text-black">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeaturedIn;
