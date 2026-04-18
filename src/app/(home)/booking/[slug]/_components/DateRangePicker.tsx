"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
    className?: string;
    onDateRangeChange?: (range: DateRange | undefined) => void;
    initialRange?: DateRange;
}

export function DateRangePicker({
    className,
    onDateRangeChange,
    initialRange,
}: DateRangePickerProps) {
    const [date, setDate] = React.useState<DateRange | undefined>(
        initialRange || {
            from: new Date(2024, 4, 12), // May 12, 2024
            to: addDays(new Date(2024, 4, 12), 5), // May 17, 2024
        }
    );

    const handleDateSelect = (range: DateRange | undefined) => {
        setDate(range);
        onDateRangeChange?.(range);
    };

    const clearDates = () => {
        setDate(undefined);
        onDateRangeChange?.(undefined);
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-center text-left font-normal text-black border-gray-300 hover:bg-gray-50",
                            !date && "text-gray-500"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-black" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 bg-white border border-gray-200 shadow-lg"
                    align="start"
                >
                    <div className="p-4">
                        <div className="text-center mb-4">
                            {date?.from && date?.to ? (
                                <div className="text-sm font-medium text-black">
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </div>
                            ) : (
                                <div className="text-sm text-black">
                                    Select your dates
                                </div>
                            )}
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleDateSelect}
                            numberOfMonths={2}
                            className="rounded-md border-0"
                            classNames={{
                                root: "w-fit bg-white",
                                months: "flex gap-4 flex-col md:flex-row relative",
                                month: "flex flex-col w-full gap-4",
                                nav: "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
                                button_previous:
                                    "h-8 w-8 bg-transparent p-0 text-black hover:bg-gray-100",
                                button_next:
                                    "h-8 w-8 bg-transparent p-0 text-black hover:bg-gray-100",
                                month_caption:
                                    "flex items-center justify-center h-8 w-full px-8",
                                caption_label:
                                    "select-none font-medium text-black text-sm",
                                table: "w-full border-collapse",
                                weekdays: "flex",
                                weekday:
                                    "text-gray-500 rounded-md flex-1 font-normal text-xs select-none",
                                week: "flex w-full mt-2",
                                day: "relative w-full h-full p-0 text-center aspect-square select-none",
                                range_start:
                                    "rounded-l-md bg-gray-100 text-black",
                                range_middle:
                                    "rounded-none bg-gray-100 text-black",
                                range_end:
                                    "rounded-r-md bg-gray-100 text-black",
                                today: "bg-transparent text-black rounded-md",
                                outside: "text-gray-400",
                                disabled: "text-gray-300 opacity-50",
                            }}
                        />
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-black" />
                                <span className="text-sm text-black">
                                    Calendar
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearDates}
                                className="text-sm text-black underline hover:no-underline hover:bg-transparent p-0 h-auto"
                            >
                                Clear dates
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
