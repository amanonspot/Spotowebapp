"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { getPlaceSuggestions } from "@/lib/utils/googlePlaces";

interface MobileSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNext?: (data: { location: string; when: string; guests: string }) => void;
    initialLocation?: string;
}

type Step = "where" | "when" | "who";

export default function MobileSearchModal({
    isOpen,
    onClose,
    onNext,
    initialLocation = "",
}: MobileSearchModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>("where");
    const [selectedLocation, setSelectedLocation] = useState(initialLocation);
    const [searchQuery, setSearchQuery] = useState("");
    const prevInitialLocationRef = useRef<string>("");
    
    // Create stable location value for dependencies
    const stableLocation = useMemo(() => initialLocation || "", [initialLocation]);
    
    const [locationSuggestions, setLocationSuggestions] = useState<Array<{
        description: string;
        place_id: string;
        main_text: string;
        secondary_text: string;
    }>>([]);
    const [dateRange, setDateRange] = useState("");
    const [selectedDates, setSelectedDates] = useState<{day: number, month: number, year: number}[]>([]);
    const [adults, setAdults] = useState(0);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);
    const [pets, setPets] = useState(0);
    const [dateMode, setDateMode] = useState<"dates" | "flexible">(
        "dates"
    );
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [dateFlexibility, setDateFlexibility] = useState<0 | 1 | 2>(0); // 0 = exact, 1 = ±1 day, 2 = ±2 days
    const contentRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    // Get current date
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    // Reset to first step when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep("where");
        }
    }, [isOpen]);
    
    // Sync selectedLocation with initialLocation when modal opens or location changes
    // Use stable dependencies to prevent array size changes
    useEffect(() => {
        if (isOpen && stableLocation && stableLocation !== "Bangalore" && stableLocation !== prevInitialLocationRef.current) {
            prevInitialLocationRef.current = stableLocation;
            setSelectedLocation(stableLocation);
            setSearchQuery(stableLocation);
        }
    }, [isOpen, stableLocation]); // Stable dependency array - always 2 elements

    // Auto-scroll to top when step changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    }, [currentStep]);

    // Fetch location suggestions when search query changes
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.trim().length >= 2) {
                try {
                    const suggestions = await getPlaceSuggestions(searchQuery);
                    setLocationSuggestions(suggestions);
                } catch (error) {
                    console.error('Error fetching location suggestions:', error);
                    setLocationSuggestions([]);
                }
            } else {
                setLocationSuggestions([]);
            }
        };

        const debounceTimer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Update date range when flexibility changes
    useEffect(() => {
        if (selectedDates.length === 2) {
            const firstDate = selectedDates[0];
            const secondDate = selectedDates[1];
            const firstDateObj = new Date(firstDate.year, firstDate.month, firstDate.day);
            const secondDateObj = new Date(secondDate.year, secondDate.month, secondDate.day);
            
            // Ensure check-in is before check-out
            const dates = [firstDateObj, secondDateObj].sort((a, b) => a.getTime() - b.getTime());
            
            // Apply flexibility to dates
            const checkInDate = new Date(dates[0]);
            const checkOutDate = new Date(dates[1]);
            
            // Adjust dates based on flexibility
            if (dateFlexibility > 0) {
                checkInDate.setDate(checkInDate.getDate() - dateFlexibility);
                checkOutDate.setDate(checkOutDate.getDate() + dateFlexibility);
            }
            
            // Format: "Mar 7, 2025 - Mar 14, 2025" for proper parsing
            const checkInFormatted = checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const checkOutFormatted = checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            setDateRange(`${checkInFormatted} - ${checkOutFormatted}`);
        }
    }, [dateFlexibility, selectedDates]);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep === "where") {
            setCurrentStep("when");
        } else if (currentStep === "when") {
            setCurrentStep("who");
        } else {
            // Final step - perform search
            // Calculate total guest count (adults + children, excluding infants and pets)
            const totalGuests = adults + children;
            const guestText = totalGuests > 0 ? `${totalGuests}` : "1";
            
            onNext?.({
                location: selectedLocation || searchQuery || "Anywhere",
                when: dateRange || "Any week",
                guests: guestText,
            });
            onClose();
        }
    };

    const handleSkip = () => {
        if (currentStep === "where") {
            setCurrentStep("when");
        } else if (currentStep === "when") {
            setCurrentStep("who");
        } else {
            // Skip final step - just close
            onClose();
        }
    };

    // Generate calendar for current month/year
    const generateCalendarDays = (year: number, month: number) => {
        const days = [];
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const calendarDays = generateCalendarDays(currentYear, currentMonth);
    
    // Check if a date is in the past
    const isDatePast = (day: number, month: number, year: number): boolean => {
        const date = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const handleDateClick = (day: number | null) => {
        if (!day) return;
        
        // Check if date is in the past
        if (isDatePast(day, currentMonth, currentYear)) {
            return;
        }

        const clickedDate = { day, month: currentMonth, year: currentYear };
        
        // Check if clicking on already selected date
        const isAlreadySelected = selectedDates.some(
            d => d.day === day && d.month === currentMonth && d.year === currentYear
        );
        
        if (isAlreadySelected) {
            setSelectedDates(selectedDates.filter(
                d => !(d.day === day && d.month === currentMonth && d.year === currentYear)
            ));
            setDateRange("");
            return;
        }

        // If no dates selected or 2 already selected, start fresh
        if (selectedDates.length === 0 || selectedDates.length === 2) {
            setSelectedDates([clickedDate]);
            setDateRange("");
        } 
        // If 1 date selected, add second date
        else if (selectedDates.length === 1) {
            const firstDate = selectedDates[0];
            const firstDateObj = new Date(firstDate.year, firstDate.month, firstDate.day);
            const secondDateObj = new Date(currentYear, currentMonth, day);
            
            // Ensure check-in is before check-out
            const dates = [firstDateObj, secondDateObj].sort((a, b) => a.getTime() - b.getTime());
            
            // Apply flexibility to dates
            const checkInDate = new Date(dates[0]);
            const checkOutDate = new Date(dates[1]);
            
            // Adjust dates based on flexibility
            if (dateFlexibility > 0) {
                checkInDate.setDate(checkInDate.getDate() - dateFlexibility);
                checkOutDate.setDate(checkOutDate.getDate() + dateFlexibility);
            }
            
            // Format: "Mar 7, 2025 - Mar 14, 2025" for proper parsing
            const checkInFormatted = checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const checkOutFormatted = checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            setDateRange(`${checkInFormatted} - ${checkOutFormatted}`);
            setSelectedDates([firstDate, clickedDate].sort((a, b) => {
                const dateA = new Date(a.year, a.month, a.day);
                const dateB = new Date(b.year, b.month, b.day);
                return dateA.getTime() - dateB.getTime();
            }));
            
            // Auto-advance to next step after a brief delay
            setTimeout(() => setCurrentStep("who"), 500);
        }
    };
    
    // Get month name
    const getMonthName = (year: number, month: number) => {
        return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };
    
    // Navigate months
    const handlePreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };
    
    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };
    
    // Generate months for slider (next 12 months from current)
    const generateMonthOptions = () => {
        const months = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            months.push({
                value: date.getMonth(),
                year: date.getFullYear(),
                label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            });
        }
        return months;
    };
    
    const monthOptions = generateMonthOptions();

    const locationOptions = [
        {
            id: "flexible",
            label: "I'm flexible",
            image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=300&fit=crop",
        },
        {
            id: "us",
            label: "United States",
            image: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&h=300&fit=crop",
        },
        {
            id: "japan",
            label: "Japan",
            image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=300&fit=crop",
        },
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#0A0A0A] to-[#1A1A1A]">
            {/* Header */}
            <div className="px-5 pt-4 pb-3">
                <div className="flex items-center justify-center mb-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute left-0 w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-sm border border-white/10"
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
                                strokeWidth={2.5}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    {/* Title */}
                    <h1 className="text-white text-xl font-bold tracking-tight">Stays</h1>
                </div>
            </div>

            {/* Content */}
            <div
                ref={contentRef}
                className="px-5 pt-4 pb-32 overflow-y-auto h-[calc(100vh-160px)]"
            >
                {/* STEP 1: Where to Section */}
                {currentStep === "where" && (
                    <div className="space-y-3">
                        {/* Where Section - Expanded */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-[28px] p-7 border border-white/10 shadow-2xl">
                            <h3 className="text-white text-3xl font-bold mb-7 tracking-tight">
                                Where to?
                            </h3>

                            {/* Search Input */}
                            <div className="relative mb-7">
                                <div className="absolute left-5 top-1/2 transform -translate-y-1/2 z-10">
                                    <svg
                                        className="w-5 h-5 text-gray-400"
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
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search destinations"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white text-black pl-14 pr-12 py-4 rounded-2xl outline-none placeholder-gray-400 text-base font-medium shadow-sm focus:shadow-md transition-shadow"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            setLocationSuggestions([]);
                                        }}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
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

                            {/* Location Suggestions (Google Places) */}
                            {locationSuggestions.length > 0 && (
                                <div className="mb-7 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] rounded-2xl border border-purple-500/30 overflow-hidden max-h-[300px] overflow-y-auto">
                                    {locationSuggestions.map((suggestion) => (
                                        <button
                                            key={suggestion.place_id}
                                            onClick={() => {
                                                setSelectedLocation(suggestion.main_text);
                                                setSearchQuery(suggestion.main_text);
                                                setLocationSuggestions([]);
                                            }}
                                            className="w-full px-5 py-4 flex items-start gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                                        >
                                            <svg
                                                className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5"
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
                                            <div className="flex-1 text-left">
                                                <div className="text-white font-semibold text-sm">
                                                    {suggestion.main_text}
                                                </div>
                                                {suggestion.secondary_text && (
                                                    <div className="text-gray-400 text-xs mt-0.5">
                                                        {suggestion.secondary_text}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Location Options - Only show when no suggestions */}
                            {locationSuggestions.length === 0 && (
                            <div className="grid grid-cols-3 gap-3">
                                {locationOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() =>
                                            setSelectedLocation(option.label)
                                        }
                                        className={`relative rounded-2xl overflow-hidden transition-all hover:scale-105 ${
                                            selectedLocation === option.label
                                                ? "ring-2 ring-[#AF7AEB] ring-offset-2 ring-offset-black/20"
                                                : "ring-1 ring-white/10"
                                        }`}
                                    >
                                        <div className="aspect-square">
                                            <img
                                                src={option.image}
                                                alt={option.label}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/50"></div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <p className="text-white text-[11px] font-semibold text-center drop-shadow-lg">
                                                {option.label}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            )}
                        </div>

                        {/* When Section - Collapsed */}
                        <button
                            onClick={() => setCurrentStep("when")}
                            className="w-full bg-white/5 backdrop-blur-sm rounded-[28px] px-7 py-5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-white text-base font-semibold">
                                    When
                                </span>
                                <span className="text-gray-400 text-sm font-medium">
                                    {dateRange || "Any week"}
                                </span>
                            </div>
                        </button>

                        {/* Who Section - Collapsed */}
                        <button
                            onClick={() => setCurrentStep("who")}
                            className="w-full bg-white/5 backdrop-blur-sm rounded-[28px] px-7 py-5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-white text-base font-semibold">
                                    Who
                                </span>
                                <span className="text-gray-400 text-sm font-medium">
                                    Add guests
                                </span>
                            </div>
                        </button>
                    </div>
                )}

                {/* STEP 2: When Section */}
                {currentStep === "when" && (
                    <div className="space-y-3">
                        {/* Where Summary Bar - Collapsed */}
                        <button
                            onClick={() => setCurrentStep("where")}
                            className="w-full bg-white rounded-[28px] px-7 py-5 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 text-sm font-semibold">
                                    Where
                                </span>
                                <span className="text-black text-sm font-bold">
                                    {selectedLocation ||
                                        searchQuery ||
                                        "Amalfi Coast, Italy"}
                                </span>
                            </div>
                        </button>

                        {/* When Section - Expanded */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-[28px] p-7 border border-white/10 shadow-2xl">
                            <h3 className="text-white text-2xl font-bold mb-6">
                                When&apos;s your trip?
                            </h3>

                            {/* Date Mode Selector */}
                            <div className="flex gap-2 mb-7 bg-white/5 rounded-full p-1.5 border border-white/10">
                                <button
                                    onClick={() => setDateMode("dates")}
                                    className={`flex-1 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                                        dateMode === "dates"
                                            ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-purple-500/30"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Dates
                                </button>
                                <button
                                    onClick={() => setDateMode("flexible")}
                                    className={`flex-1 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                                        dateMode === "flexible"
                                            ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-purple-500/30"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    Flexible
                                </button>
                            </div>
                            
                            {/* Month Slider for Flexible Mode */}
                            {dateMode === "flexible" && (
                                <div className="mb-7">
                                    <div className="text-white text-sm font-semibold mb-4">
                                        Choose month
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                                        {monthOptions.map((month, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setSelectedMonth(month.value);
                                                    setCurrentMonth(month.value);
                                                    setCurrentYear(month.year);
                                                }}
                                                className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                                                    selectedMonth === month.value && currentYear === month.year
                                                        ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-purple-500/30"
                                                        : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                                                }`}
                                            >
                                                {month.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Calendar */}
                            <div className="bg-black/30 rounded-3xl p-6 border border-white/5">
                                {/* Month/Year Header with Navigation */}
                                <div className="flex items-center justify-between mb-6">
                                    <button
                                        onClick={handlePreviousMonth}
                                        disabled={currentMonth === todayMonth && currentYear === todayYear}
                                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                                                d="M15 19l-7-7 7-7"
                                            />
                                        </svg>
                                    </button>
                                    <div className="text-white text-lg font-semibold">
                                        {getMonthName(currentYear, currentMonth)}
                                    </div>
                                    <button
                                        onClick={handleNextMonth}
                                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
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
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-2 mb-3">
                                    {["S", "M", "T", "S", "T", "F", "S"].map(
                                        (day, index) => (
                                            <div
                                                key={index}
                                                className="text-gray-400 text-sm text-center font-medium"
                                            >
                                                {day}
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-2">
                                    {calendarDays.map((day, index) => {
                                        const isPast = day ? isDatePast(day, currentMonth, currentYear) : false;
                                        const isSelected = day && selectedDates.some(
                                            d => d.day === day && d.month === currentMonth && d.year === currentYear
                                        );
                                        const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
                                        
                                        // Check if date is within flexibility range
                                        let isInFlexibilityRange = false;
                                        if (day && dateFlexibility > 0) {
                                            if (selectedDates.length === 2) {
                                                // Two dates selected - show range with flexibility
                                                const firstDate = selectedDates[0];
                                                const secondDate = selectedDates[1];
                                                const firstDateObj = new Date(firstDate.year, firstDate.month, firstDate.day);
                                                const secondDateObj = new Date(secondDate.year, secondDate.month, secondDate.day);
                                                
                                                // Sort dates
                                                const dates = [firstDateObj, secondDateObj].sort((a, b) => a.getTime() - b.getTime());
                                                
                                                // Calculate adjusted range
                                                const adjustedStart = new Date(dates[0]);
                                                adjustedStart.setDate(adjustedStart.getDate() - dateFlexibility);
                                                const adjustedEnd = new Date(dates[1]);
                                                adjustedEnd.setDate(adjustedEnd.getDate() + dateFlexibility);
                                                
                                                // Check if current day is within adjusted range
                                                const currentDayDate = new Date(currentYear, currentMonth, day);
                                                isInFlexibilityRange = currentDayDate >= adjustedStart && currentDayDate <= adjustedEnd;
                                            } else if (selectedDates.length === 1) {
                                                // Single date selected - show flexibility range around it
                                                const selectedDate = selectedDates[0];
                                                const selectedDateObj = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
                                                
                                                // Calculate adjusted range around single date
                                                const adjustedStart = new Date(selectedDateObj);
                                                adjustedStart.setDate(adjustedStart.getDate() - dateFlexibility);
                                                const adjustedEnd = new Date(selectedDateObj);
                                                adjustedEnd.setDate(adjustedEnd.getDate() + dateFlexibility);
                                                
                                                // Check if current day is within adjusted range
                                                const currentDayDate = new Date(currentYear, currentMonth, day);
                                                isInFlexibilityRange = currentDayDate >= adjustedStart && currentDayDate <= adjustedEnd;
                                            }
                                        }
                                        
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleDateClick(day)}
                                                disabled={!day || isPast}
                                                className={`aspect-square flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                                                    day
                                                        ? isPast
                                                            ? "text-gray-600 cursor-not-allowed opacity-40"
                                                            : isSelected
                                                            ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg"
                                                            : isInFlexibilityRange
                                                            ? "bg-purple-500/30 text-white border border-purple-400/50 hover:bg-purple-500/40 hover:scale-110"
                                                            : isToday
                                                            ? "bg-white/20 text-white border-2 border-purple-400 hover:bg-white/30 hover:scale-110"
                                                            : "text-white hover:bg-white/10 hover:scale-110"
                                                        : "text-transparent"
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Quick Filters */}
                                <div className="flex gap-2 mt-6">
                                    <button 
                                        onClick={() => setDateFlexibility(0)}
                                        className={`px-4 py-2.5 rounded-full text-white text-xs font-semibold transition-all ${
                                            dateFlexibility === 0
                                                ? "bg-white/20 border border-white/30"
                                                : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                                        }`}
                                    >
                                        Exact dates
                                    </button>
                                    <button 
                                        onClick={() => setDateFlexibility(1)}
                                        className={`px-4 py-2.5 rounded-full text-white text-xs font-semibold transition-all ${
                                            dateFlexibility === 1
                                                ? "bg-white/20 border border-white/30"
                                                : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                                        }`}
                                    >
                                        ± 1 day
                                    </button>
                                    <button 
                                        onClick={() => setDateFlexibility(2)}
                                        className={`px-4 py-2.5 rounded-full text-white text-xs font-semibold transition-all ${
                                            dateFlexibility === 2
                                                ? "bg-white/20 border border-white/30"
                                                : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                                        }`}
                                    >
                                        ± 2 days
                                    </button>
                                </div>
                            </div>
                            
                            {/* OK Button for Date Selection */}
                            <div className="mt-7">
                            <button
                                onClick={handleNext}
                                disabled={selectedDates.length < 2 && !dateRange && dateMode === "dates"}
                                className="w-full bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] hover:shadow-lg hover:shadow-purple-500/30 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-all text-base"
                            >
                                OK
                            </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Who Section */}
                {currentStep === "who" && (
                    <div className="space-y-3">
                        {/* Where Summary Bar - Collapsed */}
                        <button
                            onClick={() => setCurrentStep("where")}
                            className="w-full bg-white/5 backdrop-blur-sm rounded-[28px] px-7 py-5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm font-semibold">
                                    Where
                                </span>
                                <span className="text-white text-sm font-bold">
                                    {selectedLocation ||
                                        searchQuery ||
                                        "Amalfi Coast, Italy"}
                                </span>
                            </div>
                        </button>

                        {/* When Summary Bar - Collapsed */}
                        <button
                            onClick={() => setCurrentStep("when")}
                            className="w-full bg-white/5 backdrop-blur-sm rounded-[28px] px-7 py-5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm font-semibold">
                                    When
                                </span>
                                <span className="text-white text-sm font-bold">
                                    {dateRange || "Jul 5 - Dec 5"}
                                </span>
                            </div>
                        </button>

                        {/* Who Section - Expanded */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-[28px] p-7 border border-white/10 shadow-2xl">
                            <h3 className="text-white text-2xl font-bold mb-6">
                                Who&apos;s coming?
                            </h3>

                            {/* Guest Counters */}
                            <div className="space-y-6">
                                {/* Adults */}
                                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                                    <div>
                                        <div className="text-white font-bold text-base mb-1">
                                            Adults
                                        </div>
                                        <div className="text-gray-400 text-xs font-medium">
                                            Ages 13 or above
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <button
                                            onClick={() =>
                                                setAdults(
                                                    Math.max(0, adults - 1)
                                                )
                                            }
                                            disabled={adults === 0}
                                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            <span className="text-white text-xl font-bold leading-none">
                                                −
                                            </span>
                                        </button>
                                        <span className="text-white font-bold text-lg min-w-[24px] text-center">
                                            {adults}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setAdults(adults + 1)
                                            }
                                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all active:scale-95"
                                        >
                                            <span className="text-white text-xl font-bold leading-none">
                                                +
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Children */}
                                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                                    <div>
                                        <div className="text-white font-bold text-base mb-1">
                                            Children
                                        </div>
                                        <div className="text-gray-400 text-xs font-medium">
                                            Ages 2-12
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <button
                                            onClick={() =>
                                                setChildren(
                                                    Math.max(0, children - 1)
                                                )
                                            }
                                            disabled={children === 0}
                                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            <span className="text-white text-xl font-bold leading-none">
                                                −
                                            </span>
                                        </button>
                                        <span className="text-white font-bold text-lg min-w-[24px] text-center">
                                            {children}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setChildren(children + 1)
                                            }
                                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all active:scale-95"
                                        >
                                            <span className="text-white text-xl font-bold leading-none">
                                                +
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Infants */}
                                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                                    <div>
                                        <div className="text-white font-bold text-base mb-1">
                                            Infants
                                        </div>
                                        <div className="text-gray-400 text-xs font-medium">
                                            Under 2
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <button
                                            onClick={() =>
                                                setInfants(
                                                    Math.max(0, infants - 1)
                                                )
                                            }
                                            disabled={infants === 0}
                                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            <span className="text-white text-xl font-bold leading-none">
                                                −
                                            </span>
                                        </button>
                                        <span className="text-white font-bold text-lg min-w-[24px] text-center">
                                            {infants}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setInfants(infants + 1)
                                            }
                                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all active:scale-95"
                                        >
                                            <span className="text-white text-xl font-bold leading-none">
                                                +
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Pets */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold text-base mb-1">
                                            Pets
                                        </div>
                                        <div className="text-gray-400 text-xs font-medium">
                                            Bringing a service animal?
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <button
                                            onClick={() =>
                                                setPets(Math.max(0, pets - 1))
                                            }
                                            disabled={pets === 0}
                                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            <span className="text-white text-xl font-bold leading-none">
                                                −
                                            </span>
                                        </button>
                                        <span className="text-white font-bold text-lg min-w-[24px] text-center">
                                            {pets}
                                        </span>
                                        <button
                                            onClick={() => setPets(pets + 1)}
                                            className="w-9 h-9 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white hover:bg-white/10 transition-all active:scale-95"
                                        >
                                            <span className="text-white text-xl font-bold leading-none">
                                                +
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions - Removed Skip/Next, only keeping Search in final step */}
            {currentStep === "who" && (
                <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent px-6 py-6 z-[10000] backdrop-blur-xl border-t border-white/5">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            onClick={() => {
                                setSelectedLocation("");
                                setSearchQuery("");
                                setDateRange("");
                                setSelectedDates([]);
                                setAdults(0);
                                setChildren(0);
                                setInfants(0);
                                setPets(0);
                                setCurrentMonth(new Date().getMonth());
                                setCurrentYear(new Date().getFullYear());
                                setSelectedMonth(new Date().getMonth());
                                setDateMode("dates");
                                setDateFlexibility(0);
                                setCurrentStep("where");
                            }}
                            className="text-white text-base font-semibold underline hover:text-gray-300 transition-colors"
                        >
                            Clear all
                        </button>
                        <button
                            onClick={handleNext}
                            className="bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white px-12 py-4 rounded-2xl font-bold text-base hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 min-w-[140px]"
                        >
                            <svg
                                className="w-5 h-5"
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
                            <span>Search</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
