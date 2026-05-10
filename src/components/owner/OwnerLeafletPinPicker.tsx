"use client";

import React, { useEffect, useRef, useState } from "react";
import type { MapPinPick } from "./OwnerMapPinPicker";

type Props = {
    mapQuery: string;
    initialLat: string;
    initialLng: string;
    onPick: (pick: MapPinPick) => void;
};

function isValidCoord(lat: number, lng: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

async function geocodeNominatim(query: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        if (data?.[0]) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch {
        // silently fail
    }
    return null;
}

function LeafletExpandWrapper({ containerRef, mapRef }: { containerRef: React.RefObject<HTMLDivElement | null>; mapRef: React.RefObject<import("leaflet").Map | null> }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="relative">
            <div
                ref={containerRef}
                className={`w-full overflow-hidden rounded-xl border border-white/20 transition-all duration-300 ${expanded ? "h-[70vh]" : "h-56"}`}
            />
            <button
                type="button"
                onClick={() => {
                    setExpanded((prev) => !prev);
                    setTimeout(() => mapRef.current?.invalidateSize(), 310);
                }}
                className="absolute bottom-2 right-2 z-[1000] flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1.5 text-[11px] font-semibold text-black shadow"
            >
                {expanded ? (
                    <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
                        Collapse
                    </>
                ) : (
                    <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                        Expand
                    </>
                )}
            </button>
        </div>
    );
}

export default function OwnerLeafletPinPicker({ mapQuery, initialLat, initialLng, onPick }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<import("leaflet").Map | null>(null);
    const markerRef = useRef<import("leaflet").Marker | null>(null);
    const onPickRef = useRef(onPick);
    onPickRef.current = onPick;

    const publish = (lat: number, lng: number) => {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
        onPickRef.current({ lat: String(lat), lng: String(lng), mapUrl });
    };

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            if (!containerRef.current) return;

            const L = (await import("leaflet")).default;

            // Fix default marker icon paths broken by bundlers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            if (cancelled || !containerRef.current) return;

            let center: [number, number] = [20.5937, 78.9629];
            let zoom = 5;

            const lat0 = parseFloat(initialLat);
            const lng0 = parseFloat(initialLng);
            if (isValidCoord(lat0, lng0)) {
                center = [lat0, lng0];
                zoom = 17;
            } else if (mapQuery.trim()) {
                const geo = await geocodeNominatim(mapQuery);
                if (geo && !cancelled) {
                    center = [geo.lat, geo.lng];
                    zoom = 15;
                }
            }

            if (cancelled || !containerRef.current) return;

            const map = L.map(containerRef.current, {
                center,
                zoom,
                zoomControl: true,
            });
            mapRef.current = map;

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap",
                maxZoom: 19,
            }).addTo(map);

            const marker = L.marker(center, { draggable: true })
                .addTo(map)
                .bindTooltip("Move pin to your exact location", {
                    permanent: true,
                    direction: "top",
                    offset: [0, -10],
                    className: "leaflet-spoto-tooltip",
                })
                .openTooltip();
            markerRef.current = marker;
            publish(center[0], center[1]);

            marker.on("dragend", () => {
                const pos = marker.getLatLng();
                publish(pos.lat, pos.lng);
            });

            map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
                const { lat, lng } = e.latlng;
                if (!isValidCoord(lat, lng)) return;
                marker.setLatLng([lat, lng]);
                publish(lat, lng);
            });
        };

        init();

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-geocode when address query changes (debounced, after initial mount)
    const isFirstRun = useRef(true);
    useEffect(() => {
        if (isFirstRun.current) { isFirstRun.current = false; return; }
        const map = mapRef.current;
        const marker = markerRef.current;
        if (!map || !marker || !mapQuery.trim()) return;

        const timer = setTimeout(() => {
            geocodeNominatim(mapQuery).then((geo) => {
                if (!geo || !mapRef.current) return;
                map.setView([geo.lat, geo.lng], 15);
                marker.setLatLng([geo.lat, geo.lng]);
                publish(geo.lat, geo.lng);
            });
        }, 700);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapQuery]);

    return (
        <>
            <style>{`
                .leaflet-spoto-tooltip {
                    background: white;
                    color: #111;
                    font-size: 13px;
                    font-weight: 500;
                    border-radius: 8px;
                    padding: 6px 12px;
                    border: none;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.25);
                    white-space: nowrap;
                }
                .leaflet-spoto-tooltip::before {
                    border-top-color: white !important;
                }
            `}</style>
            <LeafletExpandWrapper containerRef={containerRef} mapRef={mapRef} />
        </>
    );
}
