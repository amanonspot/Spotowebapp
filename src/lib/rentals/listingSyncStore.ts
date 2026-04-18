import { PropertyDetail, PropertyListItem } from "@/lib/adapters/types";

const STORAGE_KEY = "spoto_synced_rental_listings_v1";

export interface SyncedListingRecord {
    id: string;
    listItem: PropertyListItem;
    detail?: PropertyDetail;
    updatedAt: string;
    source: "owner_create" | "owner_update" | "api";
}

type SyncStore = Record<string, SyncedListingRecord>;

let memoryStore: SyncStore = {};

const isBrowser = () => typeof window !== "undefined";

const readLocal = (): SyncStore => {
    if (!isBrowser()) return memoryStore;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
        return JSON.parse(raw) as SyncStore;
    } catch {
        return {};
    }
};

const writeLocal = (value: SyncStore) => {
    memoryStore = value;
    if (!isBrowser()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export const readSyncedListingStore = (): SyncStore => readLocal();

export const upsertSyncedListingRecord = (record: SyncedListingRecord) => {
    const current = readLocal();
    current[record.id] = record;
    writeLocal(current);
};

export const mergeListWithSynced = (list: PropertyListItem[]): PropertyListItem[] => {
    const sync = readLocal();
    const seen = new Set<string>();
    const merged = list.map((item) => {
        seen.add(item.id);
        return sync[item.id]?.listItem ?? item;
    });

    Object.values(sync).forEach((record) => {
        if (!seen.has(record.id)) {
            merged.push(record.listItem);
        }
    });

    return merged;
};

export const getSyncedDetail = (id: string): PropertyDetail | null => {
    const sync = readLocal();
    return sync[id]?.detail ?? null;
};

