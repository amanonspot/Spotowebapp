import React from "react";

interface ReviewCardProps {
    reviewerName: string;
    reviewerLocation?: string;
    reviewerTenure: string;
    rating: number;
    reviewDate: string;
    tripType?: string;
    reviewText: string;
    profileImageUrl?: string;
    showMore?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
    reviewerName,
    reviewerLocation,
    reviewerTenure,
    rating,
    reviewDate,
    tripType,
    reviewText,
    profileImageUrl,
    showMore = false,
}) => {
    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <svg
                key={index}
                className="w-4 h-4 text-black fill-current"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    return (
        <div className="mb-6">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {profileImageUrl ? (
                        <img
                            src={profileImageUrl}
                            alt={reviewerName}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-gray-600 font-medium text-sm">
                            {reviewerName.charAt(0)}
                        </span>
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-black">
                            {reviewerName}
                        </span>
                        {reviewerLocation && (
                            <span className="text-gray-600 text-sm">
                                {reviewerLocation}
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                        {reviewerTenure}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                            {renderStars(rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                            {reviewDate}
                        </span>
                        {tripType && (
                            <span className="text-sm text-gray-600">
                                • {tripType}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-black leading-relaxed">
                {reviewText}
                {showMore && (
                    <button className="text-black underline hover:no-underline ml-1">
                        Show more
                    </button>
                )}
            </div>
        </div>
    );
};

export default ReviewCard;
