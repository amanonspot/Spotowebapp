"use client";

import React from "react";

interface ShimmerBlockProps {
    className?: string;
}

export default function ShimmerBlock({ className = "" }: ShimmerBlockProps) {
    return <div className={`spoto-shimmer ${className}`} aria-hidden="true" />;
}
