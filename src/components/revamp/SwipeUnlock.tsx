"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface SwipeUnlockProps {
    label: string;
    disabled?: boolean;
    loading?: boolean;
    threshold?: number;
    onComplete: () => void | Promise<void>;
    className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function SwipeUnlock({
    label,
    disabled = false,
    loading = false,
    threshold = 0.78,
    onComplete,
    className,
}: SwipeUnlockProps) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [trackWidth, setTrackWidth] = useState(0);
    const [offset, setOffset] = useState(0);
    const [startX, setStartX] = useState(0);

    const thumbSize = 40;
    const maxOffset = Math.max(0, trackWidth - thumbSize - 6);
    const progress = maxOffset === 0 ? 0 : offset / maxOffset;

    useEffect(() => {
        const node = trackRef.current;
        if (!node) return;
        const update = () => setTrackWidth(node.getBoundingClientRect().width);
        update();

        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(node);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (disabled || loading) {
            setOffset(0);
        }
    }, [disabled, loading]);

    const reset = () => {
        setDragging(false);
        setOffset(0);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || loading) return;
        const target = event.currentTarget;
        target.setPointerCapture(event.pointerId);
        setDragging(true);
        setStartX(event.clientX - offset);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging || disabled || loading) return;
        const nextOffset = clamp(event.clientX - startX, 0, maxOffset);
        setOffset(nextOffset);
    };

    const complete = async () => {
        try {
            await onComplete();
        } finally {
            reset();
        }
    };

    const handlePointerUp = async () => {
        if (!dragging || disabled || loading) return;
        setDragging(false);
        if (progress >= threshold) {
            await complete();
            return;
        }
        setOffset(0);
    };

    const fillWidth = useMemo(() => {
        if (maxOffset <= 0) return "0%";
        const width = ((offset + thumbSize) / trackWidth) * 100;
        return `${clamp(width, 0, 100)}%`;
    }, [maxOffset, offset, thumbSize, trackWidth]);

    const isInteractive = !disabled && !loading;

    return (
        <div
            ref={trackRef}
            className={`relative h-12 w-full overflow-hidden rounded-full bg-[#A67AEB] text-xl font-semibold text-white ${
                disabled ? "opacity-60" : ""
            } ${className || ""}`}
        >
            <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#7b4fd0] transition-[width] duration-150"
                style={{ width: fillWidth }}
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-12 text-center leading-none text-white/95">
                {loading ? "Unlocking..." : label}
            </span>

            <div
                role="button"
                aria-label={label}
                tabIndex={isInteractive ? 0 : -1}
                className={`absolute left-[3px] top-[3px] inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#07070a] text-sm text-white transition-transform ${
                    dragging ? "scale-105" : ""
                } ${isInteractive ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"}`}
                style={{ transform: `translateX(${offset}px)`, transitionDuration: dragging ? "0ms" : "180ms" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={reset}
                onPointerLeave={() => {
                    if (!dragging) return;
                    setDragging(false);
                    setOffset(0);
                }}
                onKeyDown={(event) => {
                    if (!isInteractive) return;
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    void complete();
                }}
            >
                ●
            </div>
        </div>
    );
}
