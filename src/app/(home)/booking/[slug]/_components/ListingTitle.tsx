import React from "react";
import { Event } from "@/lib/api/types";

interface ListingTitleProps {
    event?: Event | null;
}

const ListingTitle: React.FC<ListingTitleProps> = ({ event }) => {
    const title = event?.event_title || event?.venue_name || "Property Details";
    
    // Extract guest info from pax_size_keywords or use defaults
    const guestCount = event?.pax_size_keywords?.[0]?.name.match(/\d+/)?.[0] || "6";
    const bedroomCount = event?.space_info_keywords?.find(k => k.name.toLowerCase().includes('bedroom'))?.name.match(/\d+/)?.[0] || "2";
    const bedCount = event?.space_info_keywords?.find(k => k.name.toLowerCase().includes('bed'))?.name.match(/\d+/)?.[0] || "3";
    const bathroomCount = event?.space_info_keywords?.find(k => k.name.toLowerCase().includes('bath'))?.name.match(/\d+/)?.[0] || "1";
    
    const rating = 4.9;
    const reviewCount = 366;

    return (
        <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-2 sm:mb-3 leading-tight">
                {title}
            </h1>
            <div className="text-sm sm:text-base text-black mb-2 sm:mb-3">
                {guestCount} guests · {bedroomCount} bedrooms · {bedCount} beds
                · {bathroomCount} bath
            </div>
            <div className="flex items-center gap-2">
                <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-black fill-current"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-bold text-black text-sm sm:text-base">
                    {rating}
                </span>
                <span className="text-black text-sm sm:text-base">
                    · {reviewCount} reviews
                </span>
            </div>
        </div>
    );
};

export default ListingTitle;
