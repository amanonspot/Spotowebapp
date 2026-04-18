import React from "react";
import { Event } from "@/lib/api/types";

interface HostInfoProps {
    event?: Event | null;
}

const HostInfo: React.FC<HostInfoProps> = ({ event }) => {
    // Get host information from event data
    const getHostInfo = () => {
        if (!event) {
            return {
                hostName: "Host",
                hostStatus: "Host",
                hostingDuration: "Hosting on Spoto",
                profileImageUrl: null
            };
        }

        // Check if vendor is an object with details
        if (typeof event.vendor === 'object' && event.vendor !== null) {
            const vendor = event.vendor as any;
            return {
                hostName: vendor.username || vendor.email || "Host",
                hostStatus: "Host",
                hostingDuration: "Hosting on Spoto",
                profileImageUrl: vendor.profile_pic || null
            };
        }

        // Check if vendor is a string (company name)
        if (typeof event.vendor === 'string') {
            return {
                hostName: event.vendor || event.company_name || "Host",
                hostStatus: "Host",
                hostingDuration: "Hosting on Spoto",
                profileImageUrl: null
            };
        }

        // Default fallback
        return {
            hostName: event.company_name || "Host",
            hostStatus: "Host",
            hostingDuration: "Hosting on Spoto",
            profileImageUrl: null
        };
    };

    const { hostName, hostStatus, hostingDuration, profileImageUrl } = getHostInfo();

    return (
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500 overflow-hidden bg-gray-200 flex items-center justify-center">
                {profileImageUrl ? (
                    <img
                        src={profileImageUrl}
                        alt={hostName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-gray-600 font-medium text-lg">
                        {hostName.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <div>
                <div className="font-bold text-black">Hosted by {hostName}</div>
                <div className="text-black">
                    {hostStatus} · {hostingDuration}
                </div>
            </div>
        </div>
    );
};

export default HostInfo;
