"use client";

import React, { useEffect, useRef } from "react";
import config from "@/config/config";

export type MapPinPick = {
    lat: string;
    lng: string;
    mapUrl: string;
};

type OwnerMapPinPickerProps = {
    mapQuery: string;
    initialLat: string;
    initialLng: string;
    onPick: (pick: MapPinPick) => void;
};

function getMapsApiKey(): string {
    return (config.googleMapsApiKey || config.googlePlacesApiKey || "").trim();
}

function ensureMapsLoaded(): Promise<void> {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("maps require browser"));
    }
    if (window.google?.maps?.Map) {
        return Promise.resolve();
    }
    const key = getMapsApiKey();
    if (!key) {
        return Promise.reject(new Error("Missing Google Maps API key"));
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
        return new Promise((resolve, reject) => {
            if (window.google?.maps?.Map) {
                resolve();
                return;
            }
            const onLoad = () => {
                existing.removeEventListener("load", onLoad);
                resolve();
            };
            const onErr = () => {
                existing.removeEventListener("error", onErr);
                reject(new Error("Google Maps script failed"));
            };
            existing.addEventListener("load", onLoad);
            existing.addEventListener("error", onErr);
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Google Maps script failed"));
        document.head.appendChild(script);
    });
}

function isValidCoord(lat: number, lng: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export default function OwnerMapPinPicker({ mapQuery, initialLat, initialLng, onPick }: OwnerMapPinPickerProps) {
    const mapElRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const onPickRef = useRef(onPick);
    onPickRef.current = onPick;

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            if (!getMapsApiKey() || !mapElRef.current) return;

            try {
                await ensureMapsLoaded();
            } catch {
                return;
            }
            if (cancelled || !mapElRef.current) return;

            const geocoder = new google.maps.Geocoder();
            let center = { lat: 20.5937, lng: 78.9629 };

            const lat0 = parseFloat(initialLat);
            const lng0 = parseFloat(initialLng);
            if (isValidCoord(lat0, lng0)) {
                center = { lat: lat0, lng: lng0 };
            } else if (mapQuery.trim()) {
                await new Promise<void>((resolve) => {
                    geocoder.geocode({ address: mapQuery }, (results, status) => {
                        if (status === "OK" && results?.[0]?.geometry?.location) {
                            const loc = results[0].geometry.location;
                            center = { lat: loc.lat(), lng: loc.lng() };
                        }
                        resolve();
                    });
                });
            }

            if (cancelled || !mapElRef.current) return;

            const map = new google.maps.Map(mapElRef.current, {
                center,
                zoom: isValidCoord(lat0, lng0) ? 17 : 14,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                clickableIcons: false,
            });
            mapRef.current = map;

            const publish = (lat: number, lng: number) => {
                const latS = String(lat);
                const lngS = String(lng);
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latS},${lngS}`)}`;
                onPickRef.current({ lat: latS, lng: lngS, mapUrl });
            };

            // Always place a draggable pin at the center (geocoded or existing coords)
            const marker = new google.maps.Marker({
                position: center,
                map,
                draggable: true,
                title: "Move pin to your exact location",
            });
            markerRef.current = marker;
            publish(center.lat, center.lng);

            marker.addListener("dragend", () => {
                const pos = marker.getPosition();
                if (!pos) return;
                const lat = pos.lat();
                const lng = pos.lng();
                if (!isValidCoord(lat, lng)) return;
                publish(lat, lng);
            });

            map.addListener("click", (e: google.maps.MapMouseEvent) => {
                const ll = e.latLng;
                if (!ll) return;
                const lat = ll.lat();
                const lng = ll.lng();
                if (!isValidCoord(lat, lng)) return;
                marker.setPosition({ lat, lng });
                publish(lat, lng);
            });
        };

        init();

        return () => {
            cancelled = true;
            markerRef.current = null;
            mapRef.current = null;
        };
        // Intentionally run once on mount; mapQuery/initial coords used for first frame only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !mapQuery.trim()) return;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: mapQuery }, (results, status) => {
            if (status !== "OK" || !results?.[0]?.geometry?.location) return;
            const loc = results[0].geometry.location;
            const lat = loc.lat();
            const lng = loc.lng();
            map.panTo({ lat, lng });
            map.setZoom(15);

            // Move existing marker OR create one if not yet placed
            if (markerRef.current) {
                markerRef.current.setPosition({ lat, lng });
            } else {
                const publish = (la: number, ln: number) => {
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${la},${ln}`)}`;
                    onPickRef.current({ lat: String(la), lng: String(ln), mapUrl });
                };

                const marker = new google.maps.Marker({
                    position: { lat, lng },
                    map,
                    draggable: true,
                    title: "Move pin to your exact location",
                });
                markerRef.current = marker;

                marker.addListener("dragend", () => {
                    const pos = marker.getPosition();
                    if (!pos) return;
                    publish(pos.lat(), pos.lng());
                });

                map.addListener("click", (e: google.maps.MapMouseEvent) => {
                    if (!e.latLng) return;
                    marker.setPosition(e.latLng);
                    publish(e.latLng.lat(), e.latLng.lng());
                });

                publish(lat, lng);
            }
        });
    }, [mapQuery]);

    if (!getMapsApiKey()) {
        return null;
    }

    return (
        <div
            ref={mapElRef}
            className="h-56 w-full overflow-hidden rounded-xl border border-white/20 bg-[#0d0d14]"
            role="presentation"
        />
    );
}
