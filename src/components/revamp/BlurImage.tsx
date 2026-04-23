"use client";

import React, { useEffect, useMemo, useState } from "react";
import ShimmerBlock from "@/components/revamp/ShimmerBlock";

type ImageLoadState = "idle" | "loading" | "loaded" | "error";

interface BlurImageProps {
    src: string;
    alt: string;
    className?: string;
    wrapperClassName?: string;
    fallbackLabel?: string;
    loading?: "lazy" | "eager";
}

export default function BlurImage({
    src,
    alt,
    className = "",
    wrapperClassName = "",
    fallbackLabel = "Image unavailable",
    loading = "lazy",
}: BlurImageProps) {
    const [imageLoadState, setImageLoadState] = useState<ImageLoadState>("idle");

    const hasUsableSrc = useMemo(() => typeof src === "string" && src.trim().length > 0, [src]);

    useEffect(() => {
        if (!hasUsableSrc) {
            setImageLoadState("error");
            return;
        }
        setImageLoadState("loading");
    }, [hasUsableSrc, src]);

    if (!hasUsableSrc || imageLoadState === "error") {
        return (
            <div
                className={`flex h-full w-full items-center justify-center bg-[#17171f] text-xs text-white/55 ${wrapperClassName}`}
                role="img"
                aria-label={alt}
            >
                {fallbackLabel}
            </div>
        );
    }

    return (
        <div className={`relative h-full w-full overflow-hidden ${wrapperClassName}`}>
            {imageLoadState !== "loaded" ? <ShimmerBlock className="absolute inset-0" /> : null}
            <img
                src={src}
                alt={alt}
                loading={loading}
                onLoad={() => setImageLoadState("loaded")}
                onError={() => setImageLoadState("error")}
                className={`h-full w-full object-cover transition-all duration-500 ${
                    imageLoadState === "loaded" ? "opacity-100 blur-0 scale-100" : "spoto-image-blur"
                } ${className}`}
            />
        </div>
    );
}
