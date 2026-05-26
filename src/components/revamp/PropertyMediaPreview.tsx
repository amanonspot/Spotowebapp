"use client";

import React from "react";
import BlurImage from "@/components/revamp/BlurImage";
import { PropertyMediaItem } from "@/lib/rentals/mediaUtils";
import { isVideoMediaUrl } from "@/lib/rentals/mediaUtils";

interface PropertyMediaPreviewProps {
    item: PropertyMediaItem | string;
    alt: string;
    className?: string;
    wrapperClassName?: string;
    controls?: boolean;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
}

export default function PropertyMediaPreview({
    item,
    alt,
    className = "",
    wrapperClassName = "",
    controls = true,
    autoPlay = false,
    muted = false,
    loop = false,
}: PropertyMediaPreviewProps) {
    const media: PropertyMediaItem =
        typeof item === "string" ? { url: item, mediaType: isVideoMediaUrl(item) ? "video" : "image" } : item;

    if (media.mediaType === "video" || isVideoMediaUrl(media.url)) {
        return (
            <video
                src={media.url}
                className={className}
                controls={controls}
                autoPlay={autoPlay}
                muted={muted}
                loop={loop}
                playsInline
                preload="metadata"
            />
        );
    }

    return (
        <BlurImage
            src={media.url}
            alt={alt}
            wrapperClassName={wrapperClassName}
            className={className}
        />
    );
}
