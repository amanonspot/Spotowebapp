import React from "react";

interface BedroomCardProps {
    title: string;
    description: string;
    imageUrl?: string;
    imageAlt?: string;
}

const BedroomCard: React.FC<BedroomCardProps> = ({
    title,
    description,
    imageUrl,
    imageAlt = "Bedroom",
}) => {
    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-100 relative">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-black mb-1">{title}</h3>
                <p className="text-gray-600 text-sm">{description}</p>
            </div>
        </div>
    );
};

export default BedroomCard;
