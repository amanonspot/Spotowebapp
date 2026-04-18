"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGooglePlaces } from "@/lib/hooks/useGooglePlaces";

interface BookingSearchBarProps {
    onSearch?: () => void;
    onWhereChange?: (value: string) => void;
    onCheckInChange?: (value: string) => void;
    onCheckOutChange?: (value: string) => void;
    onGuestsChange?: (value: string) => void;
    initialWhere?: string;
    initialCheckIn?: string;
    initialCheckOut?: string;
    initialGuests?: string;
    forceShow?: boolean; // Force show even when scrolled (for header overlay)
    isOverlay?: boolean; // Render as overlay/modal
    onClose?: () => void; // Close callback for overlay
}

interface LocationSuggestion {
    id: string;
    name: string;
    country: string;
    description?: string;
    icon?: "location" | "city" | "beach" | "nature";
}

interface RecentSearch {
    id: string;
    location: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
}

export default function BookingSearchBar({
    onSearch,
    onWhereChange,
    onCheckInChange,
    onCheckOutChange,
    onGuestsChange,
    initialWhere = "",
    initialCheckIn = "",
    initialCheckOut = "",
    initialGuests = "",
    forceShow = false,
    isOverlay = false,
    onClose,
}: BookingSearchBarProps) {
    const router = useRouter();
    const [isWhereFocused, setIsWhereFocused] = useState(false);
    const [whereValue, setWhereValue] = useState(initialWhere);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
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
    const [isScrolled, setIsScrolled] = useState(false);
    const whereRef = useRef<HTMLInputElement>(null);
    const datePickerRef = useRef<HTMLDivElement>(null);
    const guestRef = useRef<HTMLInputElement>(null);
    
    // Google Places autocomplete
    const { suggestions: placeSuggestions, fetchSuggestions: fetchPlaceSuggestions } = useGooglePlaces();

    // Helper to parse guest display value and set counts
    const parseGuestDisplayValue = (guestText: string) => {
        if (!guestText) return;

        // Parse "X adult(s), Y child(ren), Z assistance animal(s)"
        const adultMatch = guestText.match(/(\d+)\s+adult/i);
        const childMatch = guestText.match(/(\d+)\s+child/i);
        const assistanceMatch = guestText.match(/(\d+)\s+assistance/i);

        if (adultMatch) {
            setAdultCount(parseInt(adultMatch[1], 10));
        }
        if (childMatch) {
            setChildCount(parseInt(childMatch[1], 10));
        }
        if (assistanceMatch) {
            setAssistanceAnimalCount(parseInt(assistanceMatch[1], 10));
        }
    };

    // Initialize from URL params on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlWhere = urlParams.get("where") || "";
        const urlCheckIn = urlParams.get("checkIn") || "";
        const urlCheckOut = urlParams.get("checkOut") || "";
        const urlGuests = urlParams.get("guests") || "";

        // Use URL params if available, otherwise use initial props
        const finalWhere = urlWhere || initialWhere;
        const finalCheckIn = urlCheckIn || initialCheckIn;
        const finalCheckOut = urlCheckOut || initialCheckOut;
        const finalGuests = urlGuests || initialGuests;

        // Update all values
        let needsSync = false;

        if (finalWhere && finalWhere !== whereValue) {
            setWhereValue(finalWhere);
            onWhereChange?.(finalWhere);
            needsSync = true;
        }
        if (finalCheckIn && finalCheckIn !== checkInDate) {
            setCheckInDate(finalCheckIn);
            onCheckInChange?.(finalCheckIn);
            needsSync = true;
        }
        if (finalCheckOut && finalCheckOut !== checkOutDate) {
            setCheckOutDate(finalCheckOut);
            onCheckOutChange?.(finalCheckOut);
            needsSync = true;
        }
        if (finalGuests && finalGuests !== guestDisplayValue) {
            setGuestDisplayValue(finalGuests);
            onGuestsChange?.(finalGuests);
            parseGuestDisplayValue(finalGuests);
            needsSync = true;
        }

        // Dispatch initial sync event if we have any values
        if (needsSync || finalWhere || finalCheckIn || finalCheckOut || finalGuests) {
            window.dispatchEvent(
                new CustomEvent("searchBarUpdate", {
                    detail: {
                        where: finalWhere || whereValue,
                        checkIn: finalCheckIn || checkInDate,
                        checkOut: finalCheckOut || checkOutDate,
                        guests: finalGuests || guestDisplayValue,
                    },
                })
            );
        }
    }, []); // Only run once on mount

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsScrolled(scrollY > 100);
        };

        // Check initial scroll position
        handleScroll();

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Update state when initial values change (only if they're different)
    useEffect(() => {
        if (initialWhere !== whereValue) {
            setWhereValue(initialWhere);
            // Dispatch event when prop changes
            window.dispatchEvent(
                new CustomEvent("searchBarUpdate", {
                    detail: { where: initialWhere },
                })
            );
        }
    }, [initialWhere]);

    useEffect(() => {
        if (initialCheckIn !== checkInDate) {
            setCheckInDate(initialCheckIn);
            window.dispatchEvent(
                new CustomEvent("searchBarUpdate", {
                    detail: { checkIn: initialCheckIn },
                })
            );
        }
    }, [initialCheckIn]);

    useEffect(() => {
        if (initialCheckOut !== checkOutDate) {
            setCheckOutDate(initialCheckOut);
            window.dispatchEvent(
                new CustomEvent("searchBarUpdate", {
                    detail: { checkOut: initialCheckOut },
                })
            );
        }
    }, [initialCheckOut]);

    useEffect(() => {
        if (initialGuests !== guestDisplayValue) {
            setGuestDisplayValue(initialGuests);
            window.dispatchEvent(
                new CustomEvent("searchBarUpdate", {
                    detail: { guests: initialGuests },
                })
            );
        }
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

    // Load recent searches from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("spoto_recent_searches");
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            } catch (e) {
                console.error("Error loading recent searches:", e);
            }
        }
    }, []);

    // Save recent search when a search is performed
    const saveRecentSearch = (location: string) => {
        const newSearch: RecentSearch = {
            id: Date.now().toString(),
            location,
            checkIn: checkInDate || undefined,
            checkOut: checkOutDate || undefined,
            guests: guestDisplayValue || undefined,
        };

        const updated = [
            newSearch,
            ...recentSearches.filter((s) => s.location !== location),
        ].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem("spoto_recent_searches", JSON.stringify(updated));
    };

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
                icon: "city" as const
            }));
            
            setSuggestions(transformedSuggestions);
        }
    }, [placeSuggestions]);

    // Handle click outside to close modals
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                whereRef.current &&
                !whereRef.current.contains(event.target as Node)
            ) {
                setIsWhereFocused(false);
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

    const handleWhereChange = (value: string) => {
        setWhereValue(value);
        onWhereChange?.(value);
        // Dispatch event to sync with header
        window.dispatchEvent(new CustomEvent('searchBarUpdate', {
            detail: { where: value }
        }));
    };

    const handleSuggestionClick = (suggestion: LocationSuggestion) => {
        const fullLocation = `${suggestion.name}, ${suggestion.country}`;
        setWhereValue(fullLocation);
        onWhereChange?.(fullLocation);
        setIsWhereFocused(false);
        // Dispatch event to sync with header
        window.dispatchEvent(new CustomEvent('searchBarUpdate', {
            detail: { where: fullLocation }
        }));
    };

    const handleRecentSearchClick = (search: RecentSearch) => {
        setWhereValue(search.location);
        onWhereChange?.(search.location);
        if (search.checkIn) {
            setCheckInDate(search.checkIn);
            onCheckInChange?.(search.checkIn);
        }
        if (search.checkOut) {
            setCheckOutDate(search.checkOut);
            onCheckOutChange?.(search.checkOut);
        }
        if (search.guests) {
            setGuestDisplayValue(search.guests);
            onGuestsChange?.(search.guests);
        }
        setIsWhereFocused(false);
        // Dispatch event to sync with header
        window.dispatchEvent(new CustomEvent('searchBarUpdate', {
            detail: { 
                where: search.location,
                checkIn: search.checkIn || "",
                checkOut: search.checkOut || "",
                guests: search.guests || ""
            }
        }));
    };

    const handleSearchClick = () => {
        if (whereValue.trim()) {
            saveRecentSearch(whereValue);
        }

        // Build URL with search parameters
        const queryParams = new URLSearchParams();
        if (whereValue.trim()) queryParams.set("where", whereValue.trim());
        if (checkInDate) queryParams.set("checkIn", checkInDate);
        if (checkOutDate) queryParams.set("checkOut", checkOutDate);
        if (guestDisplayValue) queryParams.set("guests", guestDisplayValue);

        // Navigate to search page with params
        const searchUrl = `/search?${queryParams.toString()}`;
        router.push(searchUrl);

        // Close overlay if in overlay mode
        if (isOverlay) {
            onClose?.();
        }

        // Also call the callback if provided (for backward compatibility)
        onSearch?.();
    };

    const handleDateFieldClick = (fieldType: "checkin" | "checkout") => {
        setActiveDateField(fieldType);
        setIsDatePickerOpen(true);
        setIsWhereFocused(false);
        setIsGuestModalOpen(false);
        // Dispatch events for date changes
        window.dispatchEvent(new CustomEvent('searchBarUpdate', {
            detail: { 
                checkIn: checkInDate,
                checkOut: checkOutDate
            }
        }));
    };

    const handleGuestFieldClick = () => {
        setIsGuestModalOpen(true);
        setIsWhereFocused(false);
        setIsDatePickerOpen(false);
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

        // Parse existing dates with proper timezone handling
        const checkInParsed = parseDateString(checkInDate);
        const checkOutParsed = parseDateString(checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Based on which field is active, update accordingly
        if (activeDateField === "checkin") {
            // If clicking on the same check-in date, clear it
            if (
                checkInParsed &&
                selectedDate.getTime() === checkInParsed.getTime()
            ) {
                setCheckInDate("");
                onCheckInChange?.("");
                // Clear check-out if check-in is cleared
                if (checkOutParsed) {
                    setCheckOutDate("");
                    onCheckOutChange?.("");
                }
            } else if (selectedDate >= today) {
                // Set or update check-in date
                setCheckInDate(formattedDate);
                onCheckInChange?.(formattedDate);
                
                // Dispatch event for sync
                window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                    detail: { checkIn: formattedDate }
                }));

                // If new check-in is after check-out, clear check-out
                if (checkOutParsed && selectedDate >= checkOutParsed) {
                    setCheckOutDate("");
                    onCheckOutChange?.("");
                    window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                        detail: { checkOut: "" }
                    }));
                }

                // Automatically switch to check-out selection after selecting check-in
                setActiveDateField("checkout");
            }
        } else if (activeDateField === "checkout") {
            // If clicking on the same check-out date, clear it
            if (
                checkOutParsed &&
                selectedDate.getTime() === checkOutParsed.getTime()
            ) {
                setCheckOutDate("");
                onCheckOutChange?.("");
                window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                    detail: { checkOut: "" }
                }));
            } else if (selectedDate >= today) {
                // Can only set check-out if check-in is selected and selected date is after check-in
                if (checkInParsed && selectedDate > checkInParsed) {
                    setCheckOutDate(formattedDate);
                    onCheckOutChange?.(formattedDate);
                    window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                        detail: { checkOut: formattedDate }
                    }));
                } else if (!checkInParsed) {
                    // If no check-in, set it first, then automatically switch to check-out
                    setCheckInDate(formattedDate);
                    onCheckInChange?.(formattedDate);
                    window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                        detail: { checkIn: formattedDate }
                    }));
                    // Keep checkout field active for next selection
                } else if (checkInParsed && selectedDate <= checkInParsed) {
                    // If selected date is before or equal to check-in, update check-in instead
                    setCheckInDate(formattedDate);
                    onCheckInChange?.(formattedDate);
                    window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                        detail: { checkIn: formattedDate }
                    }));
                    // Clear check-out and keep checkout field active
                    if (checkOutParsed) {
                        setCheckOutDate("");
                        onCheckOutChange?.("");
                        window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                            detail: { checkOut: "" }
                        }));
                    }
                }
            }
        } else {
            // Fallback: if no active field, use smart selection logic
            if (!checkInDate || !checkInParsed) {
                setCheckInDate(formattedDate);
                onCheckInChange?.(formattedDate);
                window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                    detail: { checkIn: formattedDate }
                }));
                // Automatically switch to check-out selection
                setActiveDateField("checkout");
            } else if (checkInParsed && selectedDate > checkInParsed) {
                setCheckOutDate(formattedDate);
                onCheckOutChange?.(formattedDate);
                window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                    detail: { checkOut: formattedDate }
                }));
            } else if (checkInParsed && selectedDate <= checkInParsed) {
                setCheckInDate(formattedDate);
                onCheckInChange?.(formattedDate);
                window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                    detail: { checkIn: formattedDate }
                }));
                if (checkOutParsed) {
                    setCheckOutDate("");
                    onCheckOutChange?.("");
                    window.dispatchEvent(new CustomEvent('searchBarUpdate', {
                        detail: { checkOut: "" }
                    }));
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
        const checkInParsed = parseDateString(checkInDate);
        const checkOutParsed = parseDateString(checkOutDate);

        // When selecting check-out, gray out dates before or equal to check-in
        if (activeDateField === "checkout") {
            if (checkInParsed && date <= checkInParsed) {
                return true;
            }
        }
        // When selecting check-in, gray out dates that are before or equal to current check-in (if exists)
        else if (activeDateField === "checkin") {
            if (checkInParsed && date <= checkInParsed) {
                return true;
            }
        }
        // Default behavior: gray out dates before check-in
        else if (checkInParsed && date <= checkInParsed) {
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
        const checkInParsed = parseDateString(checkInDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Always disable past dates
        if (date < today) {
            return true;
        }

        // When selecting check-out, disable dates before or equal to check-in
        if (activeDateField === "checkout") {
            if (!checkInParsed) {
                // If no check-in, all future dates are enabled (will set check-in first)
                return false;
            }
            if (date <= checkInParsed) {
                return true;
            }
        }
        // When selecting check-in, only disable past dates (already handled above)
        // Allow selecting any future date for check-in

        return false;
    };

    // Check if date is in selected range
    const isDateInRange = (year: number, month: number, day: number) => {
        if (!checkInDate || !checkOutDate) return false;

        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const checkInParsed = parseDateString(checkInDate);
        const checkOutParsed = parseDateString(checkOutDate);

        if (!checkInParsed || !checkOutParsed) return false;

        return date > checkInParsed && date < checkOutParsed;
    };

    // Check if date is selected (highlight both check-in and check-out when they have values)
    const isDateSelected = (year: number, month: number, day: number) => {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);

        const checkInParsed = parseDateString(checkInDate);
        const checkOutParsed = parseDateString(checkOutDate);

        // Always show both dates as selected if they have values
        if (checkInParsed && date.getTime() === checkInParsed.getTime())
            return true;
        if (checkOutParsed && date.getTime() === checkOutParsed.getTime())
            return true;

        return false;
    };

    const handleGuestCountChange = (
        type: "adult" | "child" | "assistance",
        increment: boolean
    ) => {
        let newAdultCount = adultCount;
        let newChildCount = childCount;
        let newAssistanceCount = assistanceAnimalCount;

        if (type === "adult") {
            newAdultCount = increment
                ? adultCount + 1
                : Math.max(0, adultCount - 1);
            setAdultCount(newAdultCount);
        } else if (type === "child") {
            newChildCount = increment
                ? childCount + 1
                : Math.max(0, childCount - 1);
            setChildCount(newChildCount);
        } else if (type === "assistance") {
            newAssistanceCount = increment
                ? assistanceAnimalCount + 1
                : Math.max(0, assistanceAnimalCount - 1);
            setAssistanceAnimalCount(newAssistanceCount);
        }

        // Create detailed guest display text
        const guestParts = [];
        if (newAdultCount > 0) {
            guestParts.push(
                `${newAdultCount} adult${newAdultCount > 1 ? "s" : ""}`
            );
        }
        if (newChildCount > 0) {
            guestParts.push(
                `${newChildCount} child${newChildCount > 1 ? "ren" : ""}`
            );
        }
        if (newAssistanceCount > 0) {
            guestParts.push(
                `${newAssistanceCount} assistance animal${
                    newAssistanceCount > 1 ? "s" : ""
                }`
            );
        }

        const guestText = guestParts.length > 0 ? guestParts.join(", ") : "";
        setGuestDisplayValue(guestText);
        onGuestsChange?.(guestText);
        // Dispatch event to sync with header
        window.dispatchEvent(new CustomEvent('searchBarUpdate', {
            detail: { guests: guestText }
        }));
    };

    // Don't render if scrolled (will show in header instead) unless forced
    if (isScrolled && !forceShow) {
        return null;
    }

    // If overlay mode, render in a fixed overlay container
    if (isOverlay) {
    return (
            <>
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={onClose}
                />
                {/* Overlay Content */}
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 overflow-y-auto">
                    <div 
                        className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl mb-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            {/* Close button */}
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5 text-gray-600"
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
                            </div>
                            {/* Search Bar Content */}
                            <div className="w-full relative">
            {/* Mobile Search Bar */}
            <div className="md:hidden">
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-lg" onClick={handleSearchClick}>
                    {/* Search icon */}
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
                    </div>

                    {/* Search text */}
                    <span className="text-gray-700 text-sm flex-1 font-medium">
                        {whereValue || "Where to?"} ·{" "}
                        {checkInDate || "Any week"} ·{" "}
                        {guestDisplayValue || "Add guests"}
                    </span>

                    {/* Filter icon */}
                    <div className="relative">
                        <svg
                            className="w-5 h-5 text-gray-600"
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
                    </div>
                </div>
            </div>

            {/* Medium Screen Search Bar (820x1180 and similar) */}
            <div className="hidden lg:block xl:hidden p-4">
                <div className="bg-white rounded-2xl p-4 flex flex-col gap-4 shadow-lg border border-gray-300">
                    {/* First Row - Where and Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Where */}
                        <div className="flex-1 relative" ref={whereRef}>
                            <label className="text-gray-900 text-sm font-semibold block mb-2">
                                Where
                            </label>
                            <input
                                type="text"
                                placeholder="Search destinations"
                                value={whereValue}
                                className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base border border-gray-200 rounded-lg px-3 py-2"
                                onChange={(e) =>
                                    handleWhereChange(e.target.value)
                                }
                                onFocus={() => setIsWhereFocused(true)}
                            />

                            {/* Location Suggestions Modal */}
                            {isWhereFocused && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-[400px] md:max-h-[500px] overflow-y-auto animate-fadeInSlideDown">
                                    {whereValue.trim() === "" ? (
                                        <>
                                            {/* Recent Searches Section */}
                                            {recentSearches.length > 0 && (
                                                <div className="py-2">
                                                    <div className="px-4 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                        Recent searches
                                                    </div>
                                                    {recentSearches.map(
                                                        (search, index) => (
                                                            <button
                                                                key={search.id}
                                                                className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                                onClick={() =>
                                                                    handleRecentSearchClick(
                                                                        search
                                                                    )
                                                                }
                                                                style={{
                                                                    animationDelay: `${
                                                                        index * 30
                                                                    }ms`,
                                                                }}
                                                            >
                                                                <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-100 group-hover:bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                                                                    <svg
                                                                        className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 group-hover:text-purple-600 transition-colors"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-gray-900 font-semibold text-sm md:text-[15px] leading-tight group-hover:text-purple-900 transition-colors">
                                                                        {
                                                                            search.location
                                                                        }
                                                                    </div>
                                                                    <div className="text-gray-500 text-xs md:text-[13px] flex items-center gap-2 mt-0.5">
                                                                        {search.checkIn &&
                                                                            search.checkOut && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <svg
                                                                                        className="w-3 h-3 md:w-3.5 md:h-3.5"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                        />
                                                                                    </svg>
                                                                                    {
                                                                                        search.checkIn
                                                                                    }{" "}
                                                                                    -{" "}
                                                                                    {
                                                                                        search.checkOut
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        {search.guests && (
                                                                            <span className="flex items-center gap-1">
                                                                                <svg
                                                                                    className="w-3 h-3 md:w-3.5 md:h-3.5"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={
                                                                                            2
                                                                                        }
                                                                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                                                    />
                                                                                </svg>
                                                                                {
                                                                                    search.guests
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            {/* Suggested Destinations Section */}
                                            <div
                                                className={`py-2 ${
                                                    recentSearches.length > 0
                                                        ? "border-t border-gray-100"
                                                        : ""
                                                }`}
                                            >
                                                <div className="px-4 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    Suggested destinations
                                                </div>
                                                {suggestedDestinations.map(
                                                    (destination, index) => (
                                                        <button
                                                            key={destination.id}
                                                            className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                            onClick={() =>
                                                                handleSuggestionClick(
                                                                    destination
                                                                )
                                                            }
                                                            style={{
                                                                animationDelay: `${
                                                                    index * 30
                                                                }ms`,
                                                            }}
                                                        >
                                                            <div className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 shadow-sm group-hover:shadow">
                                                                <div className="text-gray-700 group-hover:text-purple-600 transition-colors">
                                                                    {getIcon(
                                                                        destination.icon
                                                                    )}
                                                                </div>
                                                            </div>
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
                                                            className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                            onClick={() =>
                                                handleSuggestionClick(
                                                    suggestion
                                                )
                                            }
                                                            style={{
                                                                animationDelay: `${
                                                                    index * 30
                                                                }ms`,
                                                            }}
                                        >
                                                            <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-100 group-hover:bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                                                <svg
                                                                    className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 group-hover:text-purple-600 transition-colors"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                            </div>
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
                        <div className="flex-1 relative">
                            <label className="text-gray-900 text-sm font-semibold block mb-2">
                                Check in
                            </label>
                            <div className="relative">
                            <input
                                type="text"
                                placeholder="Add dates"
                                value={checkInDate}
                                    className={`w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base border border-gray-200 rounded-lg px-3 py-2 cursor-pointer pr-8 ${
                                        (activeDateField === "checkin" ||
                                            (activeDateField === "checkout" &&
                                                checkInDate &&
                                                checkOutDate)) &&
                                        isDatePickerOpen
                                            ? "text-[#AF7AEB] border-[#AF7AEB]"
                                            : ""
                                    }`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDateFieldClick("checkin");
                                    }}
                                readOnly
                            />
                                {checkInDate && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCheckInDate("");
                                            onCheckInChange?.("");
                                            // Also clear check-out if check-in is cleared
                                            if (checkOutDate) {
                                                setCheckOutDate("");
                                                onCheckOutChange?.("");
                                            }
                                            setIsDatePickerOpen(false);
                                            setActiveDateField(null);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                        aria-label="Clear check-in date"
                                    >
                                        <svg
                                            className="w-4 h-4 text-gray-600"
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
                        <div className="flex-1 relative">
                            <label className="text-gray-900 text-sm font-semibold block mb-2">
                                Check out
                            </label>
                            <div className="relative">
                            <input
                                type="text"
                                placeholder="Add dates"
                                value={checkOutDate}
                                    className={`w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base border border-gray-200 rounded-lg px-3 py-2 cursor-pointer pr-8 ${
                                        (activeDateField === "checkout" ||
                                            (activeDateField === "checkin" &&
                                                checkInDate &&
                                                checkOutDate)) &&
                                        isDatePickerOpen
                                            ? "text-[#AF7AEB] border-[#AF7AEB]"
                                            : ""
                                    }`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDateFieldClick("checkout");
                                    }}
                                readOnly
                            />
                                {checkOutDate && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCheckOutDate("");
                                            onCheckOutChange?.("");
                                            setIsDatePickerOpen(false);
                                            setActiveDateField(null);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                        aria-label="Clear check-out date"
                                    >
                                        <svg
                                            className="w-4 h-4 text-gray-600"
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
                    </div>

                    {/* Second Row - Guests and Search */}
                    <div className="flex items-end gap-4">
                        {/* Who */}
                        <div className="flex-1 relative" ref={guestRef}>
                            <label className="text-gray-900 text-sm font-semibold block mb-2">
                                Who
                            </label>
                            <input
                                type="text"
                                placeholder="Add guests"
                                value={guestDisplayValue}
                                className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base border border-gray-200 rounded-lg px-3 py-2 cursor-pointer"
                                onClick={handleGuestFieldClick}
                                readOnly
                            />

                            {/* Guest Selection Modal */}
                            {isGuestModalOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="p-4">
                                        {/* Ages 13 or above */}
                                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                            <div>
                                                <div className="text-gray-900 font-medium">
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
                                                    disabled={adultCount === 0}
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                                <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                    {adultCount}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleGuestCountChange(
                                                            "adult",
                                                            true
                                                        )
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                            <div>
                                                <div className="text-gray-900 font-medium">
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
                                                    disabled={childCount === 0}
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                                <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                    {childCount}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleGuestCountChange(
                                                            "child",
                                                            true
                                                        )
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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

                                        {/* Bringing an assistance animal */}
                                        <div className="flex items-center justify-between py-3">
                                            <div>
                                                <div className="text-gray-900 font-medium">
                                                    Bringing an assistance
                                                    animal?
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() =>
                                                        handleGuestCountChange(
                                                            "assistance",
                                                            false
                                                        )
                                                    }
                                                    disabled={
                                                        assistanceAnimalCount ===
                                                        0
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                                <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                    {assistanceAnimalCount}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleGuestCountChange(
                                                            "assistance",
                                                            true
                                                        )
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search button */}
                        <button
                            className="bg-[#AF7AEB] px-6 py-2 rounded-lg hover:bg-[#9575e6] transition-colors shadow-lg flex items-center gap-2 font-montserrat font-semibold"
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
                            <span className="text-white font-medium">
                                Search
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Large Desktop Search Bar */}
            <div className="hidden xl:block p-6">
                <div className="bg-white rounded-full p-4 flex items-center gap-0 shadow-lg border border-gray-300">
                    {/* Where */}
                    <div
                        className="flex-1 px-4 border-r border-gray-200 relative"
                        ref={whereRef}
                    >
                        <label className="text-gray-900 text-sm font-semibold block mb-1">
                            Where
                        </label>
                        <input
                            type="text"
                            placeholder="Search destinations"
                            value={whereValue}
                            className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base"
                            onChange={(e) => handleWhereChange(e.target.value)}
                            onFocus={() => setIsWhereFocused(true)}
                        />

                        {/* Location Suggestions Modal */}
                        {isWhereFocused && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-[400px] md:max-h-[500px] overflow-y-auto animate-fadeInSlideDown">
                                {whereValue.trim() === "" ? (
                                    <>
                                        {/* Recent Searches Section */}
                                        {recentSearches.length > 0 && (
                                            <div className="py-2">
                                                <div className="px-4 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    Recent searches
                                                </div>
                                                {recentSearches.map(
                                                    (search, index) => (
                                                        <button
                                                            key={search.id}
                                                            className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                            onClick={() =>
                                                                handleRecentSearchClick(
                                                                    search
                                                                )
                                                            }
                                                        >
                                                            <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-100 group-hover:bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                                                                <svg
                                                                    className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 group-hover:text-purple-600 transition-colors"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-gray-900 font-semibold text-sm md:text-[15px] leading-tight group-hover:text-purple-900 transition-colors">
                                                                    {
                                                                        search.location
                                                                    }
                                                                </div>
                                                                <div className="text-gray-500 text-xs md:text-[13px] flex items-center gap-2 mt-0.5">
                                                                    {search.checkIn &&
                                                                        search.checkOut && (
                                                                            <span className="flex items-center gap-1">
                                                                                <svg
                                                                                    className="w-3 h-3 md:w-3.5 md:h-3.5"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={
                                                                                            2
                                                                                        }
                                                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                    />
                                                                                </svg>
                                                                                {
                                                                                    search.checkIn
                                                                                }{" "}
                                                                                -{" "}
                                                                                {
                                                                                    search.checkOut
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    {search.guests && (
                                                                        <span className="flex items-center gap-1">
                                                                            <svg
                                                                                className="w-3 h-3 md:w-3.5 md:h-3.5"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                                                />
                                                                            </svg>
                                                                            {
                                                                                search.guests
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {/* Suggested Destinations Section */}
                                        <div
                                            className={`py-2 ${
                                                recentSearches.length > 0
                                                    ? "border-t border-gray-100"
                                                    : ""
                                            }`}
                                        >
                                            <div className="px-4 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Suggested destinations
                                            </div>
                                            {suggestedDestinations.map(
                                                (destination, index) => (
                                                    <button
                                                        key={destination.id}
                                                        className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                        onClick={() =>
                                                            handleSuggestionClick(
                                                                destination
                                                            )
                                                        }
                                                    >
                                                        <div className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 shadow-sm group-hover:shadow">
                                                            <div className="text-gray-700 group-hover:text-purple-600 transition-colors">
                                                                {getIcon(
                                                                    destination.icon
                                                                )}
                                                            </div>
                                                        </div>
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
                                                        className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                        onClick={() =>
                                                            handleSuggestionClick(
                                                                suggestion
                                                            )
                                        }
                                    >
                                                        <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-100 group-hover:bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                                            <svg
                                                                className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 group-hover:text-purple-600 transition-colors"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                        </div>
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
                    <div className="flex-1 px-4 border-r border-gray-200 relative">
                        <label className="text-gray-900 text-sm font-semibold block mb-1">
                            Check in
                        </label>
                        <div className="relative">
                        <input
                            type="text"
                            placeholder="Add dates"
                            value={checkInDate}
                                className={`w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base cursor-pointer pr-8 ${
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
                            {checkInDate && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCheckInDate("");
                                        onCheckInChange?.("");
                                        // Also clear check-out if check-in is cleared
                                        if (checkOutDate) {
                                            setCheckOutDate("");
                                            onCheckOutChange?.("");
                                        }
                                        setIsDatePickerOpen(false);
                                        setActiveDateField(null);
                                    }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Clear check-in date"
                                >
                                    <svg
                                        className="w-4 h-4 text-gray-600"
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
                    <div className="flex-1 px-4 border-r border-gray-200 relative">
                        <label className="text-gray-900 text-sm font-semibold block mb-1">
                            Check out
                        </label>
                        <div className="relative">
                        <input
                            type="text"
                            placeholder="Add dates"
                            value={checkOutDate}
                                className={`w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base cursor-pointer pr-8 ${
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
                            {checkOutDate && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCheckOutDate("");
                                        onCheckOutChange?.("");
                                        setIsDatePickerOpen(false);
                                        setActiveDateField(null);
                                    }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Clear check-out date"
                                >
                                    <svg
                                        className="w-4 h-4 text-gray-600"
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
                    <div className="flex-1 px-4 relative" ref={guestRef}>
                        <label className="text-gray-900 text-sm font-semibold block mb-1">
                            Who
                        </label>
                        <input
                            type="text"
                            placeholder="Add guests"
                            value={guestDisplayValue}
                            className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base cursor-pointer"
                            onClick={handleGuestFieldClick}
                            readOnly
                        />

                        {/* Guest Selection Modal */}
                        {isGuestModalOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <div className="p-4">
                                    {/* Ages 13 or above */}
                                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                        <div>
                                            <div className="text-gray-900 font-medium">
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
                                                disabled={adultCount === 0}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                            <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                {adultCount}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "adult",
                                                        true
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                        <div>
                                            <div className="text-gray-900 font-medium">
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
                                                disabled={childCount === 0}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                            <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                {childCount}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "child",
                                                        true
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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

                                    {/* Bringing an assistance animal */}
                                    <div className="flex items-center justify-between py-3">
                                        <div>
                                            <div className="text-gray-900 font-medium">
                                                Bringing an assistance animal?
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "assistance",
                                                        false
                                                    )
                                                }
                                                disabled={
                                                    assistanceAnimalCount === 0
                                                }
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                            <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                {assistanceAnimalCount}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "assistance",
                                                        true
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search button */}
                    <button
                        className="bg-[#AF7AEB] p-3 rounded-full hover:bg-[#9575e6] transition-colors ml-4 shadow-lg font-montserrat font-semibold"
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
                    className={`absolute top-full left-0 right-0 mt-2 ${isOverlay ? 'z-[60]' : 'z-50'}`}
                    ref={datePickerRef}
                >
                    <div className="bg-white rounded-xl p-4 shadow-2xl border border-gray-200 max-w-2xl mx-auto">
                        <div className="flex gap-6">
                                            {/* Current Month Calendar */}
                            <div className="flex-1">
                                <div className="text-gray-900 text-base font-bold text-center mb-3">
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
                                            className="text-gray-600 text-xs text-center py-1"
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
                                                                        ? "text-gray-400 cursor-not-allowed"
                                                                        : isSelected
                                                                        ? "bg-[#AF7AEB] text-white font-semibold"
                                                                        : isInRange
                                                                        ? "bg-[#AF7AEB]/30 text-white hover:bg-[#AF7AEB]/40"
                                                                        : isGrayedOut
                                                                        ? "text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                                                                        : "text-gray-900 cursor-pointer hover:bg-gray-100"
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
                            <div className="flex-1">
                                <div className="text-gray-900 text-base font-bold text-center mb-3">
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
                                            className="text-gray-600 text-xs text-center py-1"
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
                                                                        ? "text-gray-400 cursor-not-allowed"
                                                                        : isSelected
                                                                        ? "bg-[#AF7AEB] text-white font-semibold"
                                                                        : isInRange
                                                                        ? "bg-[#AF7AEB]/30 text-white hover:bg-[#AF7AEB]/40"
                                                                        : isGrayedOut
                                                                        ? "text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                                                                        : "text-gray-900 cursor-pointer hover:bg-gray-100"
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
                    </div>
                </div>
            )}
        </div>
                        </div>
                    </div>
                </div>
            </>
    );
}

    return (
        <div className="w-full px-4 z-20 relative pt-4 sm:pt-6" data-main-search-bar>
            {/* Mobile Search Bar */}
            <div className="md:hidden">
                <div className="bg-white rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-lg" onClick={handleSearchClick}>
                    {/* Search icon */}
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
        </div>

                    {/* Search text */}
                    <span className="text-gray-700 text-sm flex-1 font-medium">
                        {whereValue || "Where to?"} ·{" "}
                        {checkInDate || "Any week"} ·{" "}
                        {guestDisplayValue || "Add guests"}
                    </span>

                    {/* Filter icon */}
                    <div className="relative">
                        <svg
                            className="w-5 h-5 text-gray-600"
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
                    </div>
                </div>
            </div>

            {/* Medium Screen Search Bar (820x1180 and similar) */}
            <div className="hidden lg:block xl:hidden p-4">
                <div className="bg-white rounded-2xl p-4 flex flex-col gap-4 shadow-lg border border-gray-300">
                    {/* First Row - Where and Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Where */}
                        <div className="flex-1 relative" ref={whereRef}>
                            <label className="text-gray-900 text-sm font-semibold block mb-2">
                                Where
                            </label>
                            <input
                                type="text"
                                placeholder="Search destinations"
                                value={whereValue}
                                className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base border border-gray-200 rounded-lg px-3 py-2"
                                onChange={(e) =>
                                    handleWhereChange(e.target.value)
                                }
                                onFocus={() => setIsWhereFocused(true)}
                            />
                            {/* Location Suggestions - Same as overlay, but rendered inline */}
                            {isWhereFocused && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-[400px] md:max-h-[500px] overflow-y-auto animate-fadeInSlideDown">
                                    {whereValue.trim() === "" ? (
                                        <>
                                            {/* Recent Searches Section */}
                                            {recentSearches.length > 0 && (
                                                <div className="py-2">
                                                    <div className="px-4 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                        Recent searches
                                                    </div>
                                                    {recentSearches.map(
                                                        (search, index) => (
                                                            <button
                                                                key={search.id}
                                                                className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                                onClick={() =>
                                                                    handleRecentSearchClick(
                                                                        search
                                                                    )
                                                                }
                                                            >
                                                                <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-100 group-hover:bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                                                                    <svg
                                                                        className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 group-hover:text-purple-600 transition-colors"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-gray-900 font-semibold text-sm md:text-[15px] leading-tight group-hover:text-purple-900 transition-colors">
                                                                        {
                                                                            search.location
                                                                        }
                                                                    </div>
                                                                    <div className="text-gray-500 text-xs md:text-[13px] flex items-center gap-2 mt-0.5">
                                                                        {search.checkIn &&
                                                                            search.checkOut && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <svg
                                                                                        className="w-3 h-3 md:w-3.5 md:h-3.5"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path
                                                                                            strokeLinecap="round"
                                                                                            strokeLinejoin="round"
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                                                        />
                                                                                    </svg>
                                                                                    {
                                                                                        search.checkIn
                                                                                    }{" "}
                                                                                    -{" "}
                                                                                    {
                                                                                        search.checkOut
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        {search.guests && (
                                                                            <span className="flex items-center gap-1">
                                                                                <svg
                                                                                    className="w-3 h-3 md:w-3.5 md:h-3.5"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    viewBox="0 0 24 24"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={
                                                                                            2
                                                                                        }
                                                                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                                                    />
                                                                                </svg>
                                                                                {
                                                                                    search.guests
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}

                                            {/* Suggested Destinations Section */}
                                            <div
                                                className={`py-2 ${
                                                    recentSearches.length > 0
                                                        ? "border-t border-gray-100"
                                                        : ""
                                                }`}
                                            >
                                                <div className="px-4 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    Suggested destinations
                                                </div>
                                                {suggestedDestinations.map(
                                                    (destination, index) => (
                                                        <button
                                                            key={destination.id}
                                                            className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                            onClick={() =>
                                                                handleSuggestionClick(
                                                                    destination
                                                                )
                                                            }
                                                        >
                                                            <div className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 shadow-sm group-hover:shadow">
                                                                <div className="text-gray-700 group-hover:text-purple-600 transition-colors">
                                                                    {getIcon(
                                                                        destination.icon
                                                                    )}
                                                                </div>
                                                            </div>
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
                                                            className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                            onClick={() =>
                                                                handleSuggestionClick(
                                                                    suggestion
                                                                )
                                                            }
                                                        >
                                                            <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-100 group-hover:bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                                                                <svg
                                                                    className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 group-hover:text-purple-600 transition-colors"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                                    />
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                                    />
                                                                </svg>
                                                            </div>
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
                        <div className="flex-1 relative">
                            <label className="text-gray-900 text-sm font-semibold block mb-2">
                                Check in
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Add dates"
                                    value={checkInDate}
                                    className={`w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base border border-gray-200 rounded-lg px-3 py-2 cursor-pointer pr-8 ${
                                        (activeDateField === "checkin" ||
                                            (activeDateField === "checkout" &&
                                                checkInDate &&
                                                checkOutDate)) &&
                                        isDatePickerOpen
                                            ? "text-[#AF7AEB] border-[#AF7AEB]"
                                            : ""
                                    }`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDateFieldClick("checkin");
                                    }}
                                    readOnly
                                />
                                {checkInDate && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCheckInDate("");
                                            onCheckInChange?.("");
                                            if (checkOutDate) {
                                                setCheckOutDate("");
                                                onCheckOutChange?.("");
                                            }
                                            setIsDatePickerOpen(false);
                                            setActiveDateField(null);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                        aria-label="Clear check-in date"
                                    >
                                        <svg
                                            className="w-4 h-4 text-gray-600"
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
                        <div className="flex-1 relative">
                            <label className="text-gray-900 text-sm font-semibold block mb-2">
                                Check out
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Add dates"
                                    value={checkOutDate}
                                    className={`w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base border border-gray-200 rounded-lg px-3 py-2 cursor-pointer pr-8 ${
                                        (activeDateField === "checkout" ||
                                            (activeDateField === "checkin" &&
                                                checkInDate &&
                                                checkOutDate)) &&
                                        isDatePickerOpen
                                            ? "text-[#AF7AEB] border-[#AF7AEB]"
                                            : ""
                                    }`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDateFieldClick("checkout");
                                    }}
                                    readOnly
                                />
                                {checkOutDate && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCheckOutDate("");
                                            onCheckOutChange?.("");
                                            setIsDatePickerOpen(false);
                                            setActiveDateField(null);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                        aria-label="Clear check-out date"
                                    >
                                        <svg
                                            className="w-4 h-4 text-gray-600"
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
                    </div>
                    {/* Second Row - Guests and Search */}
                    <div className="flex items-end gap-4">
                        {/* Who */}
                        <div className="flex-1 relative" ref={guestRef}>
                            <label className="text-gray-900 text-sm font-semibold block mb-2">
                                Who
                            </label>
                            <input
                                type="text"
                                placeholder="Add guests"
                                value={guestDisplayValue}
                                className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base border border-gray-200 rounded-lg px-3 py-2 cursor-pointer"
                                onClick={handleGuestFieldClick}
                                readOnly
                            />
                            {/* Guest Selection Modal - Same structure as overlay */}
                            {isGuestModalOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="p-4">
                                        {/* Ages 13 or above */}
                                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                            <div>
                                                <div className="text-gray-900 font-medium">
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
                                                    disabled={adultCount === 0}
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                                <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                    {adultCount}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleGuestCountChange(
                                                            "adult",
                                                            true
                                                        )
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                            <div>
                                                <div className="text-gray-900 font-medium">
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
                                                    disabled={childCount === 0}
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                                <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                    {childCount}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleGuestCountChange(
                                                            "child",
                                                            true
                                                        )
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                        {/* Bringing an assistance animal */}
                                        <div className="flex items-center justify-between py-3">
                                            <div>
                                                <div className="text-gray-900 font-medium">
                                                    Bringing an assistance animal?
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() =>
                                                        handleGuestCountChange(
                                                            "assistance",
                                                            false
                                                        )
                                                    }
                                                    disabled={
                                                        assistanceAnimalCount === 0
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                                <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                    {assistanceAnimalCount}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleGuestCountChange(
                                                            "assistance",
                                                            true
                                                        )
                                                    }
                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-gray-600"
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
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Search button */}
                        <button
                            className="bg-[#AF7AEB] px-6 py-2 rounded-lg hover:bg-[#9575e6] transition-colors shadow-lg flex items-center gap-2 font-montserrat font-semibold"
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
                            <span className="text-white font-medium">
                                Search
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            {/* Large Desktop Search Bar - Similar structure */}
            <div className="hidden xl:block p-6">
                <div className="bg-white rounded-full p-4 flex items-center gap-0 shadow-lg border border-gray-300">
                    {/* Where */}
                    <div
                        className="flex-1 px-4 border-r border-gray-200 relative"
                        ref={whereRef}
                    >
                        <label className="text-gray-900 text-sm font-semibold block mb-1">
                            Where
                        </label>
                        <input
                            type="text"
                            placeholder="Search destinations"
                            value={whereValue}
                            className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base"
                            onChange={(e) => handleWhereChange(e.target.value)}
                            onFocus={() => setIsWhereFocused(true)}
                        />
                        {/* Location Suggestions - Same as medium screen */}
                        {isWhereFocused && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-[400px] md:max-h-[500px] overflow-y-auto animate-fadeInSlideDown">
                                {whereValue.trim() === "" ? (
                                    <>
                                        {recentSearches.length > 0 && (
                                            <div className="py-2">
                                                <div className="px-4 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    Recent searches
                                                </div>
                                                {recentSearches.map(
                                                    (search, index) => (
                                                        <button
                                                            key={search.id}
                                                            className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                            onClick={() =>
                                                                handleRecentSearchClick(
                                                                    search
                                                                )
                                                            }
                                                        >
                                                            <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-100 group-hover:bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                                                                <svg
                                                                    className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 group-hover:text-purple-600 transition-colors"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-gray-900 font-semibold text-sm md:text-[15px] leading-tight group-hover:text-purple-900 transition-colors">
                                                                    {
                                                                        search.location
                                                                    }
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        )}
                                        <div
                                            className={`py-2 ${
                                                recentSearches.length > 0
                                                    ? "border-t border-gray-100"
                                                    : ""
                                            }`}
                                        >
                                            <div className="px-4 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                                Suggested destinations
                                            </div>
                                            {suggestedDestinations.map(
                                                (destination, index) => (
                                                    <button
                                                        key={destination.id}
                                                        className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                        onClick={() =>
                                                            handleSuggestionClick(
                                                                destination
                                                            )
                                                        }
                                                    >
                                                        <div className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 shadow-sm group-hover:shadow">
                                                            <div className="text-gray-700 group-hover:text-purple-600 transition-colors">
                                                                {getIcon(
                                                                    destination.icon
                                                                )}
                                                            </div>
                                                        </div>
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
                                    <div className="py-2">
                                        {suggestions.length > 0 ? (
                                            suggestions.map(
                                                (suggestion, index) => (
                                                    <button
                                                        key={suggestion.id}
                                                        className="w-full px-4 md:px-6 py-2.5 md:py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 md:gap-4 transition-all duration-150 group"
                                                        onClick={() =>
                                                            handleSuggestionClick(
                                                                suggestion
                                                            )
                                                        }
                                                    >
                                                        <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-100 group-hover:bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150">
                                                            <svg
                                                                className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-600 group-hover:text-purple-600 transition-colors"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                                />
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                                />
                                                            </svg>
                                                        </div>
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
                    <div className="flex-1 px-4 border-r border-gray-200 relative">
                        <label className="text-gray-900 text-sm font-semibold block mb-1">
                            Check in
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Add dates"
                                value={checkInDate}
                                className={`w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base cursor-pointer pr-8 ${
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
                            {checkInDate && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCheckInDate("");
                                        onCheckInChange?.("");
                                        if (checkOutDate) {
                                            setCheckOutDate("");
                                            onCheckOutChange?.("");
                                        }
                                        setIsDatePickerOpen(false);
                                        setActiveDateField(null);
                                    }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Clear check-in date"
                                >
                                    <svg
                                        className="w-4 h-4 text-gray-600"
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
                    <div className="flex-1 px-4 border-r border-gray-200 relative">
                        <label className="text-gray-900 text-sm font-semibold block mb-1">
                            Check out
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Add dates"
                                value={checkOutDate}
                                className={`w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base cursor-pointer pr-8 ${
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
                            {checkOutDate && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCheckOutDate("");
                                        onCheckOutChange?.("");
                                        setIsDatePickerOpen(false);
                                        setActiveDateField(null);
                                    }}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Clear check-out date"
                                >
                                    <svg
                                        className="w-4 h-4 text-gray-600"
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
                    <div className="flex-1 px-4 relative" ref={guestRef}>
                        <label className="text-gray-900 text-sm font-semibold block mb-1">
                            Who
                        </label>
                        <input
                            type="text"
                            placeholder="Add guests"
                            value={guestDisplayValue}
                            className="w-full bg-transparent text-gray-700 placeholder-gray-400 outline-none text-base cursor-pointer"
                            onClick={handleGuestFieldClick}
                            readOnly
                        />
                        {/* Guest Selection Modal */}
                        {isGuestModalOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <div className="p-4">
                                    {/* Ages 13 or above */}
                                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                        <div>
                                            <div className="text-gray-900 font-medium">
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
                                                disabled={adultCount === 0}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                            <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                {adultCount}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "adult",
                                                        true
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                                        <div>
                                            <div className="text-gray-900 font-medium">
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
                                                disabled={childCount === 0}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                            <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                {childCount}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "child",
                                                        true
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                    {/* Bringing an assistance animal */}
                                    <div className="flex items-center justify-between py-3">
                                        <div>
                                            <div className="text-gray-900 font-medium">
                                                Bringing an assistance animal?
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "assistance",
                                                        false
                                                    )
                                                }
                                                disabled={
                                                    assistanceAnimalCount === 0
                                                }
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                            <span className="text-gray-900 font-medium min-w-[20px] text-center">
                                                {assistanceAnimalCount}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleGuestCountChange(
                                                        "assistance",
                                                        true
                                                    )
                                                }
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                            >
                                                <svg
                                                    className="w-4 h-4 text-gray-600"
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
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Search button */}
                    <button
                        className="bg-[#AF7AEB] p-3 rounded-full hover:bg-[#9575e6] transition-colors ml-4 shadow-lg font-montserrat font-semibold"
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
                    className={`absolute top-full left-0 right-0 mt-2 ${isOverlay ? 'z-[60]' : 'z-50'}`}
                    ref={datePickerRef}
                >
                    <div className="bg-white rounded-xl p-4 shadow-2xl border border-gray-200 max-w-2xl mx-auto">
                        <div className="flex gap-6">
                            {/* Current Month Calendar */}
                            <div className="flex-1">
                                <div className="text-gray-900 text-base font-bold text-center mb-3">
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
                                            className="text-gray-600 text-xs text-center py-1"
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
                                                        ? "text-gray-400 cursor-not-allowed"
                                                        : isSelected
                                                        ? "bg-[#AF7AEB] text-white font-semibold"
                                                        : isInRange
                                                        ? "bg-[#AF7AEB]/30 text-white hover:bg-[#AF7AEB]/40"
                                                        : isGrayedOut
                                                        ? "text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                                                        : "text-gray-900 cursor-pointer hover:bg-gray-100"
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
                            <div className="flex-1">
                                <div className="text-gray-900 text-base font-bold text-center mb-3">
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
                                            className="text-gray-600 text-xs text-center py-1"
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
                                                        ? "text-gray-400 cursor-not-allowed"
                                                        : isSelected
                                                        ? "bg-[#AF7AEB] text-white font-semibold"
                                                        : isInRange
                                                        ? "bg-[#AF7AEB]/30 text-white hover:bg-[#AF7AEB]/40"
                                                        : isGrayedOut
                                                        ? "text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
                                                        : "text-gray-900 cursor-pointer hover:bg-gray-100"
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
                    </div>
                </div>
            )}
        </div>
    );
}
