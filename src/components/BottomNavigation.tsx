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

    const tabItems = [
        {
            id: "home" as const,
            label: "Home",
            iconFilled: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            ),
            iconStroke: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            ),
        },
        {
            id: "search" as const,
            label: "Search",
            iconFilled: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            ),
            iconStroke: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            ),
        },
        {
            id: "contacts" as const,
            label: "Contacts",
            iconFilled: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            ),
            iconStroke: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            ),
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
            {/* Blur backdrop */}
            <div className="mobile-bottom-nav mobile-safe-area rounded-t-2xl" style={{ backdropFilter: "blur(16px)" }}>
                <div className="flex justify-around items-center py-2">
                    {tabItems.map((tab) => {
                        const isActive = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`relative flex flex-col items-center gap-1 px-5 py-2.5 transition-all duration-200 active:scale-95 ${
                                    isActive ? "text-[#AF7AEB]" : "text-white/60 hover:text-white/90"
                                }`}
                            >
                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className="absolute -top-0.5 h-1 w-5 rounded-full bg-[#AF7AEB] animate-pulse-glow" />
                                )}
                                <div className="relative">
                                    <svg
                                        className={`h-6 w-6 transition-transform duration-200 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(175,122,235,0.6)]" : ""}`}
                                        fill={isActive ? "currentColor" : "none"}
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        {isActive ? tab.iconFilled : tab.iconStroke}
                                    </svg>
                                </div>
                                <span className={`text-xs font-semibold transition-all ${isActive ? "text-[#AF7AEB]" : ""}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
