import React, { useState } from "react";
import RatingBreakdown from "./RatingBreakdown";
import ReviewCard from "./ReviewCard";
import ShowAllReviewsModal from "./ShowAllReviewsModal";
import { useReviews } from "@/lib/hooks";

interface Review {
    id: string;
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

interface ReviewsSectionProps {
    eventId?: string;
    overallRating?: number;
    totalReviews?: number;
    reviews?: Review[];
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
    eventId,
    overallRating: propOverallRating,
    totalReviews: propTotalReviews,
    reviews: propReviews,
}) => {
    const [showAllModal, setShowAllModal] = useState(false);
    
    // Use dynamic data from API
    const { 
        reviews: dynamicReviews, 
        overallRating: dynamicOverallRating, 
        totalReviews: dynamicTotalReviews, 
        loading, 
        error 
    } = useReviews(eventId);
    
    // Use dynamic data if available, otherwise fall back to props or defaults
    const reviews = dynamicReviews.length > 0 ? dynamicReviews : propReviews || [];
    const overallRating = dynamicOverallRating || propOverallRating || 4.9;
    const totalReviews = dynamicTotalReviews || propTotalReviews || 366;

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <svg
                key={index}
                className={`w-5 h-5 ${
                    index < rating ? "text-yellow-400" : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    return (
        <div className="mb-6 sm:mb-8">
            {/* Overall Rating */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4">
                    Reviews
                </h2>
                
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                        <span className="ml-2 text-gray-600">Loading reviews...</span>
                    </div>
                )}
                
                {error && (
                    <div className="text-red-600 text-sm mb-4">
                        Error loading reviews: {error}
                    </div>
                )}
                
                {!loading && reviews.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div className="flex items-center gap-1">
                            {renderStars(Math.floor(overallRating))}
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-black">
                            {overallRating}
                        </span>
                        <span className="text-sm sm:text-base text-black">
                            · {totalReviews} reviews
                        </span>
                    </div>
                )}
                
                {!loading && reviews.length === 0 && (
                    <div className="text-gray-600 text-sm">
                        No reviews yet for this property.
                    </div>
                )}
            </div>

            {/* Rating Breakdown - only show if there are reviews */}
            {!loading && reviews.length > 0 && <RatingBreakdown />}

            {/* Individual Reviews - only show if there are reviews */}
            {!loading && reviews.length > 0 && (
                <div className="mb-8 sm:mb-10">
                    <h3 className="text-base sm:text-lg font-semibold text-black mb-6 sm:mb-8">
                        Recent reviews
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        {reviews.slice(0, 6).map((review) => (
                            <ReviewCard
                                key={review.id}
                                reviewerName={review.reviewerName}
                                reviewerLocation={review.reviewerLocation}
                                reviewerTenure={review.reviewerTenure}
                                rating={review.rating}
                                reviewDate={review.reviewDate}
                                tripType={review.tripType}
                                reviewText={review.reviewText}
                                profileImageUrl={review.profileImageUrl}
                                showMore={review.showMore}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Show All Reviews Button - only show if there are more than 6 reviews */}
            {!loading && reviews.length > 6 && (
                <div className="flex justify-start mt-8">
                    <button 
                        onClick={() => setShowAllModal(true)}
                        className="text-sm sm:text-base text-black underline hover:no-underline font-medium"
                    >
                        Show all {totalReviews} reviews
                    </button>
                </div>
            )}
            
            {/* Show All Reviews Modal */}
            <ShowAllReviewsModal
                isOpen={showAllModal}
                onClose={() => setShowAllModal(false)}
                reviews={reviews}
                overallRating={overallRating}
                totalReviews={totalReviews}
            />
        </div>
    );
};

export default ReviewsSection;
