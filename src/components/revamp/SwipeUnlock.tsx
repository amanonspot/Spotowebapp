"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface SwipeUnlockProps {
    label: string;
    disabled?: boolean;
    loading?: boolean;
    completionThreshold?: number;
    flickVelocityThreshold?: number;
    onComplete: () => void | Promise<void>;
    className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function SwipeUnlock({
    label,
    disabled = false,
    loading = false,
    completionThreshold = 0.62,
    flickVelocityThreshold = 0.9,
    onComplete,
    className,
}: SwipeUnlockProps) {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [trackWidth, setTrackWidth] = useState(0);
    const [offset, setOffset] = useState(0);
    const [startX, setStartX] = useState(0);
    const [startOffset, setStartOffset] = useState(0);
    const [completing, setCompleting] = useState(false);
    const activePointerId = useRef<number | null>(null);
    const dragMeta = useRef({ lastX: 0, lastTs: 0, velocity: 0 });

    const thumbSize = 42;
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
        if (disabled || loading || completing) {
            setOffset(0);
        }
    }, [disabled, loading, completing]);

    const reset = () => {
        setDragging(false);
        setOffset(0);
        setStartOffset(0);
        setStartX(0);
        activePointerId.current = null;
        dragMeta.current = { lastX: 0, lastTs: 0, velocity: 0 };
    };

    const getEventClientX = (
        event: React.PointerEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
    ): number => {
        if ("touches" in event) {
            const touch = event.touches[0] || event.changedTouches[0];
            return touch ? touch.clientX : 0;
        }
        return event.clientX;
    };

    const beginDrag = (clientX: number) => {
        if (disabled || loading || completing) return;
        setDragging(true);
        setStartX(clientX);
        setStartOffset(offset);
        dragMeta.current = { lastX: clientX, lastTs: performance.now(), velocity: 0 };
    };

    const continueDrag = (clientX: number) => {
        if (!dragging || disabled || loading || completing) return;
        const now = performance.now();
        const dt = Math.max(1, now - dragMeta.current.lastTs);
        const dx = clientX - dragMeta.current.lastX;
        dragMeta.current.velocity = dx / dt;
        dragMeta.current.lastX = clientX;
        dragMeta.current.lastTs = now;
        const delta = clientX - startX;
        const nextOffset = clamp(startOffset + delta, 0, maxOffset);
        setOffset(nextOffset);
    };

    const complete = async () => {
        if (completing) return;
        setCompleting(true);
        try {
            await onComplete();
        } finally {
            setCompleting(false);
            reset();
        }
    };

    const finishDrag = async () => {
        if (!dragging || disabled || loading || completing) return;
        setDragging(false);
        const progressReached = progress >= completionThreshold;
        const flickReached = progress >= 0.32 && dragMeta.current.velocity >= flickVelocityThreshold;
        if (progressReached || flickReached) {
            await complete();
            return;
        }
        setOffset(0);
        dragMeta.current = { lastX: 0, lastTs: 0, velocity: 0 };
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (disabled || loading || completing) return;
        event.preventDefault();
        activePointerId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        beginDrag(getEventClientX(event));
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (activePointerId.current !== event.pointerId) return;
        event.preventDefault();
        continueDrag(getEventClientX(event));
    };

    const handlePointerUp = async (event: React.PointerEvent<HTMLDivElement>) => {
        if (activePointerId.current !== event.pointerId) return;
        await finishDrag();
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
            className={`relative h-12 w-full select-none overflow-hidden rounded-full bg-[#A67AEB] text-base font-semibold text-white sm:text-lg ${
                disabled ? "opacity-60" : "animate-pulse-glow"
            } ${className || ""}`}
            style={{ touchAction: dragging ? "none" : "pan-y" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={reset}
        >
            {/* Fill track */}
            <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#7b4fd0] transition-[width] duration-150"
                style={{ width: fillWidth }}
            />

            {/* Label */}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-14 text-center text-sm leading-none text-white/90 sm:text-base">
                {loading || completing ? (
                    <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Unlocking...
                    </span>
                ) : label}
            </span>

            {/* Thumb */}
            <div
                role="button"
                aria-label={label}
                tabIndex={isInteractive ? 0 : -1}
                className={`absolute left-[3px] top-[3px] inline-flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#07070a] text-base text-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] ${
                    dragging ? "scale-110" : "scale-100"
                } ${isInteractive ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"}`}
                style={{ transform: `translateX(${offset}px)`, transitionDuration: dragging ? "0ms" : "180ms", transition: dragging ? "none" : "transform 180ms ease" }}
                onKeyDown={(event) => {
                    if (!isInteractive) return;
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    void complete();
                }}
            >
                →
            </div>
        </div>
    );
}
