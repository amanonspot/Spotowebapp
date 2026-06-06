"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNavigation from "@/components/BottomNavigation";
import Chip from "@/components/revamp/Chip";
import FilterPanel from "@/components/revamp/FilterPanel";
import RevampPropertyCard from "@/components/revamp/PropertyCard";
import ShimmerBlock from "@/components/revamp/ShimmerBlock";
import { propertyAdapter } from "@/lib/adapters";
import { FilterState, PropertyListItem, SelectOption } from "@/lib/adapters/types";
import { normalizeMasterOptions, rentalsService, toMasterSelectOption } from "@/lib/rentals";
import { defaultFilterState } from "@/mocks/properties";

const PREF_FLAG = "spoto_pref_completed";
const INITIAL_VISIBLE_RESULTS = 9;
const APPEND_CHUNK_SIZE = 6;

const sortOptions: { label: string; value: FilterState["sortBy"] }[] = [
    { label: "Recommended", value: "recommended" },
    { label: "Price Low to High", value: "price_low_to_high" },
    { label: "Price High to Low", value: "price_high_to_low" },
    { label: "Newest", value: "newest" },
];

export default function SearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [localities, setLocalities] = useState<SelectOption[]>([]);
    const [propertyTypeOptions, setPropertyTypeOptions] = useState<SelectOption[]>([]);
    const [bhkTypeOptions, setBhkTypeOptions] = useState<SelectOption[]>([]);
    const [amenityOptions, setAmenityOptions] = useState<SelectOption[]>([]);
    const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
    const [filters, setFilters] = useState<FilterState>(defaultFilterState);
    const [results, setResults] = useState<PropertyListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPanel, setShowPanel] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RESULTS);
    const [isAppending, setIsAppending] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const appendTimerRef = useRef<number | null>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestFiltersRef = useRef<FilterState | null>(null);

    const runSearch = useCallback(async (nextFilters: FilterState) => {
        setLoading(true);
        setError(null);
        try {
            const data = await propertyAdapter.searchProperties(nextFilters);
            // Discard stale results if a newer search has already been queued
            if (latestFiltersRef.current !== nextFilters) return;
            setResults(data);
        } catch (searchError) {
            if (latestFiltersRef.current !== nextFilters) return;
            setResults([]);
            setError(searchError instanceof Error ? searchError.message : "Unable to search properties");
        } finally {
            if (latestFiltersRef.current === nextFilters) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialWhere = searchParams.get("where") || searchParams.get("location") || "";

        setFilters((prev) => ({
            ...prev,
            query: initialWhere,
        }));
    }, [searchParams]);

    useEffect(() => {
        let mounted = true;

        const boot = async () => {
            try {
                const [propertyTypesRes, bhkRes, amenitiesRes, citiesRes] = await Promise.allSettled([
                    rentalsService.listPropertyTypes(),
                    rentalsService.listBhkTypes(),
                    rentalsService.listAmenities(),
                    rentalsService.listCities(),
                ]);
                if (mounted === false) return;

                const cityOptions =
                    citiesRes.status === "fulfilled"
                        ? normalizeMasterOptions(citiesRes.value).map(toMasterSelectOption)
                        : [];
                const primaryCityId = cityOptions[0]?.id;
                if (primaryCityId) {
                    try {
                        const localityRes = await rentalsService.listLocalities(primaryCityId);
                        if (mounted) {
                            setLocalities(normalizeMasterOptions(localityRes).map(toMasterSelectOption));
                        }
                    } catch {
                        // localities load with first search results
                    }
                }

                if (propertyTypesRes.status === "fulfilled") {
                    setPropertyTypeOptions(normalizeMasterOptions(propertyTypesRes.value).map(toMasterSelectOption));
                }
                if (bhkRes.status === "fulfilled") {
                    setBhkTypeOptions(normalizeMasterOptions(bhkRes.value).map(toMasterSelectOption));
                }
                if (amenitiesRes.status === "fulfilled") {
                    setAmenityOptions(normalizeMasterOptions(amenitiesRes.value).map(toMasterSelectOption));
                }
            } catch (bootError) {
                if (mounted) {
                    setError(bootError instanceof Error ? bootError.message : "Unable to load search localities");
                }
            }

            if (typeof window !== "undefined") {
                const done = window.localStorage.getItem(PREF_FLAG);
                if (done === null) {
                    setShowPanel(true);
                }
            }
        };

        boot();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

        latestFiltersRef.current = filters;

        // Debounce only the text query — other filter changes run immediately
        const delay = filters.query ? 400 : 0;

        searchTimerRef.current = setTimeout(() => {
            runSearch(filters);
        }, delay);

        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, [filters, runSearch]);

    useEffect(() => {
        setVisibleCount(Math.min(INITIAL_VISIBLE_RESULTS, results.length));
    }, [results]);

    const visibleResults = useMemo(() => results.slice(0, visibleCount), [results, visibleCount]);
    const hasMoreVisible = visibleCount < results.length;

    useEffect(() => {
        if (!hasMoreVisible || loading) return;
        const node = loadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (!first?.isIntersecting || isAppending) return;

                setIsAppending(true);
                appendTimerRef.current = window.setTimeout(() => {
                    setVisibleCount((prev) => Math.min(results.length, prev + APPEND_CHUNK_SIZE));
                    setIsAppending(false);
                }, 120);
            },
            {
                rootMargin: "240px 0px",
            }
        );

        observer.observe(node);
        return () => {
            observer.disconnect();
            if (appendTimerRef.current) {
                window.clearTimeout(appendTimerRef.current);
                appendTimerRef.current = null;
            }
        };
    }, [hasMoreVisible, isAppending, loading, results.length]);

    const applyPreferences = () => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(PREF_FLAG, "1");
        }
        setShowPanel(false);
    };

    const skipPreferences = () => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(PREF_FLAG, "1");
        }
        setShowPanel(false);
    };

    const handleRetry = () => {
        runSearch(filters);
    };

    return (
        <main className="min-h-screen bg-[#040405] pb-24 text-white">
            <div className="mx-auto max-w-[1280px] px-4 pb-8 pt-4 sm:px-6 lg:px-8">
                <div className="mb-4 flex items-center gap-3">
                    <button
                        onClick={() => router.push("/")}
                        className="btn-shimmer flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-base hover:border-[#A67AEB] active:scale-[0.95]"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => setShowPanel(true)}
                        className="input-glow flex-1 rounded-full border border-white/15 bg-[#141417] px-5 py-3 text-left text-base text-white/80 hover:text-white/95 active:scale-[0.995]"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="h-4 w-4 shrink-0 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Edit House Preference
                        </span>
                    </button>
                </div>

                <div className="input-glow mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#131318] px-4 py-3">
                    <svg className="h-4 w-4 shrink-0 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        value={filters.query}
                        onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                        placeholder="Search locality, city or property..."
                        className="w-full bg-transparent text-base outline-none placeholder:text-white/35"
                    />
                    {filters.query && (
                        <button
                            onClick={() => setFilters((prev) => ({ ...prev, query: "" }))}
                            className="shrink-0 text-white/40 hover:text-white/70 transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/45">Sort by</h2>
                <div className="scrollbar-hide mb-5 flex gap-2.5 overflow-x-auto pb-2">
                    {sortOptions.map((option) => (
                        <Chip
                            key={option.value}
                            label={option.label}
                            selected={filters.sortBy === option.value}
                            onClick={() => setFilters((prev) => ({ ...prev, sortBy: option.value }))}
                        />
                    ))}
                </div>

                <div className="animate-fade-in mb-4 flex items-center gap-2 text-sm text-white/50">
                    {loading ? (
                        <>
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#A67AEB] border-t-transparent" />
                            <span>Searching...</span>
                        </>
                    ) : (
                        <span>
                            <span className="font-bold text-white/80">{results.length}</span> results found
                        </span>
                    )}
                </div>
                {error ? (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={handleRetry}
                            className="mt-2 rounded-md border border-red-300/35 px-2 py-1 text-xs"
                        >
                            Retry Search
                        </button>
                    </div>
                ) : null}

                {loading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={`search-skeleton-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E10]">
                                <ShimmerBlock className="h-48 w-full sm:h-56" />
                                <div className="space-y-2 p-4">
                                    <ShimmerBlock className="h-5 w-4/5 rounded-lg" />
                                    <ShimmerBlock className="h-4 w-1/3 rounded-lg" />
                                    <ShimmerBlock className="h-5 w-1/2 rounded-lg" />
                                    <ShimmerBlock className="h-4 w-2/3 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                            {visibleResults.map((property, idx) => (
                                <div
                                    key={property.id}
                                    className="animate-card"
                                    style={{ animationDelay: `${Math.min(idx * 0.05, 0.35)}s` }}
                                >
                                    <RevampPropertyCard
                                        property={property}
                                        onClick={() => router.push("/booking/" + property.id)}
                                    />
                                </div>
                            ))}
                        </div>
                        {hasMoreVisible ? (
                            <div ref={loadMoreRef} className="py-2">
                                {isAppending && (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <div key={`append-skeleton-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E10]">
                                                <ShimmerBlock className="h-48 w-full sm:h-56" />
                                                <div className="space-y-2 p-4">
                                                    <ShimmerBlock className="h-5 w-4/5 rounded-lg" />
                                                    <ShimmerBlock className="h-4 w-1/3 rounded-lg" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : results.length > 0 ? (
                            <p className="py-2 text-center text-xs text-white/55">You've seen all results.</p>
                        ) : (
                            <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-5 text-center text-sm text-white/65">
                                No listings match these filters yet.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <FilterPanel
                isOpen={showPanel}
                filters={filters}
                localities={localities}
                propertyTypes={propertyTypeOptions}
                bhkTypes={bhkTypeOptions}
                amenities={amenityOptions}
                keywordSuggestions={keywordSuggestions}
                onChange={setFilters}
                onClose={() => setShowPanel(false)}
                onApply={applyPreferences}
                onSkip={skipPreferences}
            />

            <BottomNavigation onSearchClick={() => setShowPanel(true)} />
        </main>
    );
}
