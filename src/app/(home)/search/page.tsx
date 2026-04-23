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

    const runSearch = useCallback(async (nextFilters: FilterState) => {
        setLoading(true);
        setError(null);
        try {
            const data = await propertyAdapter.searchProperties(nextFilters);
            setResults(data);
        } catch (searchError) {
            setResults([]);
            setError(searchError instanceof Error ? searchError.message : "Unable to search properties");
        } finally {
            setLoading(false);
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
                const feed = await propertyAdapter.getHomeFeed();
                if (mounted === false) return;

                setLocalities(
                    feed.localityOptions && feed.localityOptions.length > 0
                        ? feed.localityOptions
                        : feed.localities.map((name) => ({ id: name, name }))
                );

                const suggestionSet = new Set<string>();
                feed.listings.forEach((listing) => {
                    (listing.badges || []).forEach((badge) => suggestionSet.add(badge));
                    (listing.features || []).forEach((feature) => suggestionSet.add(feature));
                });
                setKeywordSuggestions(Array.from(suggestionSet).slice(0, 12));

                const [propertyTypesRes, bhkRes, amenitiesRes] = await Promise.allSettled([
                    rentalsService.listPropertyTypes(),
                    rentalsService.listBhkTypes(),
                    rentalsService.listAmenities(),
                ]);

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
        runSearch(filters);
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
        <main className="min-h-screen bg-[#050507] pb-24 text-white">
            <div className="mx-auto max-w-[1280px] px-4 pb-8 pt-4 sm:px-6 lg:px-8">
                <div className="mb-5 flex items-center gap-3">
                    <button
                        onClick={() => router.push("/")}
                        className="rounded-full border border-white/30 px-3 py-2 transition hover:border-[#A67AEB] active:scale-[0.98]"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => setShowPanel(true)}
                        className="flex-1 rounded-full border border-white/25 bg-[#141417] px-5 py-4 text-left text-xl text-white/85 transition hover:border-[#A67AEB]/70 active:scale-[0.995]"
                    >
                        Edit House Preference
                    </button>
                </div>

                <div className="mb-5 rounded-2xl border border-white/10 bg-[#131318] px-4 py-3 transition focus-within:border-[#A67AEB]/80 hover:border-[#A67AEB]/30">
                    <input
                        value={filters.query}
                        onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                        placeholder="Search locality"
                        className="w-full bg-transparent text-lg outline-none"
                    />
                </div>

                <h2 className="mb-4 text-center text-5xl font-semibold">Sort by</h2>
                <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
                    {sortOptions.map((option) => (
                        <Chip
                            key={option.value}
                            label={option.label}
                            selected={filters.sortBy === option.value}
                            onClick={() => setFilters((prev) => ({ ...prev, sortBy: option.value }))}
                        />
                    ))}
                </div>

                <div className="mb-4 text-sm text-white/70">{loading ? "Searching..." : results.length + " results found"}</div>
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
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={`search-skeleton-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E10]">
                                <ShimmerBlock className="h-56 w-full" />
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
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {visibleResults.map((property) => (
                            <RevampPropertyCard
                                key={property.id}
                                property={property}
                                onClick={() => router.push("/booking/" + property.id)}
                            />
                        ))}
                        </div>
                        {hasMoreVisible ? (
                            <div ref={loadMoreRef} className="space-y-2 py-2">
                                {isAppending ? (
                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <div key={`append-skeleton-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E10]">
                                                <ShimmerBlock className="h-56 w-full" />
                                                <div className="space-y-2 p-4">
                                                    <ShimmerBlock className="h-5 w-4/5 rounded-lg" />
                                                    <ShimmerBlock className="h-4 w-1/3 rounded-lg" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-xs text-white/55">Scroll to load more results</p>
                                )}
                            </div>
                        ) : results.length > 0 ? (
                            <p className="text-center text-xs text-white/55">You have reached the end of results.</p>
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
