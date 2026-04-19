"use client";

import React, { useMemo } from "react";
import { BHKOption, FilterState, MoveInOption, PropertyType, SelectOption } from "@/lib/adapters/types";
import Chip from "@/components/revamp/Chip";
import PrimaryButton from "@/components/revamp/PrimaryButton";

interface FilterPanelProps {
    isOpen: boolean;
    filters: FilterState;
    localities: SelectOption[];
    onChange: (filters: FilterState) => void;
    onClose: () => void;
    onApply: () => void;
    onSkip: () => void;
}

const bhkOptions: { label: string; value: BHKOption }[] = [
    { label: "1 rk", value: "1_rk" },
    { label: "1 bhk", value: "1_bhk" },
    { label: "2 bhk", value: "2_bhk" },
    { label: "3 bhk", value: "3_bhk" },
];

const propertyTypeOptions: { label: string; value: PropertyType }[] = [
    { label: "Rent House", value: "rent_house" },
    { label: "PGs", value: "pg" },
    { label: "Zero Deposit", value: "zero_deposit" },
    { label: "Co-Living", value: "co_living" },
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

export default function FilterPanel({
    isOpen,
    filters,
    localities,
    onChange,
    onClose,
    onApply,
    onSkip,
}: FilterPanelProps) {
    const filteredLocalities = useMemo(() => {
        const query = filters.query.toLowerCase();
        return localities.filter((locality) => locality.name.toLowerCase().includes(query));
    }, [localities, filters.query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm">
            <div className="mx-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-[#090909] text-white">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                    <h2 className="text-lg font-semibold">Your House Hunting starts here</h2>
                    <button onClick={onClose} className="rounded-full border border-[#AF7AEB] p-2 text-[#AF7AEB]">
                        ✕
                    </button>
                </div>

                <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
                    <section className="rounded-3xl border border-[#B7F041] bg-[#121217] p-5">
                        <h3 className="text-4xl font-light leading-tight text-white/90">
                            Let's find your new <span className="font-bold">House</span>
                        </h3>
                        <div className="mt-4 rounded-2xl bg-[#E7E7E7] px-4 py-3 text-black">
                            <input
                                value={filters.query}
                                onChange={(e) => onChange({ ...filters, query: e.target.value })}
                                placeholder="Search Locality"
                                className="w-full bg-transparent text-lg font-semibold outline-none"
                            />
                        </div>

                        <p className="mt-4 text-3xl text-white/80">Currently Live in:</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                            {filteredLocalities.map((locality) => (
                                <Chip
                                    key={locality.id}
                                    label={locality.name}
                                    selected={(filters.selectedLocalityIds || []).includes(locality.id)}
                                    onClick={() =>
                                        onChange({
                                            ...filters,
                                            selectedLocalities: toggleValue(
                                                filters.selectedLocalities,
                                                locality.name
                                            ),
                                            selectedLocalityIds: toggleValue(
                                                filters.selectedLocalityIds || [],
                                                locality.id
                                            ),
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-white/30 bg-[#121217] p-5">
                        <h3 className="text-2xl font-semibold">BHK type</h3>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {bhkOptions.map((option) => (
                                <Chip
                                    key={option.value}
                                    label={option.label}
                                    selected={filters.bhk.includes(option.value)}
                                    onClick={() => onChange({ ...filters, bhk: toggleValue(filters.bhk, option.value) })}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-white/30 bg-[#121217] p-5">
                        <h3 className="text-2xl font-semibold">Budget</h3>
                        <div className="mt-3 flex items-center justify-between text-3xl text-white/80">
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

                    <section className="rounded-3xl border border-white/30 bg-[#121217] p-5">
                        <h3 className="text-2xl font-semibold">Property Type</h3>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {propertyTypeOptions.map((option) => (
                                <Chip
                                    key={option.value}
                                    label={option.label}
                                    selected={filters.propertyTypes.includes(option.value)}
                                    onClick={() =>
                                        onChange({
                                            ...filters,
                                            propertyTypes: toggleValue(filters.propertyTypes, option.value),
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-2xl font-semibold">Move In by</h3>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {moveInOptions.map((option) => (
                                <Chip
                                    key={option.value}
                                    label={option.label}
                                    selected={filters.moveInBy.includes(option.value)}
                                    onClick={() =>
                                        onChange({ ...filters, moveInBy: toggleValue(filters.moveInBy, option.value) })
                                    }
                                />
                            ))}
                        </div>
                    </section>
                </div>

                <div className="border-t border-white/10 px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <button onClick={onSkip} className="text-lg font-bold underline underline-offset-4">
                            Skip
                        </button>
                        <PrimaryButton onClick={onApply} className="min-w-[180px]">
                            Next
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
