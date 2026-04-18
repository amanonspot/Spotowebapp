"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGooglePlaces } from "@/lib/hooks/useGooglePlaces";

interface LocationSuggestion {
    id: string;
    name: string;
    country: string;
    description?: string;
    icon?: "location" | "city" | "beach" | "nature";
}

interface EnhancedSearchBarProps {
    onSearch?: () => void;
    onWhereChange?: (value: string) => void;
    onCheckInChange?: (value: string) => void;
    onCheckOutChange?: (value: string) => void;
    onGuestsChange?: (value: string) => void;
    initialWhere?: string;
    initialCheckIn?: string;
    initialCheckOut?: string;
    initialGuests?: string;
}

export default function EnhancedSearchBar({
    onSearch,
    onWhereChange,
    onCheckInChange,
    onCheckOutChange,
    onGuestsChange,
    initialWhere = "",
    initialCheckIn = "",
    initialCheckOut = "",
    initialGuests = "",
}: EnhancedSearchBarProps) {
    const router = useRouter();
    const [isWhereFocused, setIsWhereFocused] = useState(false);
    const [whereValue, setWhereValue] = useState(initialWhere);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [activeDateField, setActiveDateField] = useState<
        "checkin" | "checkout" | null
    >(null);
    const [checkInDate, setCheckInDate] = useState(initialCheckIn);
    const [checkOutDate, setCheckOutDate] = useState(initialCheckOut);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [adultCount, setAdultCount] = useState(0);
    const [childCount, setChildCount] = useState(0);
    const [assistanceAnimalCount, setAssistanceAnimalCount] = useState(0);
    const [guestDisplayValue, setGuestDisplayValue] = useState(initialGuests);
    const whereRef = useRef<HTMLInputElement>(null);
    const datePickerRef = useRef<HTMLDivElement>(null);
    const guestRef = useRef<HTMLInputElement>(null);
    
    // Temporary state for dates (before confirming)
    const [tempCheckInDate, setTempCheckInDate] = useState(initialCheckIn);
    const [tempCheckOutDate, setTempCheckOutDate] = useState(initialCheckOut);
    
    // Temporary state for guests (before confirming)
    const [tempAdultCount, setTempAdultCount] = useState(0);
    const [tempChildCount, setTempChildCount] = useState(0);
    const [tempAssistanceAnimalCount, setTempAssistanceAnimalCount] = useState(0);
    
    // Google Places autocomplete
    const { suggestions: placeSuggestions, fetchSuggestions: fetchPlaceSuggestions } = useGooglePlaces();

    // Update state when initial values change (only if they're different)
    useEffect(() => {
        if (initialWhere !== whereValue) {
            setWhereValue(initialWhere);
        }
    }, [initialWhere]);

    useEffect(() => {
        if (initialCheckIn !== checkInDate) setCheckInDate(initialCheckIn);
    }, [initialCheckIn]);

    useEffect(() => {
        if (initialCheckOut !== checkOutDate) setCheckOutDate(initialCheckOut);
    }, [initialCheckOut]);

    useEffect(() => {
        if (initialGuests !== guestDisplayValue)
            setGuestDisplayValue(initialGuests);
    }, [initialGuests]);

    // Suggested destinations with descriptions
    const suggestedDestinations: LocationSuggestion[] = [
        {
            id: "nearby",
            name: "Nearby",
            country: "Find what's around you",
            description: "Find what's around you.",
            icon: "location",
        },
        {
            id: "mysore",
            name: "Mysore, Karnataka",
            country: "Karnataka",
            description: "For its stunning architecture.",
            icon: "city",
        },
        {
            id: "ooty",
            name: "Ooty, Tamil Nadu",
            country: "Tamil Nadu",
            description: "For nature lovers.",
            icon: "nature",
        },
        {
            id: "puducherry",
            name: "Puducherry, Puducherry",
            country: "Puducherry",
            description: "Popular beach destination.",
            icon: "beach",
        },
        {
            id: "north-goa",
            name: "North Goa, Goa",
            country: "Goa",
            description: "Guests interested in Kochi also looked here.",
            icon: "beach",
        },
    ];

    // Fetch Google Places suggestions based on input
    useEffect(() => {
        if (whereValue.trim() === "" || whereValue.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        // Debounce the API call
        const timer = setTimeout(() => {
            fetchPlaceSuggestions(whereValue);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [whereValue, fetchPlaceSuggestions]);
    
    // Update local suggestions when Google Places suggestions change
    useEffect(() => {
        if (placeSuggestions && placeSuggestions.length > 0) {
            const transformedSuggestions: LocationSuggestion[] = placeSuggestions.map(place => ({
                id: place.place_id,
                name: place.main_text,
                country: place.secondary_text,
                description: place.description,
                icon: "city" as "location" | "city" | "beach" | "nature"
            }));
            
            setSuggestions(transformedSuggestions);
        }
    }, [placeSuggestions]);

    // Get icon component based on icon type
    const getIcon = (iconType?: string) => {
        switch (iconType) {
            case "location":
                return (
                    <svg
                        className="w-3 h-3 md:w-3.5 md:h-3.5"
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
                );
            case "city":
                return (
                    <svg
                        className="w-3 h-3 md:w-3.5 md:h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                    </svg>
                );
            case "nature":
                return (
                    <svg
                        className="w-3 h-3 md:w-3.5 md:h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            case "beach":
                return (
                    <svg
                        className="w-3 h-3 md:w-3.5 md:h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                    </svg>
                );
            default:
                return (
                    <svg
                        className="w-3 h-3 md:w-3.5 md:h-3.5"
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
                );
        }
    };

    // Handle click outside to close modals
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                whereRef.current &&
                !whereRef.current.contains(event.target as Node)
            ) {
                // Add a small delay to allow click events to process first
                setTimeout(() => {
                    setIsWhereFocused(false);
                }, 150);
            }
            if (
                datePickerRef.current &&
                !datePickerRef.current.contains(event.target as Node)
            ) {
                setIsDatePickerOpen(false);
            }
            if (
                guestRef.current &&
                !guestRef.current.contains(event.target as Node)
            ) {
                setIsGuestModalOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleWhereChange = (value: string) => {
        setWhereValue(value);
        onWhereChange?.(value);
    };

    const handleSuggestionClick = (suggestion: LocationSuggestion) => {
        const fullLocation = `${suggestion.name}, ${suggestion.country}`;
        // Set the value first
        setWhereValue(fullLocation);
        onWhereChange?.(fullLocation);
        // Close dropdown after a brief delay to ensure value is set
        setTimeout(() => {
            setIsWhereFocused(false);
        }, 100);
    };

    const handleSearchClick = async () => {
        // Validate that at least one field is filled
        const hasLocation = whereValue.trim().length > 0;
        const hasCheckIn = checkInDate.length > 0;
        const hasCheckOut = checkOutDate.length > 0;
        const hasGuests = guestDisplayValue.length > 0;
        
        if (!hasLocation && !hasCheckIn && !hasCheckOut && !hasGuests) {
            // Import toast dynamically
            const { default: toast } = await import('react-hot-toast');
            toast.error('Please fill in at least one search field to continue', {
                duration: 3000,
                style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid #ef4444',
                }
            });
            return;
        }

        // Build URL with search parameters
        const queryParams = new URLSearchParams();
        if (whereValue.trim()) queryParams.set("location", whereValue.trim());
        if (checkInDate) queryParams.set("checkIn", checkInDate);
        if (checkOutDate) queryParams.set("checkOut", checkOutDate);
        if (guestDisplayValue) queryParams.set("guests", guestDisplayValue);

        // Navigate to search page with params
        const searchUrl = `/search?${queryParams.toString()}`;
        router.push(searchUrl);

        // Also call the callback if provided (for backward compatibility)
        onSearch?.();
    };

    const handleDateFieldClick = (fieldType: "checkin" | "checkout") => {
        // Initialize temporary dates with current values
        setTempCheckInDate(checkInDate);
        setTempCheckOutDate(checkOutDate);
        setActiveDateField(fieldType);
        setIsDatePickerOpen(true);
        setIsWhereFocused(false);
        setIsGuestModalOpen(false);
    };

    const handleGuestFieldClick = () => {
        // Initialize temporary counts with current values
        setTempAdultCount(adultCount);
        setTempChildCount(childCount);
        setTempAssistanceAnimalCount(assistanceAnimalCount);
        setIsGuestModalOpen(true);
        setIsWhereFocused(false);
        setIsDatePickerOpen(false);
    };
    
    // Confirm date selection
    const handleDateConfirm = () => {
        setCheckInDate(tempCheckInDate);
        setCheckOutDate(tempCheckOutDate);
        onCheckInChange?.(tempCheckInDate);
        onCheckOutChange?.(tempCheckOutDate);
        setIsDatePickerOpen(false);
        setActiveDateField(null);
    };
    
    // Cancel date selection
    const handleDateCancel = () => {
        setTempCheckInDate(checkInDate);
        setTempCheckOutDate(checkOutDate);
        setIsDatePickerOpen(false);
        setActiveDateField(null);
    };
    
    // Confirm guest selection
    const handleGuestConfirm = () => {
        setAdultCount(tempAdultCount);
        setChildCount(tempChildCount);
        setAssistanceAnimalCount(tempAssistanceAnimalCount);
        
        // Create guest display text
        const guestParts = [];
        if (tempAdultCount > 0) {
            guestParts.push(`${tempAdultCount} adult${tempAdultCount > 1 ? "s" : ""}`);
        }
        if (tempChildCount > 0) {
            guestParts.push(`${tempChildCount} child${tempChildCount > 1 ? "ren" : ""}`);
        }
        if (tempAssistanceAnimalCount > 0) {
            guestParts.push(`${tempAssistanceAnimalCount} pet${tempAssistanceAnimalCount > 1 ? "s" : ""}`);
        }
        
        const guestText = guestParts.length > 0 ? guestParts.join(", ") : "";
        setGuestDisplayValue(guestText);
        onGuestsChange?.(guestText);
        setIsGuestModalOpen(false);
    };
    
    // Cancel guest selection
    const handleGuestCancel = () => {
        setTempAdultCount(adultCount);
        setTempChildCount(childCount);
        setTempAssistanceAnimalCount(assistanceAnimalCount);
        setIsGuestModalOpen(false);
    };

    // Helper to parse date string to Date object
    const parseDateString = (dateString: string): Date | null => {
        if (!dateString) return null;
        try {
            // Parse the formatted date string (e.g., "Nov 7, 2025")
            // Create date in local timezone to avoid UTC conversion issues
            const parsed = new Date(dateString);
            if (isNaN(parsed.getTime())) {
                return null;
            }
            // Ensure we work with local midnight to avoid timezone shifts
            const localDate = new Date(
                parsed.getFullYear(),
                parsed.getMonth(),
                parsed.getDate()
            );
            localDate.setHours(0, 0, 0, 0);
            return localDate;
        } catch (e) {
            return null;
        }
    };

    const handleDateSelect = (year: number, month: number, day: number) => {
        // Create date using local time (month is 0-indexed: 0-11)
        const selectedDate = new Date(year, month, day);
        selectedDate.setHours(0, 0, 0, 0);

        // Format date consistently
        const formattedDate = selectedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

        // Parse existing temp dates with proper timezone handling
        const tempCheckInParsed = parseDateString(tempCheckInDate);
        const tempCheckOutParsed = parseDateString(tempCheckOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Based on which field is active, update temporary state
        if (activeDateField === "checkin") {
            // If clicking on the same check-in date, clear it
            if (
                tempCheckInParsed &&
                selectedDate.getTime() === tempCheckInParsed.getTime()
            ) {
                setTempCheckInDate("");
                // Clear check-out if check-in is cleared
                if (tempCheckOutParsed) {
                    setTempCheckOutDate("");
                }
            } else if (selectedDate >= today) {
                // Set or update check-in date in temp state
                setTempCheckInDate(formattedDate);

                // If new check-in is after check-out, clear check-out
                if (tempCheckOutParsed && selectedDate >= tempCheckOutParsed) {
                    setTempCheckOutDate("");
                }

                // Automatically switch to check-out selection after selecting check-in
                setActiveDateField("checkout");
            }
        } else if (activeDateField === "checkout") {
            // If clicking on the same check-out date, clear it
            if (
                tempCheckOutParsed &&
                selectedDate.getTime() === tempCheckOutParsed.getTime()
            ) {
                setTempCheckOutDate("");
            } else if (selectedDate >= today) {
                // Can only set check-out if check-in is selected and selected date is after check-in
                if (tempCheckInParsed && selectedDate > tempCheckInParsed) {
                    setTempCheckOutDate(formattedDate);
                } else if (!tempCheckInParsed) {
                    // If no check-in, set it first, then automatically switch to check-out
                    setTempCheckInDate(formattedDate);
                    // Keep checkout field active for next selection
                } else if (tempCheckInParsed && selectedDate <= tempCheckInParsed) {
                    // If selected date is before or equal to check-in, update check-in instead
                    setTempCheckInDate(formattedDate);
                    // Clear check-out and keep checkout field active
                    if (tempCheckOutParsed) {
                        setTempCheckOutDate("");
                    }
                }
            }
        } else {
            // Fallback: if no active field, use smart selection logic
            if (!tempCheckInDate || !tempCheckInParsed) {
                setTempCheckInDate(formattedDate);
                // Automatically switch to check-out selection
                setActiveDateField("checkout");
            } else if (tempCheckInParsed && selectedDate > tempCheckInParsed) {
                setTempCheckOutDate(formattedDate);
            } else if (tempCheckInParsed && selectedDate <= tempCheckInParsed) {
                setTempCheckInDate(formattedDate);
                if (tempCheckOutParsed) {
                    setTempCheckOutDate("");
                }
                // Automatically switch to check-out selection
                setActiveDateField("checkout");
            }
        }
    };

    // Generate calendar data for current month and next month
    const generateCalendarData = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    // Get current date and generate calendar for current month and next month
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const currentMonthDays = generateCalendarData(currentYear, currentMonth);
    const nextMonthDays = generateCalendarData(currentYear, currentMonth + 1);

    // Get month names
    const getMonthName = (year: number, month: number) => {
        return new Date(year, month, 1).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    };

    const currentMonthName = getMonthName(currentYear, currentMonth);
    const nextMonthName = getMonthName(currentYear, currentMonth + 1);

    // Check if a date is disabled
    const isDateDisabled = (year: number, month: number, day: number) => {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Only disable past dates - allow all future dates to be clickable
        // This allows users to change check-in by clicking on any future date
        if (date < today) {
            return true;
        }

        // Don't disable dates based on check-in - allow changing check-in
        return false;
    };

    // Check if a date should be grayed out (but still clickable)
    const isDateGrayedOut = (year: number, month: number, day: number) => {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const tempCheckInParsed = parseDateString(tempCheckInDate);
        const tempCheckOutParsed = parseDateString(tempCheckOutDate);

        // When selecting check-out, gray out dates before or equal to check-in
        if (activeDateField === "checkout") {
            if (tempCheckInParsed && date <= tempCheckInParsed) {
                return true;
            }
        }
        // When selecting check-in, gray out dates that are before or equal to current check-in (if exists)
        else if (activeDateField === "checkin") {
            if (tempCheckInParsed && date <= tempCheckInParsed) {
                return true;
            }
        }
        // Default behavior: gray out dates before check-in
        else if (tempCheckInParsed && date <= tempCheckInParsed) {
            return true;
        }

        return false;
    };

    // Check if a date is disabled for the active field
    const isDateDisabledForActiveField = (
        year: number,
        month: number,
        day: number
    ) => {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const tempCheckInParsed = parseDateString(tempCheckInDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Always disable past dates
        if (date < today) {
            return true;
        }

        // When selecting check-out, disable dates before or equal to check-in
        if (activeDateField === "checkout") {
            if (!tempCheckInParsed) {
                // If no check-in, all future dates are enabled (will set check-in first)
                return false;
            }
            if (date <= tempCheckInParsed) {
                return true;
            }
        }
        // When selecting check-in, only disable past dates (already handled above)
        // Allow selecting any future date for check-in

        return false;
    };

    // Check if date is in selected range (use temp state)
    const isDateInRange = (year: number, month: number, day: number) => {
        if (!tempCheckInDate || !tempCheckOutDate) return false;

        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const tempCheckInParsed = parseDateString(tempCheckInDate);
        const tempCheckOutParsed = parseDateString(tempCheckOutDate);

        if (!tempCheckInParsed || !tempCheckOutParsed) return false;

        return date >= tempCheckInParsed && date <= tempCheckOutParsed;
    };

    // Check if date is selected (use temp state)
    const isDateSelected = (year: number, month: number, day: number) => {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);

        const tempCheckInParsed = parseDateString(tempCheckInDate);
        const tempCheckOutParsed = parseDateString(tempCheckOutDate);

        // Always show both dates as selected if they have values
        if (tempCheckInParsed && date.getTime() === tempCheckInParsed.getTime())
            return true;
        if (tempCheckOutParsed && date.getTime() === tempCheckOutParsed.getTime())
            return true;

        return false;
    };

    const handleGuestCountChange = (
        type: "adult" | "child" | "assistance",
        increment: boolean
    ) => {
        // Update temporary state only (not committed until user clicks OK)
        if (type === "adult") {
            const newCount = increment
                ? tempAdultCount + 1
                : Math.max(0, tempAdultCount - 1);
            setTempAdultCount(newCount);
        } else if (type === "child") {
            const newCount = increment
                ? tempChildCount + 1
                : Math.max(0, tempChildCount - 1);
            setTempChildCount(newCount);
        } else if (type === "assistance") {
            const newCount = increment
                ? tempAssistanceAnimalCount + 1
                : Math.max(0, tempAssistanceAnimalCount - 1);
            setTempAssistanceAnimalCount(newCount);
        }
        // Note: Guest text is only updated when user clicks OK button
    };

    return (
        <div className="w-full px-4 z-20 relative max-w-full">
            {/* Mobile Search Bar */}
            <div className="md:hidden">
                <div className="mobile-search-bar rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/20 transition-all duration-200 border border-white/10 shadow-lg shadow-black/20 backdrop-blur-md">
                    {/* Search icon with glow effect */}
                    <div className="relative">
                        <svg
                            className="w-5 h-5 text-[#AF7AEB] drop-shadow-lg"
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
                        <div className="absolute inset-0 w-5 h-5 bg-[#AF7AEB]/20 rounded-full blur-sm"></div>
                    </div>

                    {/* Search text */}
                    <div className="flex-1 flex items-center gap-1.5 text-sm font-medium overflow-hidden">
                        <span className="text-white truncate">
                            {whereValue || "Where to?"}
                        </span>
                        <span className="text-white/60">·</span>
                        <span className="text-white/90 truncate">
                            {checkInDate && checkOutDate
                                ? `${checkInDate.split(',')[0]} - ${checkOutDate.split(',')[0]}`
                                : "Add dates"}
                        </span>
                        <span className="text-white/60">·</span>
                        <span className="text-white/90 whitespace-nowrap">
                            {guestDisplayValue || "Add guests"}
                        </span>
                    </div>

                    {/* Filter icon with glow effect */}
                    <div className="relative flex-shrink-0">
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                            />
                        </svg>
                        <div className="absolute inset-0 w-5 h-5 bg-white/10 rounded-full blur-sm"></div>
                    </div>
                </div>
            </div>

            {/* Tablet & Desktop Search Bar */}
            <div className="hidden md:block p-6">
                <div className="bg-[#20162B] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-0 w-full">
                    {/* Where */}
                    <div
                        className="flex-1 px-4 md:border-r border-[#404040] relative min-w-0"
                        ref={whereRef}
                    >
                        <label className="text-white text-sm block mb-1">
                            Where
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search destinations"
                                value={whereValue}
                                className={`w-full bg-transparent text-white placeholder-[#A0A0A0] outline-none cursor-pointer ${
                                    whereValue ? "pr-8" : ""
                                }`}
                                onChange={(e) => handleWhereChange(e.target.value)}
                                onFocus={() => setIsWhereFocused(true)}
                                onBlur={(e) => {
                                    // Delay blur to allow click events to process
                                    setTimeout(() => {
                                        if (!whereRef.current?.contains(document.activeElement)) {
                                            setIsWhereFocused(false);
                                        }
                                    }, 200);
                                }}
                            />
                            {whereValue && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setWhereValue("");
                                        onWhereChange?.("");
                                        setIsWhereFocused(false);
                                    }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Clear location"
                                >
                                    <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Location Suggestions Modal */}
                        {isWhereFocused && (
                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 w-full max-w-full min-w-[280px] max-h-[calc(100vh-200px)] md:max-h-[500px] overflow-y-auto animate-fadeInSlideDown" style={{ right: 0 }}>
                                {whereValue.trim() === "" ? (
                                    <>
                                        {/* Suggested Destinations Section */}
                                        <div className="py-2">
                                            <div className="px-4 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Suggested destinations
                                            </div>
                                            {suggestedDestinations.map(
                                                (destination, index) => (
                                                    <button
                                                        key={destination.id}
                                                        type="button"
                                                        className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center transition-all duration-150 group"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                        }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSuggestionClick(
                                                                destination
                                                            );
                                                        }}
                                                        style={{
                                                            animationDelay: `${
                                                                index * 30
                                                            }ms`,
                                                        }}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-gray-900 font-semibold text-sm md:text-[15px] leading-tight group-hover:text-purple-900 transition-colors">
                                                                {
                                                                    destination.name
                                                                }
                                                            </div>
                                                            <div className="text-gray-500 text-xs md:text-[13px] mt-0.5 leading-relaxed">
                                                                {
                                                                    destination.description
                                                                }
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    /* Filtered Suggestions */
                                    <div className="py-2">
                                        {suggestions.length > 0 ? (
                                            suggestions.map(
                                                (suggestion, index) => (
                                                    <button
                                                        key={suggestion.id}
                                                        type="button"
                                                        className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center transition-all duration-150 group"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                        }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSuggestionClick(
                                                                suggestion
                                                            );
                                                        }}
                                                        style={{
                                                            animationDelay: `${
                                                                index * 30
                                                            }ms`,
                                                        }}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="text-gray-900 font-semibold text-sm md:text-[15px] group-hover:text-purple-900 transition-colors">
                                                                {
                                                                    suggestion.name
                                                                }
                                                            </div>
                                                            <div className="text-gray-500 text-xs md:text-[13px] mt-0.5">
                                                                {
                                                                    suggestion.country
                                                                }
                                                            </div>
                                                        </div>
                                                    </button>
                                                )
                                            )
                                        ) : (
                                            <div className="px-4 md:px-6 py-6 md:py-8 text-center">
                                                <svg
                                                    className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-2 md:mb-3"
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
                                                <p className="text-gray-500 text-xs md:text-sm font-medium">
                                                    No locations found
                                                </p>
                                                <p className="text-gray-400 text-[10px] md:text-xs mt-1">
                                                    Try a different search term
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Check in */}
                    <div className="flex-1 px-4 md:border-r border-[#404040] relative min-w-0">
                        <label className="text-white text-sm block mb-1">
                            Check in
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Add dates"
                                value={isDatePickerOpen ? tempCheckInDate : checkInDate}
                                className={`w-full bg-transparent text-white placeholder-[#A0A0A0] outline-none cursor-pointer pr-8 ${
                                    (activeDateField === "checkin" ||
                                        (activeDateField === "checkout" &&
                                            checkInDate &&
                                            checkOutDate)) &&
                                    isDatePickerOpen
                                        ? "text-[#AF7AEB]"
                                        : ""
                                }`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDateFieldClick("checkin");
                                }}
                                readOnly
                            />
                            {(isDatePickerOpen ? tempCheckInDate : checkInDate) && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isDatePickerOpen) {
                                            setTempCheckInDate("");
                                            setTempCheckOutDate("");
                                        } else {
                                            setCheckInDate("");
                                            onCheckInChange?.("");
                                            // Also clear check-out if check-in is cleared
                                            if (checkOutDate) {
                                                setCheckOutDate("");
                                                onCheckOutChange?.("");
                                            }
                                            setIsDatePickerOpen(false);
                                            setActiveDateField(null);
                                        }
                                    }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Clear check-in date"
                                >
                                    <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Check out */}
                    <div className="flex-1 px-4 md:border-r border-[#404040] relative min-w-0">
                        <label className="text-white text-sm block mb-1">
                            Check out
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Add dates"
                                value={isDatePickerOpen ? tempCheckOutDate : checkOutDate}
                                className={`w-full bg-transparent text-white placeholder-[#A0A0A0] outline-none cursor-pointer pr-8 ${
                                    (activeDateField === "checkout" ||
                                        (activeDateField === "checkin" &&
                                            checkInDate &&
                                            checkOutDate)) &&
                                    isDatePickerOpen
                                        ? "text-[#AF7AEB]"
                                        : ""
                                }`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDateFieldClick("checkout");
                                }}
                                readOnly
                            />
                            {(isDatePickerOpen ? tempCheckOutDate : checkOutDate) && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isDatePickerOpen) {
                                            setTempCheckOutDate("");
                                        } else {
                                            setCheckOutDate("");
                                            onCheckOutChange?.("");
                                            setIsDatePickerOpen(false);
                                            setActiveDateField(null);
                                        }
                                    }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Clear check-out date"
                                >
                                    <svg
                                        className="w-4 h-4 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Who */}
                    <div className="flex-1 px-4 relative min-w-0" ref={guestRef}>
                        <label className="text-white text-sm block mb-1">
                            Who
                        </label>
                        <input
                            type="text"
                            placeholder="Add guests"
                            value={guestDisplayValue}
                            className="w-full bg-transparent text-white placeholder-[#A0A0A0] outline-none cursor-pointer"
                            onClick={handleGuestFieldClick}
                            readOnly
                        />

                        {/* Guest Selection Modal */}
                        {isGuestModalOpen && (
                            <div className="absolute top-full left-0 mt-2 bg-[#2A1F3D] border border-[#404040] rounded-xl shadow-2xl z-50 w-full max-w-[320px] min-w-[280px]" style={{ right: 0 }}>
                                <div className="p-4">
                                    {/* Ages 13 or above */}
                                    <div className="flex items-center justify-between py-3 border-b border-[#404040]">
                                        <div className="flex-1">
                                            <div className="text-white text-sm font-medium">
                                                Ages 13 or above
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "adult",
                                                        false
                                                    )
                                                }
                                                disabled={tempAdultCount === 0}
                                                className="w-8 h-8 rounded-full border border-[#404040] flex items-center justify-center hover:bg-[#3A2F4D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Decrease adult count"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M18 12H6"
                                                    />
                                                </svg>
                                            </button>
                                            <span className="text-white font-semibold min-w-[24px] text-center text-base">
                                                {tempAdultCount}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "adult",
                                                        true
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border border-[#404040] flex items-center justify-center hover:bg-[#3A2F4D] transition-colors"
                                                aria-label="Increase adult count"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Ages 2-12 */}
                                    <div className="flex items-center justify-between py-3 border-b border-[#404040]">
                                        <div className="flex-1">
                                            <div className="text-white text-sm font-medium">
                                                Ages 2-12
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "child",
                                                        false
                                                    )
                                                }
                                                disabled={tempChildCount === 0}
                                                className="w-8 h-8 rounded-full border border-[#404040] flex items-center justify-center hover:bg-[#3A2F4D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Decrease child count"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M18 12H6"
                                                    />
                                                </svg>
                                            </button>
                                            <span className="text-white font-semibold min-w-[24px] text-center text-base">
                                                {tempChildCount}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "child",
                                                        true
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border border-[#404040] flex items-center justify-center hover:bg-[#3A2F4D] transition-colors"
                                                aria-label="Increase child count"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Pets */}
                                    <div className="flex items-center justify-between py-3 border-b border-[#404040]">
                                        <div className="flex-1 pr-2">
                                            <div className="text-white text-sm font-medium leading-snug">
                                                Pets
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "assistance",
                                                        false
                                                    )
                                                }
                                                disabled={
                                                    tempAssistanceAnimalCount === 0
                                                }
                                                className="w-8 h-8 rounded-full border border-[#404040] flex items-center justify-center hover:bg-[#3A2F4D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Decrease pet count"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M18 12H6"
                                                    />
                                                </svg>
                                            </button>
                                            <span className="text-white font-semibold min-w-[24px] text-center text-base">
                                                {tempAssistanceAnimalCount}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "assistance",
                                                        true
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border border-[#404040] flex items-center justify-center hover:bg-[#3A2F4D] transition-colors"
                                                aria-label="Increase pet count"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-4 pt-3 border-t border-[#404040]">
                                        <button
                                            onClick={handleGuestCancel}
                                            className="flex-1 px-4 py-2.5 rounded-lg border border-[#404040] text-white text-sm font-medium hover:bg-[#3A2F4D] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleGuestConfirm}
                                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#AF7AEB] text-white text-sm font-semibold hover:bg-[#9575e6] transition-colors"
                                        >
                                            OK
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search button */}
                    <button
                        className="bg-[#AF7AEB] p-3 rounded-xl hover:bg-[#9575e6] transition-colors md:ml-4 self-center md:self-auto font-montserrat font-semibold"
                        onClick={handleSearchClick}
                    >
                        <svg
                            className="w-5 h-5 text-white"
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
                    </button>
                </div>
            </div>

            {/* Date Picker Modal */}
            {isDatePickerOpen && (
                <div
                    className="absolute top-full left-0 mt-2 z-50 w-full"
                    ref={datePickerRef}
                    style={{ right: 0 }}
                >
                    <div className="bg-[#2A1F3D] rounded-xl p-3 md:p-4 shadow-2xl border border-[#404040] max-w-[calc(100vw-2rem)] md:max-w-2xl mx-auto w-full overflow-x-auto">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                            {/* Current Month Calendar */}
                            <div className="flex-1 w-full md:w-auto">
                                <div className="text-white text-base font-bold text-center mb-3">
                                    {currentMonthName}
                                </div>
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {[
                                        "Su",
                                        "Mo",
                                        "Tu",
                                        "We",
                                        "Th",
                                        "Fr",
                                        "Sa",
                                    ].map((day) => (
                                        <div
                                            key={day}
                                            className="text-[#A0A0A0] text-xs text-center py-1"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {currentMonthDays.map((day, index) => {
                                        if (!day) {
                                            return <div key={index}></div>;
                                        }

                                        const isDisabled =
                                            isDateDisabledForActiveField(
                                                currentYear,
                                                currentMonth,
                                                day
                                            );
                                        const isSelected = isDateSelected(
                                            currentYear,
                                            currentMonth,
                                            day
                                        );
                                        const isInRange = isDateInRange(
                                            currentYear,
                                            currentMonth,
                                            day
                                        );
                                        const isGrayedOut = isDateGrayedOut(
                                            currentYear,
                                            currentMonth,
                                            day
                                        );

                                        return (
                                            <button
                                                key={index}
                                                className={`text-xs py-1.5 rounded transition-colors relative ${
                                                    !day
                                                        ? "cursor-default"
                                                        : isDisabled
                                                        ? "text-[#666] cursor-not-allowed"
                                                        : isSelected
                                                        ? "bg-[#AF7AEB] text-white font-semibold"
                                                        : isInRange
                                                        ? "bg-[#AF7AEB]/30 text-white hover:bg-[#AF7AEB]/40"
                                                        : isGrayedOut
                                                        ? "text-[#888] cursor-pointer hover:bg-[#3A2F4D] hover:text-white"
                                                        : "text-white cursor-pointer hover:bg-[#3A2F4D]"
                                                }`}
                                                onClick={() =>
                                                    !isDisabled &&
                                                    handleDateSelect(
                                                        currentYear,
                                                        currentMonth,
                                                        day
                                                    )
                                                }
                                                disabled={isDisabled}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Next Month Calendar */}
                            <div className="flex-1 w-full md:w-auto">
                                <div className="text-white text-base font-bold text-center mb-3">
                                    {nextMonthName}
                                </div>
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {[
                                        "Su",
                                        "Mo",
                                        "Tu",
                                        "We",
                                        "Th",
                                        "Fr",
                                        "Sa",
                                    ].map((day) => (
                                        <div
                                            key={day}
                                            className="text-[#A0A0A0] text-xs text-center py-1"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {nextMonthDays.map((day, index) => {
                                        if (!day) {
                                            return <div key={index}></div>;
                                        }

                                        const isDisabled =
                                            isDateDisabledForActiveField(
                                                currentYear,
                                                currentMonth + 1,
                                                day
                                            );
                                        const isSelected = isDateSelected(
                                            currentYear,
                                            currentMonth + 1,
                                            day
                                        );
                                        const isInRange = isDateInRange(
                                            currentYear,
                                            currentMonth + 1,
                                            day
                                        );
                                        const isGrayedOut = isDateGrayedOut(
                                            currentYear,
                                            currentMonth + 1,
                                            day
                                        );

                                        return (
                                            <button
                                                key={index}
                                                className={`text-xs py-1.5 rounded transition-colors relative ${
                                                    !day
                                                        ? "cursor-default"
                                                        : isDisabled
                                                        ? "text-[#666] cursor-not-allowed"
                                                        : isSelected
                                                        ? "bg-[#AF7AEB] text-white font-semibold"
                                                        : isInRange
                                                        ? "bg-[#AF7AEB]/30 text-white hover:bg-[#AF7AEB]/40"
                                                        : isGrayedOut
                                                        ? "text-[#888] cursor-pointer hover:bg-[#3A2F4D] hover:text-white"
                                                        : "text-white cursor-pointer hover:bg-[#3A2F4D]"
                                                }`}
                                                onClick={() =>
                                                    !isDisabled &&
                                                    handleDateSelect(
                                                        currentYear,
                                                        currentMonth + 1,
                                                        day
                                                    )
                                                }
                                                disabled={isDisabled}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Buttons for Date Picker */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-[#404040]">
                            <button
                                onClick={handleDateCancel}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-[#404040] text-white text-sm font-medium hover:bg-[#3A2F4D] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDateConfirm}
                                disabled={!tempCheckInDate || !tempCheckOutDate}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[#AF7AEB] text-white text-sm font-semibold hover:bg-[#9575e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
