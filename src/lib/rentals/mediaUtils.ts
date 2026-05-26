export type PropertyMediaType = "image" | "video";

export interface PropertyMediaItem {
    url: string;
    mediaType: PropertyMediaType;
    isPrimary?: boolean;
    sortOrder?: number;
}

export function isVideoMediaUrl(url: string): boolean {
    const value = (url || "").trim().toLowerCase();
    if (!value) return false;
    return (
        value.includes("/rental_property_videos/") ||
        /\.(mp4|webm|mov|m4v|avi)(\?|#|$)/i.test(value)
    );
}

export function isVideoFile(file: File): boolean {
    return (file.type || "").startsWith("video/");
}

export function mediaUrl(item: PropertyMediaItem): string {
    return item.url;
}
