import { rentalsService } from "@/lib/rentals/service";
import type { WireApiEnvelope } from "@/lib/rentals/wireTypes";

const STORAGE_KEY = "spoto_masters_v1";
/** Master data changes rarely — cache 24h in localStorage to avoid repeat API calls. */
const TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry = { data: unknown; timestamp: number };
type CacheStore = Record<string, CacheEntry>;

const readStore = (): CacheStore => {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as CacheStore) : {};
    } catch {
        return {};
    }
};

const writeStore = (store: CacheStore) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
        // Quota exceeded — drop cache rather than break the app.
        localStorage.removeItem(STORAGE_KEY);
    }
};

/** GET master endpoint with in-memory + localStorage cache. */
export async function cachedMasterGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const store = readStore();
    const entry = store[key];
    const now = Date.now();

    if (entry && now - entry.timestamp < TTL_MS) {
        return entry.data as T;
    }

    const data = await fetcher();
    store[key] = { data, timestamp: now };
    writeStore(store);
    return data;
};

export const clearMastersCache = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
    }
};

/** Warm master caches in the background (e.g. after home page loads). */
export async function warmMastersCache(): Promise<void> {
    await Promise.allSettled([
        cachedMasterGet("cities", () => rentalsService.listCities()),
        cachedMasterGet("amenities", () => rentalsService.listAmenities()),
        cachedMasterGet("property-types", () => rentalsService.listPropertyTypes()),
        cachedMasterGet("bhk-types", () => rentalsService.listBhkTypes()),
        cachedMasterGet("furnishing-types", () => rentalsService.listFurnishingTypes()),
        cachedMasterGet("availability-types", () => rentalsService.listAvailabilityTypes()),
    ]);
};

export type MastersBundle = [
    PromiseSettledResult<WireApiEnvelope<unknown>>,
    PromiseSettledResult<WireApiEnvelope<unknown>>,
    PromiseSettledResult<WireApiEnvelope<unknown>>,
    PromiseSettledResult<WireApiEnvelope<unknown>>,
    PromiseSettledResult<WireApiEnvelope<unknown>>,
    PromiseSettledResult<WireApiEnvelope<unknown>>,
];

/** Fetch all master endpoints using cachedMasterGet (parallel, deduped). */
export const fetchMastersBundleCached = (): Promise<MastersBundle> =>
    Promise.allSettled([
        cachedMasterGet("cities", () => rentalsService.listCities()),
        cachedMasterGet("amenities", () => rentalsService.listAmenities()),
        cachedMasterGet("property-types", () => rentalsService.listPropertyTypes()),
        cachedMasterGet("bhk-types", () => rentalsService.listBhkTypes()),
        cachedMasterGet("furnishing-types", () => rentalsService.listFurnishingTypes()),
        cachedMasterGet("availability-types", () => rentalsService.listAvailabilityTypes()),
    ]) as Promise<MastersBundle>;
