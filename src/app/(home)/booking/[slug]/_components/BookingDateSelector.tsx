"use client";

import React, { useState } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "./DateRangePicker";

interface BookingDateSelectorProps {
    onDateRangeChange?: (range: DateRange | undefined) => void;
    className?: string;
}

const BookingDateSelector: React.FC<BookingDateSelectorProps> = ({
    onDateRangeChange,
    className,
}) => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        onDateRangeChange?.(range);
    };

    return (
        <div className={className}>
            <DateRangePicker
                onDateRangeChange={handleDateRangeChange}
                initialRange={dateRange}
                className="w-full"
            />
        </div>
    );
};

export default BookingDateSelector;
