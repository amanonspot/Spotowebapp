import React from "react";

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
}

interface ShowAllReviewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reviews: Review[];
    overallRating: number;
    totalReviews: number;
}

const ShowAllReviewsModal: React.FC<ShowAllReviewsModalProps> = ({
    isOpen,
    onClose,
    reviews,
    overallRating,
    totalReviews
}) => {
    if (!isOpen) return null;

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <svg
                key={index}
                className={`w-4 h-4 ${
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-black">
                            All Reviews
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                                {renderStars(Math.floor(overallRating))}
                            </div>
                            <span className="text-xl font-bold text-black">
                                {overallRating}
                            </span>
                            <span className="text-sm text-black">
                                · {totalReviews} reviews
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                    >
                        ×
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                                {/* Reviewer Info */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-gray-600 font-semibold text-sm">
                                            {review.reviewerName.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-black">
                                            {review.reviewerName}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {review.reviewerTenure}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 mb-1">
                                            {renderStars(review.rating)}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {review.reviewDate}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Review Content */}
                                <div className="text-gray-700 leading-relaxed">
                                    {review.reviewText}
                                </div>
                                
                                {/* Trip Type */}
                                {review.tripType && (
                                    <div className="mt-3 text-sm text-gray-500">
                                        {review.tripType}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="text-center text-sm text-gray-600">
                        Showing all {totalReviews} reviews
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShowAllReviewsModal;
