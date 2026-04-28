"use client";

export type FakePaymentOutcome = "success" | "failed";

export interface UnlockPaymentContext {
    propertyId: string;
    returnPath: string;
    passType: "one_day" | "weekly";
    amount: number;
}

export interface FakePaymentSession {
    sessionId: string;
    context: UnlockPaymentContext;
    attempts: number;
    lastOutcome?: FakePaymentOutcome;
}

const STORAGE_KEY = "spoto_fake_payment_sessions_v1";

const isBrowser = () => typeof window !== "undefined";

const readStore = (): Record<string, FakePaymentSession> => {
    if (!isBrowser()) return {};
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    try {
        return JSON.parse(raw) as Record<string, FakePaymentSession>;
    } catch {
        return {};
    }
};

const writeStore = (store: Record<string, FakePaymentSession>) => {
    if (!isBrowser()) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const nextOutcome = (attempts: number): FakePaymentOutcome => {
    if (attempts <= 1) return Math.random() > 0.35 ? "success" : "failed";
    return Math.random() > 0.2 ? "success" : "failed";
};

class FakePaymentAdapter {
    async initiate(context: UnlockPaymentContext): Promise<FakePaymentSession> {
        const sessionId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const session: FakePaymentSession = {
            sessionId,
            context,
            attempts: 1,
        };
        const store = readStore();
        store[sessionId] = session;
        writeStore(store);
        return session;
    }

    async resolve(sessionId: string, forcedOutcome?: FakePaymentOutcome): Promise<FakePaymentSession> {
        const store = readStore();
        const session = store[sessionId];
        if (!session) throw new Error("Payment session not found");

        await wait(1200);
        const outcome = forcedOutcome || nextOutcome(session.attempts);
        const updated: FakePaymentSession = {
            ...session,
            lastOutcome: outcome,
        };
        store[sessionId] = updated;
        writeStore(store);
        return updated;
    }

    async retry(sessionId: string, forcedOutcome?: FakePaymentOutcome): Promise<FakePaymentSession> {
        const store = readStore();
        const session = store[sessionId];
        if (!session) throw new Error("Payment session not found");
        const next = {
            ...session,
            attempts: session.attempts + 1,
        };
        store[sessionId] = next;
        writeStore(store);
        await wait(900);
        return this.resolve(sessionId, forcedOutcome);
    }
}

export const fakePaymentAdapter = new FakePaymentAdapter();
