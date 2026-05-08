"use client";

import React, { useMemo, useState } from "react";
import { FilterState, MoveInOption, SelectOption } from "@/lib/adapters/types";
import Chip from "@/components/revamp/Chip";
import PrimaryButton from "@/components/revamp/PrimaryButton";

interface FilterPanelProps {
    isOpen: boolean;
    filters: FilterState;
    localities: SelectOption[];
    propertyTypes: SelectOption[];
    bhkTypes: SelectOption[];
    amenities: SelectOption[];
    keywordSuggestions: string[];
    onChange: (filters: FilterState) => void;
    onClose: () => void;
    onApply: () => void;
    onSkip: () => void;
}

const fallbackBhkOptions: SelectOption[] = [
    { id: "1_rk", name: "1 rk" },
    { id: "1_bhk", name: "1 bhk" },
    { id: "2_bhk", name: "2 bhk" },
    { id: "3_bhk", name: "3 bhk" },
];

const fallbackPropertyTypeOptions: SelectOption[] = [
    { id: "rent_house", name: "Rent House" },
    { id: "pg", name: "PGs" },
    { id: "zero_deposit", name: "Zero Deposit" },
    { id: "co_living", name: "Co-Living" },
];

const moveInOptions: { label: string; value: MoveInOption }[] = [
    { label: "Immediately", value: "immediately" },
    { label: "In 15 Days", value: "15_days" },
    { label: "In 30 Days", value: "30_days" },
];

const toggleValue = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const formatBudget = (value: number) => {
    if (value >= 100000) {
        const lakh = value / 100000;
        return `₹${Number.isInteger(lakh) ? lakh : lakh.toFixed(1)}L`;
    }
    return `₹${value.toLocaleString("en-IN")}`;
};

const toKeywordToken = (value: string) => value.trim().replace(/\s+/g, " ");

export default function FilterPanel({
    isOpen,
    filters,
    localities,
    propertyTypes,
    bhkTypes,
    amenities,
    keywordSuggestions,
    onChange,
    onClose,
    onApply,
    onSkip,
}: FilterPanelProps) {
    const [customKeyword, setCustomKeyword] = useState("");

    const filteredLocalities = useMemo(() => {
        const query = filters.query.toLowerCase();
        return localities.filter((locality) => locality.name.toLowerCase().includes(query));
    }, [localities, filters.query]);

    const resolvedPropertyTypes = propertyTypes.length > 0 ? propertyTypes : fallbackPropertyTypeOptions;
    const resolvedBhkTypes = bhkTypes.length > 0 ? bhkTypes : fallbackBhkOptions;
    const resolvedKeywordSuggestions = keywordSuggestions.filter(Boolean).slice(0, 8);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm">
            <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-[#090909] text-white">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
                    <h2 className="text-base font-semibold sm:text-lg">Your House Hunting starts here</h2>
                    <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#AF7AEB] text-sm text-[#AF7AEB] transition-colors hover:bg-[#AF7AEB]/10">
                        ✕
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:space-y-7 sm:px-6 sm:py-6">
                    <section className="rounded-2xl border border-[#B7F041] bg-[#121217] p-4 sm:rounded-3xl sm:p-5">
                        <h3 className="text-2xl font-light leading-tight text-white/90 sm:text-3xl">
                            Let&apos;s find your new house
                        </h3>
                        <div className="mt-4 rounded-xl bg-[#E7E7E7] px-4 py-2.5 text-black sm:rounded-2xl sm:py-3">
                            <input
                                value={filters.query}
                                onChange={(e) => onChange({ ...filters, query: e.target.value })}
                                placeholder="Search Locality"
                                className="w-full bg-transparent text-base font-semibold outline-none sm:text-lg"
                                style={{ userSelect: "text" }}
                            />
                        </div>

                        <p className="mt-4 text-lg text-white/80 sm:text-2xl">Currently Live in:</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                            {filteredLocalities.map((locality) => (
                                <Chip
                                    key={locality.id}
                                    label={locality.name}
                                    selected={(filters.selectedLocalityIds || []).includes(locality.id)}
                                    onClick={() =>
                                        onChange({
                                            ...filters,
                                            selectedLocalities: toggleValue(filters.selectedLocalities, locality.name),
                                            selectedLocalityIds: toggleValue(filters.selectedLocalityIds || [], locality.id),
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/30 bg-[#121217] p-4 sm:rounded-3xl sm:p-5">
                        <h3 className="text-xl font-semibold sm:text-2xl">BHK type</h3>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {resolvedBhkTypes.map((option) => (
                                <Chip
                                    key={option.id}
                                    label={option.name}
                                    selected={(filters.selectedBhkIds || []).includes(option.id)}
                                    onClick={() =>
                                        onChange({
                                            ...filters,
                                            selectedBhkIds: toggleValue(filters.selectedBhkIds || [], option.id),
                                            bhk: toggleValue(filters.bhk || [], option.name.toLowerCase()),
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/30 bg-[#121217] p-4 sm:rounded-3xl sm:p-5">
                        <h3 className="text-xl font-semibold sm:text-2xl">Budget</h3>
                        <div className="mt-3 flex items-center justify-between text-xl text-white/80 sm:text-2xl">
                            <span>{formatBudget(filters.budgetMin)}</span>
                            <span>{formatBudget(filters.budgetMax)}</span>
                        </div>
                        <p className="mt-2 text-sm text-[#B7F041]">Selected: {formatBudget(filters.budgetMax)}</p>
                        <input
                            type="range"
                            min={0}
                            max={200000}
                            step={1000}
                            value={filters.budgetMax}
                            onChange={(e) => onChange({ ...filters, budgetMax: Number(e.target.value) })}
                            className="mt-4 w-full appearance-none rounded-lg"
                            style={{
                                background: `linear-gradient(to right, #B7F041 0%, #B7F041 ${
                                    (filters.budgetMax / 200000) * 100
                                }%, #D8D8D8 ${(filters.budgetMax / 200000) * 100}%, #D8D8D8 100%)`,
                                height: "6px",
                            }}
                        />
                    </section>

                    <section className="rounded-2xl border border-white/30 bg-[#121217] p-4 sm:rounded-3xl sm:p-5">
                        <h3 className="text-xl font-semibold sm:text-2xl">Property Type</h3>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {resolvedPropertyTypes.map((option) => (
                                <Chip
                                    key={option.id}
                                    label={option.name}
                                    selected={(filters.selectedPropertyTypeIds || []).includes(option.id)}
                                    onClick={() =>
                                        onChange({
                                            ...filters,
                                            selectedPropertyTypeIds: toggleValue(filters.selectedPropertyTypeIds || [], option.id),
                                            propertyTypes: toggleValue(filters.propertyTypes || [], option.name.toLowerCase()),
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/30 bg-[#121217] p-4 sm:rounded-3xl sm:p-5">
                        <h3 className="text-xl font-semibold sm:text-2xl">Amenities</h3>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {amenities.map((option) => (
                                <Chip
                                    key={option.id}
                                    label={option.name}
                                    selected={(filters.amenityIds || []).includes(option.id)}
                                    onClick={() => onChange({ ...filters, amenityIds: toggleValue(filters.amenityIds || [], option.id) })}
                                />
                            ))}
                            {amenities.length === 0 ? (
                                <p className="text-xs text-white/60">Amenity options are currently unavailable.</p>
                            ) : null}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/30 bg-[#121217] p-4 sm:rounded-3xl sm:p-5">
                        <h3 className="text-xl font-semibold sm:text-2xl">Keywords</h3>
                        {resolvedKeywordSuggestions.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-3">
                                {resolvedKeywordSuggestions.map((keyword) => {
                                    const normalized = toKeywordToken(keyword);
                                    const selected = (filters.keywords || []).includes(normalized);
                                    return (
                                        <Chip
                                            key={normalized}
                                            label={keyword}
                                            selected={selected}
                                            onClick={() =>
                                                onChange({
                                                    ...filters,
                                                    keywords: toggleValue(filters.keywords || [], normalized),
                                                })
                                            }
                                        />
                                    );
                                })}
                            </div>
                        ) : null}
                        <div className="mt-3 flex items-center gap-2">
                            <input
                                value={customKeyword}
                                onChange={(event) => setCustomKeyword(event.target.value)}
                                placeholder="Add keyword"
                                className="h-11 flex-1 rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB]"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const normalized = toKeywordToken(customKeyword);
                                    if (!normalized) return;
                                    if ((filters.keywords || []).includes(normalized)) {
                                        setCustomKeyword("");
                                        return;
                                    }
                                    onChange({ ...filters, keywords: [...(filters.keywords || []), normalized] });
                                    setCustomKeyword("");
                                }}
                                className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-black"
                            >
                                Add
                            </button>
                        </div>
                        {(filters.keywords || []).length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {(filters.keywords || []).map((keyword) => (
                                    <button
                                        key={keyword}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...filters,
                                                keywords: (filters.keywords || []).filter((item) => item !== keyword),
                                            })
                                        }
                                        className="rounded-xl border border-[#A67AEB]/50 bg-[#A67AEB]/10 px-3 py-2 text-sm text-[#e2d4ff]"
                                    >
                                        {keyword} ×
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold sm:text-2xl">Move In by</h3>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {moveInOptions.map((option) => (
                                <Chip
                                    key={option.value}
                                    label={option.label}
                                    selected={filters.moveInBy.includes(option.value)}
                                    onClick={() => onChange({ ...filters, moveInBy: toggleValue(filters.moveInBy, option.value) })}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                <div className="border-t border-white/10 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-between gap-3">
                        <button onClick={onSkip} className="text-base font-bold underline underline-offset-4 sm:text-lg">
                            Skip
                        </button>
                        <PrimaryButton onClick={onApply} className="min-w-[140px] sm:min-w-[180px]">
                            Next
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
