import React from "react";

interface CancellationPolicyProps {
    title?: string;
    description?: string;
}

const CancellationPolicy: React.FC<CancellationPolicyProps> = ({
    title = "Free cancellation for 48 hours",
    description = "Get a full refund if you change your mind.",
}) => {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
                <h3 className="font-bold text-black">{title}</h3>
            </div>
            <p className="text-black">{description}</p>
        </div>
    );
};

export default CancellationPolicy;
