import React from "react";

interface AmenityItemProps {
    icon: React.ReactNode;
    label: string;
}

const AmenityItem: React.FC<AmenityItemProps> = ({ icon, label }) => {
    return (
        <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0">
                {icon}
            </div>
            <span className="text-sm sm:text-base text-black">{label}</span>
        </div>
    );
};

export default AmenityItem;
