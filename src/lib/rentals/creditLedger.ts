const CREDIT_STORAGE_KEY = "spoto_credit_ledger_v1";
const DEFAULT_TENANT_CREDITS = 3;
const DEFAULT_OWNER_CREDITS = 3;

type LedgerScope = "tenant" | "owner";

interface CreditLedgerState {
    tenant: number;
    owner: number;
    updatedAt: string;
}

const isBrowser = () => typeof window !== "undefined";

const defaultState = (): CreditLedgerState => ({
    tenant: DEFAULT_TENANT_CREDITS,
    owner: DEFAULT_OWNER_CREDITS,
    updatedAt: new Date().toISOString(),
});

const readState = (): CreditLedgerState => {
    if (!isBrowser()) return defaultState();
    const raw = window.localStorage.getItem(CREDIT_STORAGE_KEY);
    if (!raw) return defaultState();

    try {
        const parsed = JSON.parse(raw) as Partial<CreditLedgerState>;
        return {
            tenant: typeof parsed.tenant === "number" ? parsed.tenant : DEFAULT_TENANT_CREDITS,
            owner: typeof parsed.owner === "number" ? parsed.owner : DEFAULT_OWNER_CREDITS,
            updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
        };
    } catch {
        return defaultState();
    }
};

const writeState = (value: CreditLedgerState) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify(value));
};

export const getCredits = (scope: LedgerScope): number => readState()[scope];

export const setCredits = (scope: LedgerScope, value: number) => {
    const current = readState();
    current[scope] = Math.max(0, Math.floor(value));
    current.updatedAt = new Date().toISOString();
    writeState(current);
};

export const consumeCredit = (scope: LedgerScope): { success: boolean; remaining: number } => {
    const current = readState();
    const available = current[scope];
    if (available <= 0) {
        return { success: false, remaining: 0 };
    }

    current[scope] = available - 1;
    current.updatedAt = new Date().toISOString();
    writeState(current);

    return { success: true, remaining: current[scope] };
};

