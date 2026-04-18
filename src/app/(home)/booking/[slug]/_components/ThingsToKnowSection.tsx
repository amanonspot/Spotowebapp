import React from "react";
import InfoColumn from "./InfoColumn";
import PolicyLinks from "./PolicyLinks";

interface ThingsToKnowSectionProps {
    className?: string;
}

const ThingsToKnowSection: React.FC<ThingsToKnowSectionProps> = ({
    className,
}) => {
    const houseRules = [
        "Check-in after 4:00 p.m.",
        "Checkout before 11:00 a.m.",
        "6 guests maximum",
    ];

    const safetyProperty = [
        "Nearby lake, river, other body of water",
        "Heights without rails or protection",
        "Climbing or play structure",
    ];

    return (
        <div className={`mb-8 ${className}`}>
            {/* Section Title */}
            <h2 className="text-2xl font-bold text-black mb-8">
                Things to know
            </h2>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">
                <InfoColumn title="House rules" items={houseRules} />
                <InfoColumn title="Safety & property" items={safetyProperty} />
                <PolicyLinks />
            </div>
        </div>
    );
};

export default ThingsToKnowSection;
