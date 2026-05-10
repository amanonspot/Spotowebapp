"use client";

import React, { useEffect, useRef, useState } from "react";
import config from "@/config/config";

type Props = {
    cityName: string;
    value: string;
    onChange: (localityName: string) => void;
    className?: string;
};

function getMapsKey(): string {
    return (config.googlePlacesApiKey || config.googleMapsApiKey || "").trim();
}

function ensurePlacesLoaded(): Promise<void> {
    if (typeof window === "undefined") return Promise.reject();
    if (window.google?.maps?.places) return Promise.resolve();

    const key = getMapsKey();
    if (!key) return Promise.reject(new Error("No Places API key"));

    const existing = document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
        return new Promise((resolve) => {
            const check = setInterval(() => {
                if (window.google?.maps?.places) { clearInterval(check); resolve(); }
            }, 100);
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
    });
}

export default function LocalityAutocomplete({ cityName, value, onChange, className = "" }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [useFallback, setUseFallback] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Google Places Autocomplete setup
    useEffect(() => {
        if (!inputRef.current) return;
        let cancelled = false;

        ensurePlacesLoaded()
            .then(() => {
                if (cancelled || !inputRef.current) return;

                const ac = new google.maps.places.Autocomplete(inputRef.current, {
                    types: ["sublocality", "neighborhood", "locality"],
                    componentRestrictions: { country: "in" },
                    fields: ["name", "formatted_address"],
                });
                autocompleteRef.current = ac;

                ac.addListener("place_changed", () => {
                    const place = ac.getPlace();
                    const name = place.name || place.formatted_address || "";
                    // Extract just the locality name (first part before comma)
                    const localityOnly = name.split(",")[0].trim();
                    onChange(localityOnly);
                });
            })
            .catch(() => {
                if (!cancelled) setUseFallback(true);
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Nominatim fallback search
    const searchNominatim = async (query: string) => {
        if (!query.trim()) { setSuggestions([]); return; }
        const city = cityName ? `, ${cityName}` : "";
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + city)}&countrycodes=in&limit=6&addressdetails=1`;
        try {
            const res = await fetch(url, { headers: { "Accept-Language": "en" } });
            const data = await res.json();
            const names: string[] = Array.from(
                new Set(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.map((item: any) => (item.address?.suburb || item.address?.neighbourhood || item.address?.village || item.display_name.split(",")[0]).trim()).filter(Boolean)
                )
            );
            setSuggestions(names.slice(0, 6));
            setShowSuggestions(true);
        } catch {
            setSuggestions([]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        if (useFallback) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => searchNominatim(val), 500);
        }
    };

    const baseClass = `h-12 w-full rounded-xl border border-white/20 bg-[#0d0d14] px-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[#A67AEB] ${className}`;

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onFocus={() => { if (useFallback && suggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Type your locality / area…"
                autoComplete="off"
                className={baseClass}
            />
            {useFallback && showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/15 bg-[#1a1a2e] shadow-xl">
                    {suggestions.map((s) => (
                        <li
                            key={s}
                            onMouseDown={() => { onChange(s); setSuggestions([]); setShowSuggestions(false); }}
                            className="cursor-pointer px-4 py-2.5 text-sm text-white/85 hover:bg-white/10"
                        >
                            {s}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
