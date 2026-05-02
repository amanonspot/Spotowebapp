import { MetadataRoute } from 'next';
import { getApiBaseUrl, getPublicSiteUrl } from "@/lib/runtime/publicEnv";

export const revalidate = 3600;

const readPositiveIntEnv = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(`${value || ''}`, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
    value !== null && typeof value === 'object' ? (value as UnknownRecord) : null;

const unwrapListPayload = (payload: unknown): UnknownRecord[] => {
    if (Array.isArray(payload)) return payload as UnknownRecord[];
    const envelope = asRecord(payload);
    if (!envelope) return [];

    if (envelope.success === false) return [];

    if (Array.isArray(envelope.data)) return envelope.data as UnknownRecord[];
    if (Array.isArray(envelope.results)) return envelope.results as UnknownRecord[];
    if (Array.isArray(envelope.items)) return envelope.items as UnknownRecord[];

    if (envelope.data && typeof envelope.data === 'object' && !Array.isArray(envelope.data)) {
        return [envelope.data as UnknownRecord];
    }

    return [];
};

const firstString = (...values: unknown[]) => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
};

const readPropertyId = (wire: UnknownRecord) => {
    const id = firstString(wire.id, wire.property_id, wire.uuid);
    return id;
};

const isLikelyPublicListing = (wire: UnknownRecord) => {
    if (wire.is_publicly_visible === false) return false;
    if (wire.is_active === false) return false;
    return true;
};

const readLastModified = (wire: UnknownRecord, fallback: Date) => {
    const raw = firstString(wire.updated_at, wire.last_status_at, wire.created_at);
    if (!raw) return fallback;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

const fetchJson = async (url: string, init: RequestInit) => {
    const controller = new AbortController();
    const timeoutMs = readPositiveIntEnv(process.env.SITEMAP_FETCH_TIMEOUT_MS, 20000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            ...init,
            signal: controller.signal,
            next: { revalidate },
        });
    } finally {
        clearTimeout(timeout);
    }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getPublicSiteUrl();
    const apiBaseUrl = getApiBaseUrl();
    const now = new Date();

    const staticEntries: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/contacts`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/my-bookings`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.55,
        },
        {
            url: `${baseUrl}/wishlist`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.55,
        },
        {
            url: `${baseUrl}/owner`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.55,
        },
        {
            url: `${baseUrl}/owner/dashboard`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.55,
        },
        {
            url: `${baseUrl}/owner/list-property`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.55,
        },
        {
            url: `${baseUrl}/owner/list-property/pending`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.45,
        },
        {
            url: `${baseUrl}/owner/contacts`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.45,
        },
        {
            url: `${baseUrl}/terms-of-service`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.35,
        },
        {
            url: `${baseUrl}/privacy-policy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.35,
        },
        {
            url: `${baseUrl}/refund-policy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.35,
        },
        {
            url: `${baseUrl}/cancellation-policy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.35,
        },
        {
            url: `${baseUrl}/delete-account`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    let propertyWires: UnknownRecord[] = [];
    try {
        const listUrl = new URL('/api/rental/properties/', apiBaseUrl).toString();
        const response = await fetchJson(listUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
        if (response.ok) {
            const payload: unknown = await response.json();
            propertyWires = unwrapListPayload(payload);
        }
    } catch {
        propertyWires = [];
    }

    const bookingEntries: MetadataRoute.Sitemap = [];
    const seen = new Set<string>();
    const maxUrls = readPositiveIntEnv(process.env.SITEMAP_MAX_PROPERTY_URLS, 5000);

    for (const wire of propertyWires) {
        if (!isLikelyPublicListing(wire)) continue;
        const id = readPropertyId(wire);
        if (!id || seen.has(id)) continue;
        seen.add(id);

        bookingEntries.push({
            url: `${baseUrl}/booking/${encodeURIComponent(id)}`,
            lastModified: readLastModified(wire, now),
            changeFrequency: 'daily',
            priority: 0.75,
        });

        if (bookingEntries.length >= maxUrls) break;
    }

    return [...staticEntries, ...bookingEntries];
}

