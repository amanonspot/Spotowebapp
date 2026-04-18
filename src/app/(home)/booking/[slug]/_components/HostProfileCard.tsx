import React from "react";

interface HostProfileCardProps {
    hostName?: string;
    profileImageUrl?: string;
    reviewCount?: number;
    rating?: number;
    hostingYears?: number;
    isSuperhost?: boolean;
}

const HostProfileCard: React.FC<HostProfileCardProps> = ({
    hostName = "Aman Sohail",
    profileImageUrl,
    reviewCount = 3947,
    rating = 4.87,
    hostingYears = 7,
    isSuperhost = true,
}) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col items-center text-center">
                {/* Profile Picture with Verification Badge */}
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {profileImageUrl ? (
                            <img
                                src={profileImageUrl}
                                alt={hostName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-gray-600 font-medium text-2xl">
                                {hostName.charAt(0)}
                            </span>
                        )}
                    </div>
                    {/* Verification Badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                        <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>

                {/* Host Name */}
                <h3 className="text-xl font-bold text-black mb-2">
                    {hostName}
                </h3>

                {/* Superhost Badge */}
                {isSuperhost && (
                    <div className="flex items-center gap-1 mb-4">
                        <svg
                            className="w-4 h-4 text-black fill-current"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-black">
                            Superhost
                        </span>
                    </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 w-full">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-black">
                            {reviewCount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Reviews</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-lg font-semibold text-black">
                                {rating}
                            </span>
                            <svg
                                className="w-4 h-4 text-black fill-current"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                        <div className="text-sm text-gray-600">Rating</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-black">
                            {hostingYears}
                        </div>
                        <div className="text-sm text-gray-600">
                            Years hosting
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HostProfileCard;
