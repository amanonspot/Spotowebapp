"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { userService } from "@/lib/api";
import { useGooglePlaces } from "@/lib/hooks/useGooglePlaces";
import toast from "react-hot-toast";
import { rentalsService } from "@/lib/rentals/service";

interface PassStatus {
    free_contacts_used: number;
    free_contacts_remaining: number;
    has_one_day_active: boolean;
    has_weekly_active: boolean;
    one_day_pass_expires_at: string | null;
    weekly_pass_expires_at: string | null;
}

function formatExpiry(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface HeaderProps {
    location?: string;
    onLocationClick?: () => void;
    onLocationChange?: (location: string) => void;
    onProfileClick?: () => void;
    showHomeIcon?: boolean;
}

export default function Header({
    location = "Bangalore",
    onLocationClick,
    onLocationChange,
    onProfileClick,
    showHomeIcon = true,
}: HeaderProps) {
    const router = useRouter();
    const { isAuthenticated, user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showLocationMenu, setShowLocationMenu] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [locationSearchQuery, setLocationSearchQuery] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [passStatus, setPassStatus] = useState<PassStatus | null>(null);
    const [passLoading, setPassLoading] = useState(false);
    const [isAgent, setIsAgent] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const locationMenuRef = useRef<HTMLDivElement>(null);
    
    // Google Places autocomplete for location search
    const { suggestions: placeSuggestions, fetchSuggestions: fetchPlaceSuggestions } = useGooglePlaces();

    // Popular locations (shown when no search)
    const popularLocations = [
        "Bangalore",
        "Mysore",
        "Ooty",
        "Puducherry",
        "Goa",
        "Mumbai",
        "Delhi",
        "Hyderabad",
        "Chennai",
        "Pune",
        "Kolkata",
        "Jaipur",
    ];
    
    // Combine popular locations with Google Places search results
    const displayLocations = locationSearchQuery.trim().length >= 2 
        ? placeSuggestions.map(place => place.description)
        : popularLocations;

    // Fetch Google Places suggestions when search query changes
    useEffect(() => {
        if (locationSearchQuery.trim().length >= 2) {
            const timer = setTimeout(() => {
                fetchPlaceSuggestions(locationSearchQuery);
            }, 300); // 300ms debounce
            
            return () => clearTimeout(timer);
        }
    }, [locationSearchQuery, fetchPlaceSuggestions]);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target as Node)
            ) {
                setShowProfileMenu(false);
            }
            if (
                locationMenuRef.current &&
                !locationMenuRef.current.contains(event.target as Node)
            ) {
                setShowLocationMenu(false);
                setLocationSearchQuery(""); // Clear search when closing
            }
        };

        if (showProfileMenu || showLocationMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showProfileMenu, showLocationMenu]);

    const handleProfileClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            router.push("/auth/login");
            return;
        }
        const next = !showProfileMenu;
        setShowProfileMenu(next);
        if (next && !passStatus) {
            setPassLoading(true);
            try {
                const res = await rentalsService.getMyPassStatus();
                const data = (res as any)?.data ?? (res as any);
                setPassStatus(data);
            } catch {
                // silently ignore
            } finally {
                setPassLoading(false);
            }

            try {
                const { agentAdapter } = await import("@/lib/adapters");
                const profile = await agentAdapter.getAgentProfile();
                if (profile?.is_agent && profile.employee) setIsAgent(true);
            } catch {
                // silently ignore
            }
        }
    };

    const handleEmailUpdate = async () => {
        if (!newEmail || !user?.id) {
            toast.error("Please enter a valid email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        setIsUpdatingEmail(true);
        try {
            await userService.updateUser(user.id, { email: newEmail });
            toast.success("Email updated successfully!");
            setIsEditingEmail(false);
            setNewEmail("");
            setShowProfileMenu(false);
        } catch (error: unknown) {
            console.error("Error updating email:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update email. Please try again."
            );
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully!");
            setShowProfileMenu(false);
            router.push("/auth/login");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to logout. Please try again.");
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeletingAccount(true);
        try {
            await userService.deleteUser();
            toast.success("Account deleted successfully!");
            setShowDeleteConfirm(false);
            setShowProfileMenu(false);
            // Logout and redirect to login
            await logout();
            router.push("/auth/login");
        } catch (error: unknown) {
            console.error("Error deleting account:", error);
            
            // Extract error message from various possible formats
            let errorMessage = "Failed to delete account. Please try again.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = String((error as any).message);
            }
            
            // Show user-friendly error message
            toast.error(errorMessage);
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleLocationClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (onLocationClick) {
            onLocationClick();
        } else {
            setShowLocationMenu(!showLocationMenu);
        }
    };

    const handleLocationSelect = (selectedLocation: string) => {
        if (onLocationChange) {
            onLocationChange(selectedLocation);
        }
        setShowLocationMenu(false);
    };

    return (
        <div className="flex justify-between items-center p-4 md:p-6 z-30 relative mobile-header font-opensans">
            {/* Location selector */}
            <div className="relative" ref={locationMenuRef}>
                <button
                    className="flex items-center gap-1.5 md:gap-2 text-white cursor-pointer hover:opacity-90 active:opacity-75 transition-all duration-200 mobile-touch-target group"
                    onClick={handleLocationClick}
                    aria-label="Select location"
                    aria-expanded={showLocationMenu}
                >
                    <svg
                        className="w-4 h-4 md:w-5 md:h-5 text-[#AF7AEB] flex-shrink-0 group-hover:text-[#9575e6] transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    <span className="font-montserrat font-semibold text-sm md:text-base whitespace-nowrap max-w-[120px] md:max-w-none truncate">
                        {location}
                    </span>
                    <svg
                        className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 transition-transform duration-300 ${
                            showLocationMenu ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {/* Location dropdown menu */}
                {showLocationMenu && (
                    <div className="absolute left-0 md:left-0 top-full mt-2 w-[280px] md:w-80 bg-white rounded-xl shadow-2xl border border-gray-200/50 z-[100] max-h-[400px] md:max-h-[480px] overflow-hidden scrollbar-thin animate-fadeInSlideDown">
                        <div className="p-3 md:p-4">
                            {/* Search Input */}
                            <div className="mb-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search for cities..."
                                        value={locationSearchQuery}
                                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                                        className="w-full px-3 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        autoFocus
                                    />
                                    <svg
                                        className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
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
                                </div>
                            </div>
                            
                            <div className="text-xs md:text-sm font-semibold text-gray-500 px-2 md:px-3 py-1.5 md:py-2 mb-1">
                                {locationSearchQuery.trim().length >= 2 ? 'Search Results' : 'Popular Locations'}
                            </div>
                            
                            <div className="space-y-0.5 md:space-y-1 max-h-[260px] md:max-h-[320px] overflow-y-auto scrollbar-thin">
                                {displayLocations.length > 0 ? (
                                    displayLocations.map((loc, index) => (
                                        <button
                                            key={`${loc}-${index}`}
                                            onClick={() => {
                                                handleLocationSelect(loc);
                                                setLocationSearchQuery("");
                                            }}

                                        className={`w-full px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-left rounded-lg md:rounded-xl transition-all duration-200 mobile-touch-target ${
                                            loc === location
                                                ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white font-semibold shadow-md shadow-[#AF7AEB]/30"
                                                : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 md:gap-3">
                                            <svg
                                                className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${
                                                    loc === location
                                                        ? "text-white"
                                                        : "text-[#AF7AEB]"
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                            <span className="font-montserrat flex-1 truncate">
                                                {loc}
                                            </span>
                                            {loc === location && (
                                                <svg
                                                    className="w-4 h-4 md:w-5 md:h-5 ml-auto flex-shrink-0 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2.5}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                                        <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        No cities found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-3">
                {/* Home icon - conditionally shown */}
                {showHomeIcon && (
                    <Link 
                        href="/"
                        className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all duration-200 mobile-touch-target"
                        title="Back to Home"
                    >
                        <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-white"
                            fill="none"
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
                    </Link>
                )}
                
                {/* Profile icon with dropdown */}
                <div className="relative" ref={profileMenuRef}>
                    <div
                        className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all duration-200 mobile-touch-target"
                        onClick={handleProfileClick}
                        title={isAuthenticated ? "My Profile" : "Sign In"}
                    >
                        <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    </div>

                {/* Profile dropdown menu */}
                {showProfileMenu && isAuthenticated && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-[100]">
                        <div className="p-4">
                            {/* User info */}
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">
                                        {user?.first_name?.charAt(0) ||
                                            user?.email?.charAt(0) ||
                                            "U"}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {user?.first_name && user?.last_name
                                            ? `${user.first_name} ${user.last_name}`
                                            : user?.email || "User"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {user?.email || "No email"}
                                    </p>
                                </div>
                            </div>

                            {/* Pass & Credits section */}
                            <div className="mb-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    My Credits &amp; Passes
                                </h3>
                                {passLoading ? (
                                    <div className="flex justify-center py-3">
                                        <div className="w-5 h-5 rounded-full border-2 border-[#AF7AEB] border-t-transparent animate-spin" />
                                    </div>
                                ) : passStatus ? (
                                    <div className="space-y-2">
                                        {/* Free Credits */}
                                        <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span>🎁</span>
                                                    <div>
                                                            <p className="text-xs font-medium text-gray-800">Free Contacts</p>
                                                        </div>
                                            </div>
                                            <span className="text-base font-bold text-[#AF7AEB]">{passStatus.free_contacts_remaining}<span className="text-xs text-gray-400 font-normal"> left</span></span>
                                        </div>
                                        {/* One Day Pass */}
                                        {passStatus.has_one_day_active ? (
                                            <div className="rounded-lg bg-purple-50 border border-[#AF7AEB]/40 px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span>✅</span>
                                                    <p className="text-xs font-semibold text-[#7c3aed]">1-Day Unlimited Pass</p>
                                                    <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-semibold">Active</span>
                                                </div>
                                                {passStatus.one_day_pass_expires_at && (
                                                    <p className="text-[10px] text-gray-400 mt-1 pl-6">Expires: {formatExpiry(passStatus.one_day_pass_expires_at)}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 flex items-center gap-2">
                                                <span className="text-gray-300">⭕</span>
                                                <p className="text-xs text-gray-400">1-Day Pass — Inactive</p>
                                            </div>
                                        )}
                                        {passStatus.has_weekly_active ? (
                                            <div className="rounded-lg bg-green-50 border border-green-300/60 px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span>⭐</span>
                                                    <p className="text-xs font-semibold text-green-700">Legacy access pass</p>
                                                    <span className="ml-auto text-[10px] bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-semibold">Active</span>
                                                </div>
                                                {passStatus.weekly_pass_expires_at && (
                                                    <p className="text-[10px] text-gray-400 mt-1 pl-6">Expires: {formatExpiry(passStatus.weekly_pass_expires_at)}</p>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-1">Could not load pass info</p>
                                )}
                            </div>

                            {/* Email update section */}
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                    Update Email
                                </h3>
                                {isEditingEmail ? (
                                    <div className="space-y-2">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) =>
                                                setNewEmail(e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AF7AEB] focus:border-transparent"
                                            placeholder="Enter new email"
                                            disabled={isUpdatingEmail}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleEmailUpdate}
                                                disabled={isUpdatingEmail}
                                                className="flex-1 px-3 py-1.5 text-xs bg-[#AF7AEB] text-white rounded-lg hover:bg-[#9575e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                            >
                                                {isUpdatingEmail && (
                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                )}
                                                {isUpdatingEmail
                                                    ? "Saving..."
                                                    : "Save"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingEmail(false);
                                                    setNewEmail("");
                                                }}
                                                disabled={isUpdatingEmail}
                                                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600">
                                            {user?.email || "No email"}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setNewEmail(user?.email || "");
                                                setIsEditingEmail(true);
                                            }}
                                            className="px-3 py-1.5 text-xs bg-[#AF7AEB] text-white rounded-lg hover:bg-[#9575e6] transition-colors"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Dashboard link — agent or owner */}
                            <div className="mb-3">
                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        router.push(isAgent ? "/agent/dashboard" : "/owner/dashboard");
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <span>{isAgent ? "Agent Dashboard" : "Owner Dashboard"}</span>
                                </button>
                            </div>

                            {/* Delete Account button */}
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(true);
                                    setShowProfileMenu(false);
                                }}
                                className="w-full px-3 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors mb-3"
                            >
                                Delete Account
                            </button>

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                className="w-full mt-3 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 transform transition-all">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Delete Account
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                disabled={isDeletingAccount}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Warning Icon */}
                        <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm text-red-800 font-medium">
                                This will permanently delete your account and all associated data including bookings, wishlists, and preferences.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeletingAccount}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeletingAccount}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isDeletingAccount && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                )}
                                {isDeletingAccount ? "Deleting..." : "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
