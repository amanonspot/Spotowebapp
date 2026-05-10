"use client";

import React, { useEffect, useRef } from "react";
import config from "@/config/config";

export type AddressPick = {
    addressLine: string;
    streetLocalityArea: string;
    localityName: string;
    cityName: string;
    lat: string;
    lng: string;
    mapUrl: string;
};

type Props = {
    value: string;
    onChange: (value: string) => void;
    onPick: (pick: AddressPick) => void;
    placeholder?: string;
    className?: string;
};

function getMapsKey() {
    return (config.googlePlacesApiKey || config.googleMapsApiKey || "").trim();
}

function ensurePlacesLoaded(): Promise<void> {
    if (typeof window === "undefined") return Promise.reject();
    if (window.google?.maps?.places) return Promise.resolve();
    const key = getMapsKey();
    if (!key) return Promise.reject();
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

function getComponent(components: google.maps.GeocoderAddressComponent[], types: string[]): string {
    return components.find(c => types.some(t => c.types.includes(t)))?.long_name || "";
}

export default function AddressAutocomplete({ value, onChange, onPick, placeholder, className = "" }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const onPickRef = useRef(onPick);
    onPickRef.current = onPick;

    useEffect(() => {
        if (!getMapsKey() || !inputRef.current) return;
        let cancelled = false;

        ensurePlacesLoaded().then(() => {
            if (cancelled || !inputRef.current) return;

            const ac = new google.maps.places.Autocomplete(inputRef.current!, {
                types: ["address"],
                componentRestrictions: { country: "in" },
                fields: ["address_components", "geometry", "name", "formatted_address"],
            });

            ac.addListener("place_changed", () => {
                const place = ac.getPlace();
                if (!place.geometry?.location) return;

                const comps = place.address_components || [];
                const streetNum  = getComponent(comps, ["street_number"]);
                const route      = getComponent(comps, ["route"]);
                const sublocal2  = getComponent(comps, ["sublocality_level_2"]);
                const sublocal1  = getComponent(comps, ["sublocality_level_1", "sublocality"]);
                const locality   = getComponent(comps, ["locality"]);
                const city       = getComponent(comps, ["administrative_area_level_2", "locality"]);

                const addressLine = [streetNum, route].filter(Boolean).join(" ") || place.name || "";
                const streetArea  = sublocal2 || "";
                const localityName = sublocal1 || locality || "";
                const cityName = city || "";

                const lat = String(place.geometry.location.lat());
                const lng = String(place.geometry.location.lng());
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;

                onChange(addressLine);
                onPickRef.current({ addressLine, streetLocalityArea: streetArea, localityName, cityName, lat, lng, mapUrl });
            });
        }).catch(() => {/* no key — plain input */});

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className={className}
        />
    );
}
