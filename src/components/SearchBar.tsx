"use client";
import React from "react";

interface SearchBarProps {
    onSearch?: () => void;
    onWhereChange?: (value: string) => void;
    onCheckInChange?: (value: string) => void;
    onCheckOutChange?: (value: string) => void;
    onGuestsChange?: (value: string) => void;
}

export default function SearchBar({
    onSearch,
    onWhereChange,
    onCheckInChange,
    onCheckOutChange,
    onGuestsChange,
}: SearchBarProps) {
    return (
        <div className="w-full px-4 z-20 relative">
            {/* Mobile Search Bar */}
            <div className="md:hidden">
                <div className="mobile-search-bar rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/20 transition-all duration-200 border border-white/10 shadow-lg shadow-black/20 backdrop-blur-md" onClick={onSearch}>
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
                    <span className="text-white text-sm flex-1 font-medium">
                        Where to? Anywhere · Any week · Add guests
                    </span>

                    {/* Filter icon with glow effect */}
                    <div className="relative">
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
                <div className="bg-[#20162B] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-0">
                    {/* Where */}
                    <div className="flex-1 px-4 md:border-r border-[#404040]">
                        <label className="text-white text-sm block mb-1">
                            Where
                        </label>
                        <input
                            type="text"
                            placeholder="Search destinations"
                            className="w-full bg-transparent text-white placeholder-[#A0A0A0] outline-none"
                            onChange={(e) => onWhereChange?.(e.target.value)}
                        />
                    </div>

                    {/* Check in */}
                    <div className="flex-1 px-4 md:border-r border-[#404040]">
                        <label className="text-white text-sm block mb-1">
                            Check in
                        </label>
                        <input
                            type="text"
                            placeholder="Add dates"
                            className="w-full bg-transparent text-white placeholder-[#A0A0A0] outline-none"
                            onChange={(e) => onCheckInChange?.(e.target.value)}
                        />
                    </div>

                    {/* Check out */}
                    <div className="flex-1 px-4 md:border-r border-[#404040]">
                        <label className="text-white text-sm block mb-1">
                            Check out
                        </label>
                        <input
                            type="text"
                            placeholder="Add dates"
                            className="w-full bg-transparent text-white placeholder-[#A0A0A0] outline-none"
                            onChange={(e) => onCheckOutChange?.(e.target.value)}
                        />
                    </div>

                    {/* Who */}
                    <div className="flex-1 px-4">
                        <label className="text-white text-sm block mb-1">
                            Who
                        </label>
                        <input
                            type="text"
                            placeholder="Add guests"
                            className="w-full bg-transparent text-white placeholder-[#A0A0A0] outline-none"
                            onChange={(e) => onGuestsChange?.(e.target.value)}
                        />
                    </div>

                    {/* Search button */}
                    <button
                        className="bg-[#AF7AEB] p-3 rounded-xl hover:bg-[#9575e6] transition-colors md:ml-4 self-center md:self-auto font-montserrat font-semibold"
                        onClick={onSearch}
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
        </div>
    );
}
