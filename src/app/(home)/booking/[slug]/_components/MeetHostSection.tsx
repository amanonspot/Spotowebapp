import React from "react";
import HostProfileCard from "./HostProfileCard";
import HostDetails from "./HostDetails";
import SuperhostInfo from "./SuperhostInfo";

interface MeetHostSectionProps {
    onMessageHost?: () => void;
}

const MeetHostSection: React.FC<MeetHostSectionProps> = ({ onMessageHost }) => {
    return (
        <div className="mb-8">
            {/* Section Title */}
            <h2 className="text-2xl font-bold text-black mb-8">
                Meet your Host
            </h2>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Host Profile and Details */}
                <div className="lg:col-span-2 space-y-8">
                    <HostProfileCard />
                    <HostDetails />
                </div>

                {/* Right Column - Superhost Info */}
                <div className="lg:col-span-1">
                    <SuperhostInfo onMessageHost={onMessageHost} />
                </div>
            </div>

            {/* Payment Protection Disclaimer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
                {/* <p className="text-sm text-gray-600 text-right">
                    To protect your payment, never transfer money or communicate
                    outside of the Airbnb website or app.
                </p> */}
            </div>
        </div>
    );
};

export default MeetHostSection;
