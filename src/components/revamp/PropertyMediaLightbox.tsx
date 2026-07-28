"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import PropertyMediaPreview from "@/components/revamp/PropertyMediaPreview";
import { PropertyMediaItem } from "@/lib/rentals/mediaUtils";

interface PropertyMediaLightboxProps {
    items: PropertyMediaItem[];
    initialIndex?: number;
    open: boolean;
    onClose: () => void;
    title?: string;
}

export default function PropertyMediaLightbox({
    items,
    initialIndex = 0,
    open,
    onClose,
    title = "Property photos",
}: PropertyMediaLightboxProps) {
    const [index, setIndex] = useState(initialIndex);

    useEffect(() => {
        if (open) {
            setIndex(Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0)));
        }
    }, [open, initialIndex, items.length]);

    const goPrev = useCallback(() => {
        setIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
    }, [items.length]);

    const goNext = useCallback(() => {
        setIndex((current) => (current >= items.length - 1 ? 0 : current + 1));
    }, [items.length]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
            if (event.key === "ArrowLeft") goPrev();
            if (event.key === "ArrowRight") goNext();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open, onClose, goPrev, goNext]);

    if (!open || items.length === 0) return null;

    const current = items[index];
    const isVideo = current.mediaType === "video";

    return (
        <div
            className="fixed inset-0 z-[150] flex flex-col bg-[#040405]/98 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-white/45">
                        {index + 1} of {items.length}
                        {isVideo ? " · Video" : ""}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                    aria-label="Close preview"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 py-4 md:px-10">
                {items.length > 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={goPrev}
                            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 md:left-4"
                            aria-label="Previous photo"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 md:right-4"
                            aria-label="Next photo"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </>
                ) : null}

                <div
                    className="flex h-full max-h-[min(72vh,820px)] w-full max-w-5xl items-center justify-center"
                    onClick={(event) => event.stopPropagation()}
                >
                    <PropertyMediaPreview
                        item={current}
                        alt={`${title} ${index + 1}`}
                        className={`max-h-[min(72vh,820px)] w-full ${
                            isVideo ? "object-contain" : "object-contain"
                        }`}
                        wrapperClassName="flex h-full w-full items-center justify-center"
                        controls={isVideo}
                        autoPlay={isVideo}
                        muted={false}
                        loop={isVideo}
                    />
                </div>
            </div>

            {items.length > 1 ? (
                <div className="border-t border-white/10 px-4 py-3 md:px-6">
                    <div className="scrollbar-hide mx-auto flex max-w-5xl gap-2 overflow-x-auto pb-1">
                        {items.map((item, itemIndex) => {
                            const active = itemIndex === index;
                            return (
                                <button
                                    key={`${item.url}-${itemIndex}`}
                                    type="button"
                                    onClick={() => setIndex(itemIndex)}
                                    className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition md:h-[4.5rem] md:w-24 ${
                                        active
                                            ? "border-[#B7F041] shadow-[0_0_12px_rgba(183,240,65,0.35)]"
                                            : "border-white/15 opacity-75 hover:opacity-100"
                                    }`}
                                >
                                    {item.mediaType === "video" ? (
                                        <video
                                            src={item.url}
                                            className="h-full w-full object-cover"
                                            muted
                                            playsInline
                                            preload="metadata"
                                        />
                                    ) : (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.url} alt="" className="h-full w-full object-cover" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
