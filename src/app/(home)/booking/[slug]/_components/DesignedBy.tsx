import React from "react";

interface DesignedByProps {
    title?: string;
    designers?: string[];
}

const DesignedBy: React.FC<DesignedByProps> = ({
    title = "Designed by",
    designers = ["Hans Bailey", "Charlie Smith"],
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
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                </svg>
                <h3 className="font-bold text-black">{title}</h3>
            </div>
            <div className="space-y-1">
                {designers.map((designer, index) => (
                    <div key={index} className="text-black">
                        {designer}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DesignedBy;
