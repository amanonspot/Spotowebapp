const TENANT_UNLOCKS_KEY = "spoto_tenant_unlocked_contacts_v1";
const OWNER_UNLOCKS_KEY = "spoto_owner_unlocked_contacts_v1";

export interface UnlockedContactRecord {
    id: string;
    role: "tenant" | "owner";
    propertyId: string;
    name: string;
    phone: string;
    message?: string;
    source: "api" | "mock";
    unlockedAt: string;
}

const isBrowser = () => typeof window !== "undefined";

const read = (key: string): UnlockedContactRecord[] => {
    if (!isBrowser()) return [];
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as UnlockedContactRecord[];
    } catch {
        return [];
    }
};

const write = (key: string, records: UnlockedContactRecord[]) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(key, JSON.stringify(records));
};

export const getUnlockedTenantContacts = () => read(TENANT_UNLOCKS_KEY);
export const getUnlockedOwnerContacts = () => read(OWNER_UNLOCKS_KEY);

export const addUnlockedTenantContact = (record: Omit<UnlockedContactRecord, "role">) => {
    const current = read(TENANT_UNLOCKS_KEY);
    const next = [
        record as UnlockedContactRecord,
        ...current.filter((item) => item.propertyId !== record.propertyId),
    ];
    write(TENANT_UNLOCKS_KEY, next.map((item) => ({ ...item, role: "tenant" })));
};

export const addUnlockedOwnerContact = (record: Omit<UnlockedContactRecord, "role">) => {
    const current = read(OWNER_UNLOCKS_KEY);
    const next = [
        record as UnlockedContactRecord,
        ...current.filter((item) => item.propertyId !== record.propertyId),
    ];
    write(OWNER_UNLOCKS_KEY, next.map((item) => ({ ...item, role: "owner" })));
};

