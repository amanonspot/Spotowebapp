import React from "react";

const VerificationText: React.FC = () => {
    return (
        <div className="w-full">
            <p className="text-sm text-gray-600">
                We verified that this listing&apos;s location is accurate.{" "}
                <button className="text-gray-900 hover:text-gray-700 underline">
                    Learn more
                </button>
            </p>
        </div>
    );
};

export default VerificationText;
