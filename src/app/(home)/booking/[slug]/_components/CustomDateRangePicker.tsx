"use client";

import React, { useState } from "react";
import {
    addDays,
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface CustomDateRangePickerProps {
    dateRange?: DateRange | undefined;
    onDateRangeChange?: (range: DateRange | undefined) => void;
    className?: string;
}

export function CustomDateRangePicker({
    dateRange: externalDateRange,
    onDateRangeChange,
    className,
}: CustomDateRangePickerProps) {
    // Get current date and set initial state to current month
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    // Use external state if provided, otherwise use internal state
    const [internalDateRange, setInternalDateRange] = useState<DateRange | undefined>(undefined);
    const dateRange = externalDateRange !== undefined ? externalDateRange : internalDateRange;

    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth())); // Current month
    const [nextMonth, setNextMonth] = useState(new Date(today.getFullYear(), today.getMonth() + 1)); // Next month

    const handleDateSelect = (date: Date) => {
        // Normalize the selected date to local timezone with no time component
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        
        // Don't allow selection of past dates
        if (normalizedDate < today) {
            return;
        }
        
        let newRange: DateRange | undefined;
        if (!dateRange?.from || (dateRange.from && dateRange.to)) {
            newRange = { from: normalizedDate, to: undefined };
        } else {
            // Normalize existing from date for comparison
            const normalizedFrom = new Date(dateRange.from);
            normalizedFrom.setHours(0, 0, 0, 0);
            
            if (normalizedDate < normalizedFrom) {
                newRange = { from: normalizedDate, to: normalizedFrom };
            } else {
                newRange = { from: normalizedFrom, to: normalizedDate };
            }
        }
        
        // Update internal state if not using external state
        if (externalDateRange === undefined) {
            setInternalDateRange(newRange);
        }
        // Always call the callback
        onDateRangeChange?.(newRange);
    };

    const clearDates = () => {
        const clearedRange = undefined;
        // Update internal state if not using external state
        if (externalDateRange === undefined) {
            setInternalDateRange(clearedRange);
        }
        // Always call the callback
        onDateRangeChange?.(clearedRange);
    };

    const navigateMonth = (direction: "prev" | "next") => {
        if (direction === "prev") {
            const newMonth = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1
            );
            // Don't allow navigation to past months
            if (newMonth < new Date(today.getFullYear(), today.getMonth())) {
                return;
            }
            setCurrentMonth(newMonth);
            setNextMonth(
                new Date(newMonth.getFullYear(), newMonth.getMonth() + 1)
            );
        } else {
            const newMonth = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1
            );
            setCurrentMonth(newMonth);
            setNextMonth(
                new Date(newMonth.getFullYear(), newMonth.getMonth() + 1)
            );
        }
    };

    const renderCalendar = (month: Date) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

        const days = eachDayOfInterval({
            start: startDate,
            end: new Date(startDate.getTime() + 41 * 24 * 60 * 60 * 1000), // 6 weeks
        });

        const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

        return (
            <div className="w-full">
                {/* Month Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigateMonth("prev")}
                        disabled={month <= new Date(today.getFullYear(), today.getMonth())}
                        className={`p-1 rounded ${
                            month <= new Date(today.getFullYear(), today.getMonth())
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:bg-gray-100"
                        }`}
                    >
                        <ChevronLeft className="w-4 h-4 text-black" />
                    </button>
                    <h3 className="font-medium text-black">
                        {format(month, "MMMM yyyy")}
                    </h3>
                    <button
                        onClick={() => navigateMonth("next")}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <ChevronRight className="w-4 h-4 text-black" />
                    </button>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs text-gray-500 font-normal py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, dayIdx) => {
                        const isCurrentMonth = isSameMonth(day, month);
                        const dayStart = new Date(day);
                        dayStart.setHours(0, 0, 0, 0);
                        const isPastDate = dayStart < today;
                        const isSelected =
                            dateRange?.from && isSameDay(day, dateRange.from);
                        const isEndSelected =
                            dateRange?.to && isSameDay(day, dateRange.to);
                        const isInRange =
                            dateRange?.from &&
                            dateRange?.to &&
                            isWithinInterval(day, {
                                start: dateRange.from,
                                end: dateRange.to,
                            });

                        return (
                            <button
                                key={dayIdx}
                                onClick={() =>
                                    isCurrentMonth && !isPastDate && handleDateSelect(day)
                                }
                                disabled={!isCurrentMonth || isPastDate}
                                className={`
                                    w-8 h-8 text-sm rounded-md flex items-center justify-center
                                    ${
                                        !isCurrentMonth
                                            ? "text-gray-300"
                                            : isPastDate
                                            ? "text-gray-300 cursor-not-allowed"
                                            : "text-black hover:bg-gray-100"
                                    }
                                    ${
                                        isSelected || isEndSelected
                                            ? "bg-black text-white font-bold"
                                            : ""
                                    }
                                    ${
                                        isInRange &&
                                        !isSelected &&
                                        !isEndSelected
                                            ? "bg-gray-800 text-white"
                                            : ""
                                    }
                                `}
                            >
                                {day.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div
            className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 ${className}`}
        >
            {/* Selected Date Range Display */}
            <div className="text-center mb-4">
                {dateRange?.from && dateRange?.to ? (
                    <div className="text-sm font-medium text-black">
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                    </div>
                ) : dateRange?.from ? (
                    <div className="text-sm font-medium text-black">
                        {format(dateRange.from, "dd/MM/yyyy")} - Select checkout
                    </div>
                ) : (
                    <div className="text-sm text-black">Select your dates</div>
                )}
            </div>

            {/* Two Month Calendar */}
            <div className="flex gap-8 mb-4">
                {renderCalendar(currentMonth)}
                {renderCalendar(nextMonth)}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-black" />
                    <span className="text-sm text-black">Calendar</span>
                </div>
                <button
                    onClick={clearDates}
                    className="text-sm text-black underline hover:no-underline"
                >
                    Clear dates
                </button>
            </div>
        </div>
    );
}

