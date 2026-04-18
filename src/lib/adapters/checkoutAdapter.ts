import { CheckoutAdapter, CheckoutState, StartUnlockPayload } from "@/lib/adapters/types";
import { authAdapter } from "@/lib/adapters/authAdapter";
import { mockPropertyDetails } from "@/mocks/properties";
import { addUnlockedTenantContact, consumeCredit, getCredits, rentalsService } from "@/lib/rentals";

const CHECKOUT_KEY = "spoto_checkout_records_v2";

type CheckoutStore = Record<string, CheckoutState>;

const isBrowser = () => typeof window !== "undefined";

const readStore = (): CheckoutStore => {
    if (!isBrowser()) return {};
    const raw = window.localStorage.getItem(CHECKOUT_KEY);
    if (!raw) return {};
    try {
        return JSON.parse(raw) as CheckoutStore;
    } catch {
        return {};
    }
};

const writeStore = (value: CheckoutStore) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(CHECKOUT_KEY, JSON.stringify(value));
};

const createState = (payload: StartUnlockPayload): CheckoutState => ({
    id: `unlock_${Date.now()}`,
    propertyId: payload.propertyId,
    amount: payload.amount,
    status: "pending",
    message: "Checking unlock eligibility...",
    updatedAt: new Date().toISOString(),
    creditsRemaining: getCredits("tenant"),
});

const saveState = (state: CheckoutState) => {
    const store = readStore();
    store[state.id] = state;
    writeStore(store);
};

const getFallbackContact = (propertyId: string) => {
    const detail = mockPropertyDetails.find((item) => item.id === propertyId);
    if (!detail) return null;
    return {
        name: detail.owner.ownerName,
        phone: detail.owner.whatsappNumber,
    };
};

class HybridCheckoutAdapter implements CheckoutAdapter {
    async startUnlock(payload: StartUnlockPayload): Promise<CheckoutState> {
        const state = createState(payload);
        saveState(state);
        return state;
    }

    async confirmUnlock(id: string, outcome: "success" | "failed" = "success"): Promise<CheckoutState> {
        const store = readStore();
        const current = store[id];
        if (!current) throw new Error("Checkout session not found");

        if (outcome === "failed") {
            const failed: CheckoutState = {
                ...current,
                status: "failed",
                message: "Payment failed. Please try again.",
                updatedAt: new Date().toISOString(),
            };
            saveState(failed);
            return failed;
        }

        const session = authAdapter.getSession();
        const payload = {
            name: session.userName || "Spoto User",
            phone: session.phone || "",
            message: "Interested in this rental property",
        };

        try {
            const response = await rentalsService.unlockPropertyContact(current.propertyId, payload);
            const unlockedPhone =
                (response.phone as string) ||
                (response.owner_phone as string) ||
                ((response.contact as Record<string, unknown> | undefined)?.phone as string) ||
                "";
            const unlockedName =
                (response.owner_name as string) ||
                ((response.contact as Record<string, unknown> | undefined)?.name as string) ||
                "Owner";

            const success: CheckoutState = {
                ...current,
                status: "success",
                message: response.message || "Owner contact unlocked.",
                unlockedPhone: unlockedPhone || undefined,
                unlockedName,
                creditsRemaining: getCredits("tenant"),
                updatedAt: new Date().toISOString(),
            };

            if (success.unlockedPhone) {
                addUnlockedTenantContact({
                    id: `tenant_unlock_${Date.now()}`,
                    propertyId: current.propertyId,
                    name: unlockedName,
                    phone: success.unlockedPhone,
                    source: "api",
                    unlockedAt: success.updatedAt,
                });
            }

            saveState(success);
            return success;
        } catch {
            const credit = consumeCredit("tenant");
            const fallback = getFallbackContact(current.propertyId);

            if (!credit.success || !fallback) {
                const blocked: CheckoutState = {
                    ...current,
                    status: "failed",
                    message: "No free credits left. Activate pass to continue.",
                    creditsRemaining: 0,
                    updatedAt: new Date().toISOString(),
                };
                saveState(blocked);
                return blocked;
            }

            const success: CheckoutState = {
                ...current,
                status: "success",
                message: "Unlocked using free credit.",
                unlockedPhone: fallback.phone,
                unlockedName: fallback.name,
                creditsRemaining: credit.remaining,
                updatedAt: new Date().toISOString(),
            };

            addUnlockedTenantContact({
                id: `tenant_unlock_${Date.now()}`,
                propertyId: current.propertyId,
                name: fallback.name,
                phone: fallback.phone,
                source: "mock",
                unlockedAt: success.updatedAt,
            });

            saveState(success);
            return success;
        }
    }

    async getUnlockStatus(id: string): Promise<CheckoutState | null> {
        const store = readStore();
        return store[id] || null;
    }
}

export const checkoutAdapter = new HybridCheckoutAdapter();

