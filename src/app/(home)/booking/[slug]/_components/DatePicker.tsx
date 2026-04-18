"use client";

import React, { useState, useEffect } from "react";

interface DatePickerProps {
    label: string;
    value: string;
    onChange: (date: string) => void;
    minDate?: string;
    maxDate?: string;
    disabled?: boolean;
    placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
    label,
    value,
    onChange,
    minDate,
    maxDate,
    disabled = false,
    placeholder = "Select date"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(value || "");

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString || dateString === "" || dateString === "Select dates") return placeholder;
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    // Generate calendar dates
    const generateCalendarDates = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const dates = [];
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        
        return dates;
    };

    const handleDateSelect = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        setSelectedDate(dateString);
        onChange(dateString);
        setIsOpen(false);
    };

    // Update selectedDate when value prop changes
    useEffect(() => {
        setSelectedDate(value);
    }, [value]);

    const isDateDisabled = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) return true;
        if (minDate && date < new Date(minDate)) return true;
        if (maxDate && date > new Date(maxDate)) return true;
        return false;
    };

    const isDateSelected = (date: Date) => {
        if (!selectedDate) return false;
        return date.toISOString().split('T')[0] === selectedDate;
    };

    return (
        <div className="relative">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-1">
                {label}
            </label>
            <div
                className={`text-sm font-medium text-gray-900 cursor-pointer hover:text-gray-700 transition-colors ${
                    disabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {formatDate(selectedDate)}
            </div>
            
            {isOpen && !disabled && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Calendar */}
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-64">
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {/* Day headers */}
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} className="text-xs font-semibold text-gray-500 p-2">
                                    {day}
                                </div>
                            ))}
                            
                            {/* Calendar dates */}
                            {generateCalendarDates().map((date, index) => {
                                const isDisabled = isDateDisabled(date);
                                const isSelected = isDateSelected(date);
                                const isToday = date.toDateString() === new Date().toDateString();
                                
                                return (
                                    <button
                                        key={index}
                                        className={`text-sm p-2 rounded hover:bg-gray-100 transition-colors ${
                                            isDisabled
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : isSelected
                                                ? 'bg-purple-600 text-white'
                                                : isToday
                                                ? 'bg-purple-100 text-purple-600 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                        onClick={() => !isDisabled && handleDateSelect(date)}
                                        disabled={isDisabled}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Close button */}
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DatePicker;
