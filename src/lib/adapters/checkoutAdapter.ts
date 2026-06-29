import { ApiError } from "@/lib/api/client";
import { CheckoutAdapter, CheckoutState, StartUnlockPayload } from "@/lib/adapters/types";
import { authAdapter } from "@/lib/adapters/authAdapter";
import { mockPropertyDetails } from "@/mocks/properties";
import { addUnlockedTenantContact, consumeCredit, extractErrorMessage, getCredits, RENTALS_MOCK_MODE, rentalsService } from "@/lib/rentals";
import { RentalContactUnlockResponseDto, RentalPassActivateResponseDto, UnknownRecord } from "@/lib/rentals/wireTypes";

const CHECKOUT_KEY = "spoto_checkout_records_v2";

type CheckoutStore = Record<string, CheckoutState>;

const asRecord = (value: unknown): UnknownRecord | null =>
    value !== null && typeof value === "object" ? (value as UnknownRecord) : null;

const firstString = (...values: unknown[]): string => {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
    return "";
};

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

const toPaywallFromPayload = (payload: unknown): CheckoutState["paywall"] | undefined => {
    const record = asRecord(payload);
    if (!record) return undefined;
    const paywall = asRecord(record.data);
    if (!paywall) return undefined;
    const oneDay = asRecord(paywall.one_day);
    if (!oneDay) return undefined;
    return {
        oneDay: {
            passType: "one_day",
            price: Number(oneDay.price || 99),
            currency: firstString(oneDay.currency, "INR"),
            durationDays: Number(oneDay.duration_days || 1),
        },
    };
};

const parseUnlockSuccess = (response: RentalContactUnlockResponseDto) => {
    const record = asRecord(response);
    if (!record) return null;

    const success = record.success;
    if (success === false) {
        return {
            type: "paywall" as const,
            message: firstString(record.error, record.message, "Free contacts exhausted. Choose a pass."),
            paywall: toPaywallFromPayload(record),
        };
    }

    const data = asRecord(record.data);
    const owner = asRecord(data?.owner);
    const phone = firstString(owner?.phone);
    if (!phone) return null;
    const documents = Array.isArray(data?.documents)
        ? data.documents
              .map((doc) => {
                  const record = asRecord(doc);
                  if (!record) return null;
                  const url = firstString(record.document_file_url);
                  if (!url) return null;
                  return {
                      id: firstString(record.id) || undefined,
                      documentType: firstString(record.document_type, "document"),
                      documentUrl: url,
                      uploadedAt: firstString(record.uploaded_at) || undefined,
                  };
              })
              .filter((item): item is NonNullable<typeof item> => Boolean(item))
        : [];

    return {
        type: "success" as const,
        message: firstString(record.message, "Contact unlocked"),
        ownerName: firstString(owner?.name, "Owner"),
        ownerPhone: phone,
        documents,
    };
};

class HybridCheckoutAdapter implements CheckoutAdapter {
    async verifyAndUnlock(params: {
        razorpayPaymentId: string;
        razorpayOrderId: string;
        razorpaySignature: string;
        propertyId: string;
        name?: string;
        phone?: string;
    }): Promise<CheckoutState> {
        const session = authAdapter.getSession();
        const store = readStore();
        // Find the checkout session for this property
        const current = Object.values(store).find(s => s.propertyId === params.propertyId)
            ?? {
                id: `unlock_${Date.now()}`,
                propertyId: params.propertyId,
                amount: 99,
                status: 'pending' as const,
                message: 'Verifying payment...',
                updatedAt: new Date().toISOString(),
            };

        try {
            const response = await rentalsService.confirmPaymentAndUnlock({
                razorpay_payment_id: params.razorpayPaymentId,
                razorpay_order_id: params.razorpayOrderId,
                razorpay_signature: params.razorpaySignature,
                property_id: params.propertyId,
                name: params.name ?? session.userName ?? undefined,
                phone: params.phone ?? session.phone ?? undefined,
            });

            const parsed = parseUnlockSuccess(response);
            if (!parsed || parsed.type === 'paywall') {
                const failed: CheckoutState = {
                    ...current,
                    status: 'failed',
                    message: 'Payment verified but contact unlock failed. Please contact support.',
                    updatedAt: new Date().toISOString(),
                };
                saveState(failed);
                return failed;
            }

            const success: CheckoutState = {
                ...current,
                status: 'success',
                message: parsed.message,
                unlockedPhone: parsed.ownerPhone,
                unlockedName: parsed.ownerName,
                unlockedDocuments: parsed.documents,
                updatedAt: new Date().toISOString(),
            };

            addUnlockedTenantContact({
                id: `tenant_unlock_${Date.now()}`,
                propertyId: params.propertyId,
                name: parsed.ownerName,
                phone: parsed.ownerPhone,
                source: 'api',
                unlockedAt: success.updatedAt,
            });

            saveState(success);
            return success;
        } catch (error) {
            const failed: CheckoutState = {
                ...current,
                status: 'failed',
                message: extractErrorMessage(error, 'Payment verification failed.'),
                updatedAt: new Date().toISOString(),
            };
            saveState(failed);
            return failed;
        }
    }

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
            const parsed = parseUnlockSuccess(response);
            if (!parsed) {
                throw new Error("Unable to unlock owner contact.");
            }

            if (parsed.type === "paywall") {
                const paywallState: CheckoutState = {
                    ...current,
                    status: "paywall",
                    message: parsed.message,
                    paywall: parsed.paywall,
                    creditsRemaining: undefined,
                    updatedAt: new Date().toISOString(),
                };
                saveState(paywallState);
                return paywallState;
            }

            const success: CheckoutState = {
                ...current,
                status: "success",
                message: parsed.message,
                unlockedPhone: parsed.ownerPhone,
                unlockedName: parsed.ownerName,
                unlockedDocuments: parsed.documents,
                creditsRemaining: undefined,
                updatedAt: new Date().toISOString(),
            };

            addUnlockedTenantContact({
                id: `tenant_unlock_${Date.now()}`,
                propertyId: current.propertyId,
                name: parsed.ownerName,
                phone: parsed.ownerPhone,
                source: "api",
                unlockedAt: success.updatedAt,
            });

            saveState(success);
            return success;
        } catch (error) {
            const apiError = error as ApiError;
            const paywall = apiError.status === 402 ? toPaywallFromPayload(apiError.data) : undefined;
            if (!RENTALS_MOCK_MODE) {
                const failed: CheckoutState = {
                    ...current,
                    status: paywall ? "paywall" : "failed",
                    message: paywall
                        ? firstString(asRecord(apiError.data)?.error, asRecord(apiError.data)?.message, "Free contacts exhausted. Choose a pass.")
                        : extractErrorMessage(error, "Unable to unlock owner contact."),
                    paywall,
                    updatedAt: new Date().toISOString(),
                };
                saveState(failed);
                return failed;
            }

            const credit = consumeCredit("tenant");
            const fallback = getFallbackContact(current.propertyId);
            if (!credit.success || !fallback) {
                const blocked: CheckoutState = {
                    ...current,
                    status: "paywall",
                    message: "No free credits left. Choose a pass.",
                    paywall: {
                        oneDay: { passType: "one_day", price: 99, currency: "INR", durationDays: 1 },
                    },
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

    async activatePass(id: string): Promise<CheckoutState> {
        const store = readStore();
        const current = store[id];
        if (!current) throw new Error("Checkout session not found");

        try {
            const propertyId =
                current.propertyId && current.propertyId !== "global_pass" ? current.propertyId : undefined;
            const response = (await rentalsService.activatePass({
                pass_type: "one_day",
                property_id: propertyId,
            })) as RentalPassActivateResponseDto;

            const envelope = asRecord(response);
            const data = asRecord(envelope?.data);
            const payment = {
                paymentId: firstString(data?.payment_id),
                razorpayOrderId: firstString(data?.razorpay_order_id),
                razorpayKeyId: firstString(data?.razorpay_key_id),
                // Backend returns amount in rupees; Razorpay checkout expects paise
                amount: Number(data?.amount || 0) * 100,
                currency: firstString(data?.currency, "INR"),
                passType: "one_day" as const,
            };

            if (!payment.razorpayOrderId || !payment.razorpayKeyId) {
                throw new Error("Payment initiation failed. Missing Razorpay order details.");
            }

            const updated: CheckoutState = {
                ...current,
                status: "pending",
                message: firstString(envelope?.message, "Pass payment initiated."),
                payment,
                updatedAt: new Date().toISOString(),
            };
            saveState(updated);
            return updated;
        } catch (error) {
            const failed: CheckoutState = {
                ...current,
                status: "failed",
                message: extractErrorMessage(error, "Unable to initiate pass payment."),
                updatedAt: new Date().toISOString(),
            };
            saveState(failed);
            return failed;
        }
    }

    async getUnlockStatus(id: string): Promise<CheckoutState | null> {
        const store = readStore();
        return store[id] || null;
    }
}

export const checkoutAdapter = new HybridCheckoutAdapter();
