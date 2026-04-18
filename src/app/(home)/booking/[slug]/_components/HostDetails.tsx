import React from "react";

interface HostDetailsProps {
    birthDecade?: string;
    education?: string;
    description?: string;
}

const HostDetails: React.FC<HostDetailsProps> = ({
    birthDecade,
    education,
    description,
}) => {
    // Only render if there's at least some data
    if (!birthDecade && !education && !description) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Birth Date */}
            {birthDecade && (
                <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="text-black">{birthDecade}</span>
                </div>
            )}

            {/* Education */}
            {education && (
                <div className="flex items-center gap-2">
                    <svg
                        className="w-4 h-4 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                    </svg>
                    <span className="text-black">{education}</span>
                </div>
            )}

            {/* Personal Description */}
            {description && (
                <div className="text-black leading-relaxed">
                    <p>{description}</p>
                    <button className="text-black underline hover:no-underline mt-2">
                        Show more &gt;
                    </button>
                </div>
            )}
        </div>
    );
};

export default HostDetails;
