"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";

interface BottomNavigationProps {
    activeTab?: "home" | "search" | "contacts";
    onTabChange?: (tab: "home" | "search" | "contacts") => void;
    onSearchClick?: () => void;
}

export default function BottomNavigation({
    activeTab,
    onTabChange,
    onSearchClick,
}: BottomNavigationProps) {
    const router = useRouter();
    const pathname = usePathname();

    // Hide bottom navigation on search page
    if (pathname === "/search") {
        return null;
    }

    // Determine active tab from pathname if not explicitly provided
    const currentTab =
        activeTab ||
        (pathname === "/contacts"
            ? "contacts"
            : pathname === "/search"
            ? "search"
            : "home");

    const handleTabClick = (tab: "home" | "search" | "contacts") => {
        // Handle search tab specially - open modal instead of navigating
        if (tab === "search") {
            if (onSearchClick) {
                onSearchClick();
            }
            // Call callback if provided
            if (onTabChange) {
                onTabChange(tab);
            }
            return;
        }

        // Handle other tabs with navigation
        switch (tab) {
            case "home":
                router.push("/");
                break;
            case "contacts":
                router.push("/contacts");
                break;
        }

        // Call callback if provided
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 mobile-bottom-nav mobile-safe-area rounded-t-2xl md:hidden z-40 font-opensans">
            <div className="flex justify-around items-center py-3">
                {/* Home Tab */}
                <button
                    onClick={() => handleTabClick("home")}
                    className={`flex flex-col items-center gap-1 p-3 mobile-touch-target transition-all duration-200 ${
                        currentTab === "home"
                            ? "text-[#AF7AEB] scale-110"
                            : "text-white hover:text-[#AF7AEB]/70"
                    }`}
                >
                    <div className="relative">
                        <svg
                            className="w-6 h-6 drop-shadow-lg"
                            fill={
                                currentTab === "home" ? "currentColor" : "none"
                            }
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        {currentTab === "home" && (
                            <div className="absolute inset-0 w-6 h-6 bg-[#AF7AEB]/20 rounded-full blur-sm"></div>
                        )}
                    </div>
                    <span className="text-xs font-montserrat font-semibold">
                        Home
                    </span>
                </button>

                {/* Search Tab */}
                <button
                    onClick={() => handleTabClick("search")}
                    className={`flex flex-col items-center gap-1 p-3 mobile-touch-target transition-all duration-200 ${
                        currentTab === "search"
                            ? "text-[#AF7AEB] scale-110"
                            : "text-white hover:text-[#AF7AEB]/70"
                    }`}
                >
                    <div className="relative">
                        <svg
                            className="w-6 h-6 drop-shadow-lg"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        {currentTab === "search" && (
                            <div className="absolute inset-0 w-6 h-6 bg-[#AF7AEB]/20 rounded-full blur-sm"></div>
                        )}
                    </div>
                    <span className="text-xs font-montserrat font-semibold">
                        Search
                    </span>
                </button>

                {/* Contacts Tab */}
                <button
                    onClick={() => handleTabClick("contacts")}
                    className={`flex flex-col items-center gap-1 p-3 mobile-touch-target transition-all duration-200 ${
                        currentTab === "contacts"
                            ? "text-[#AF7AEB] scale-110"
                            : "text-white hover:text-[#AF7AEB]/70"
                    }`}
                >
                    <div className="relative">
                        <svg
                            className="w-6 h-6 drop-shadow-lg"
                            fill={
                                currentTab === "contacts" ? "currentColor" : "none"
                            }
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                        </svg>
                        {currentTab === "contacts" && (
                            <div className="absolute inset-0 w-6 h-6 bg-[#AF7AEB]/20 rounded-full blur-sm"></div>
                        )}
                    </div>
                    <span className="text-xs font-montserrat font-semibold">
                        Contacts
                    </span>
                </button>
            </div>
        </div>
    );
}
