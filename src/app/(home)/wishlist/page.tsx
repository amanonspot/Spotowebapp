"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useEvents } from "@/lib/hooks/useEvents";
import { Event } from "@/lib/api/types";
import { transformEventsToProperties } from "@/lib/utils/dataTransformers";
import PropertyCard from "@/components/PropertyCard";
import BottomNavigation from "@/components/BottomNavigation";
import Header from "@/components/Header";

export default function WishlistPage() {
    const router = useRouter();
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { fetchEvents } = useEvents();
    const [wishlistEvents, setWishlistEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Get location from localStorage or default to "Bangalore"
    const getPersistedLocation = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('spoto_selected_location') || "Bangalore";
        }
        return "Bangalore";
    };
    
    const [selectedLocation, setSelectedLocation] = useState(getPersistedLocation());

    useEffect(() => {
        loadWishlistEvents();
    }, [wishlistItems]);

    const loadWishlistEvents = async () => {
        if (wishlistItems.length === 0) {
            setWishlistEvents([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Fetch all events and filter by wishlist IDs
            const allEvents = await fetchEvents({ event_status: 'published' });
            const filtered = allEvents.filter(event => wishlistItems.includes(event.id));
            setWishlistEvents(filtered);
        } catch (err) {
            console.error('Error loading wishlist events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePropertyClick = (propertyId: string) => {
        router.push(`/booking/${propertyId}`);
    };

    const handleLocationClick = () => {
        router.push("/search");
    };
    
    const handleLocationChange = (location: string) => {
        setSelectedLocation(location);
        // Persist location to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('spoto_selected_location', location);
        }
    };

    const handleProfileClick = () => {
        // TODO: Navigate to profile page when implemented
        console.log("Profile clicked");
    };

    const handleTabChange = (tab: "home" | "search" | "contacts") => {
        if (tab === "home") {
            router.push("/");
        } else if (tab === "search") {
            router.push("/search");
        } else if (tab === "contacts") {
            router.push("/contacts");
        }
    };

    const properties = transformEventsToProperties(wishlistEvents);

    return (
        <>
            {/* Mobile View */}
            <div className="md:hidden min-h-screen bg-black pb-20">
                <div className="px-4 pt-6 pb-4">
                    <h1 className="text-white text-2xl font-bold mb-2">Wishlist</h1>
                    <p className="text-gray-400 text-sm">
                        {wishlistItems.length} {wishlistItems.length === 1 ? 'property' : 'properties'} saved
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-white text-lg">Loading...</div>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 px-6">
                        <div className="text-white text-lg mb-2 text-center">
                            No saved properties yet
                        </div>
                        <div className="text-gray-400 text-sm text-center mb-6">
                            Start exploring and save your favorite properties
                        </div>
                        <button
                            onClick={() => router.push("/")}
                            className="px-6 py-3 bg-[#AF7AEB] text-white rounded-xl hover:bg-[#9575e6] transition-colors font-semibold"
                        >
                            Explore Properties
                        </button>
                    </div>
                ) : (
                    <div className="px-4 pb-6 grid grid-cols-1 gap-6">
                        {properties.map((property) => (
                            <PropertyCard
                                key={property.id}
                                title={property.title}
                                location={property.location}
                                price={property.price}
                                image={property.image}
                                onClick={() => handlePropertyClick(property.id)}
                                status={property.status}
                                rating={property.rating}
                            />
                        ))}
                    </div>
                )}

                <BottomNavigation
                    activeTab="home"
                    onTabChange={handleTabChange}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:block relative w-full min-h-screen bg-[#120A1A]">
                <Header
                    location={selectedLocation}
                    onLocationChange={handleLocationChange}
                    onLocationClick={handleLocationClick}
                    onProfileClick={handleProfileClick}
                />

                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-white text-4xl font-bold mb-2">Wishlist</h1>
                        <p className="text-gray-400 text-lg">
                            {wishlistItems.length} {wishlistItems.length === 1 ? 'property' : 'properties'} saved
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-white text-xl">Loading...</div>
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96">
                            <div className="text-white text-2xl mb-4">
                                No saved properties yet
                            </div>
                            <div className="text-gray-400 text-lg mb-8">
                                Start exploring and save your favorite properties
                            </div>
                            <button
                                onClick={() => router.push("/")}
                                className="px-8 py-4 bg-[#AF7AEB] text-white rounded-xl hover:bg-[#9575e6] transition-colors font-semibold text-lg"
                            >
                                Explore Properties
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {properties.map((property) => (
                                <PropertyCard
                                    key={property.id}
                                    title={property.title}
                                    location={property.location}
                                    price={property.price}
                                    image={property.image}
                                    onClick={() => handlePropertyClick(property.id)}
                                    status={property.status}
                                    rating={property.rating}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
