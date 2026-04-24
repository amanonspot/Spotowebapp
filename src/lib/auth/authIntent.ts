"use client";

export type AuthIntentType = "owner_list_property" | "unlock_contact" | "buy_pass" | "search";

export interface AuthIntentPayload {
    type: AuthIntentType;
    createdAt: number;
    propertyId?: string;
    passType?: "one_day" | "weekly";
    nextPath?: string;
}

const AUTH_INTENT_KEY = "spoto_auth_intent_v1";
const AUTH_INTENT_TTL_MS = 15 * 60 * 1000;

const isBrowser = () => typeof window !== "undefined";

const asRecord = (value: unknown): Record<string, unknown> | null =>
    value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;

const sanitizeIntent = (value: unknown): AuthIntentPayload | null => {
    const record = asRecord(value);
    if (!record) return null;

    const type = `${record.type || ""}` as AuthIntentType;
    if (!["owner_list_property", "unlock_contact", "buy_pass", "search"].includes(type)) return null;

    const createdAt = Number(record.createdAt || 0);
    if (!Number.isFinite(createdAt) || createdAt <= 0) return null;

    const intent: AuthIntentPayload = {
        type,
        createdAt,
    };

    if (typeof record.propertyId === "string" && record.propertyId.trim()) {
        intent.propertyId = record.propertyId.trim();
    }
    if (record.passType === "one_day" || record.passType === "weekly") {
        intent.passType = record.passType;
    }
    if (typeof record.nextPath === "string" && record.nextPath.trim()) {
        intent.nextPath = record.nextPath.trim();
    }

    return intent;
};

export const setAuthIntent = (payload: Omit<AuthIntentPayload, "createdAt">) => {
    if (!isBrowser()) return;
    const intent: AuthIntentPayload = {
        ...payload,
        createdAt: Date.now(),
    };
    window.sessionStorage.setItem(AUTH_INTENT_KEY, JSON.stringify(intent));
};

export const getAuthIntent = (): AuthIntentPayload | null => {
    if (!isBrowser()) return null;
    const raw = window.sessionStorage.getItem(AUTH_INTENT_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        const intent = sanitizeIntent(parsed);
        if (!intent) {
            window.sessionStorage.removeItem(AUTH_INTENT_KEY);
            return null;
        }
        if (Date.now() - intent.createdAt > AUTH_INTENT_TTL_MS) {
            window.sessionStorage.removeItem(AUTH_INTENT_KEY);
            return null;
        }
        return intent;
    } catch {
        window.sessionStorage.removeItem(AUTH_INTENT_KEY);
        return null;
    }
};

export const clearAuthIntent = () => {
    if (!isBrowser()) return;
    window.sessionStorage.removeItem(AUTH_INTENT_KEY);
};

export const consumeAuthIntent = (): AuthIntentPayload | null => {
    const intent = getAuthIntent();
    clearAuthIntent();
    return intent;
};

export const toIntentDestination = (intent: AuthIntentPayload | null): string | null => {
    if (!intent) return null;
    if (intent.nextPath) return intent.nextPath;

    if (intent.type === "owner_list_property") return "/owner/list-property";

    if (intent.type === "unlock_contact" && intent.propertyId) {
        return `/booking/${intent.propertyId}?resume=unlock`;
    }

    if (intent.type === "buy_pass" && intent.propertyId) {
        const passType = intent.passType === "one_day" || intent.passType === "weekly" ? intent.passType : "weekly";
        return `/booking/${intent.propertyId}?resume=buy_pass&passType=${passType}`;
    }

    if (intent.type === "search") return "/search";

    return null;
};

export const consumeAuthIntentDestination = (): string | null => toIntentDestination(consumeAuthIntent());
