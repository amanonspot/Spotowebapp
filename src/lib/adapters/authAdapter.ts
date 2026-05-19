import { AuthAdapter, AuthSession, OtpRequestResult } from "@/lib/adapters/types";
import { authService } from "@/lib/api";

const SESSION_KEY = "spoto_session_v1";
const PENDING_OTP_KEY = "spoto_pending_otp_v1";
const PHONE_CACHE_KEY = "spoto_login_phone_v1";
const DEFAULT_MOCK_OTP = process.env.NEXT_PUBLIC_OWNER_MOCK_OTP || "0000";
const DEFAULT_MOCK_MODE =
    process.env.NEXT_PUBLIC_OWNER_MOCK_MODE === "true" ||
    process.env.NEXT_PUBLIC_RENTALS_MOCK_MODE === "true";

interface PendingOtp {
    phone: string;
    requestedAt: string;
}

type AuthAdapterError = Error & {
    fieldErrors?: Record<string, string | string[]>;
    data?: unknown;
};

const isBrowser = () => typeof window !== "undefined";

const readJson = <T>(key: string): T | null => {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

const writeJson = (key: string, value: unknown) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(key, JSON.stringify(value));
};

const clearKey = (key: string) => {
    if (!isBrowser()) return;
    window.localStorage.removeItem(key);
};

const normalizePhone10 = (raw: string) =>
    String(raw || "")
        .replace(/\D/g, "")
        .slice(-10);

const readCachedLoginPhone = (): string => {
    if (!isBrowser()) return "";
    const v = window.localStorage.getItem(PHONE_CACHE_KEY);
    return v && /^\d{10}$/.test(v) ? v : "";
};

const writeCachedLoginPhone = (phone: string) => {
    const d = normalizePhone10(phone);
    if (!isBrowser() || d.length !== 10) return;
    window.localStorage.setItem(PHONE_CACHE_KEY, d);
};

const toAuthAdapterError = (error: unknown, fallback: string): AuthAdapterError => {
    const next = new Error(
        error instanceof Error && error.message ? error.message : fallback
    ) as AuthAdapterError;

    if (error && typeof error === "object") {
        const typed = error as { fieldErrors?: Record<string, string | string[]>; data?: unknown };
        if (typed.fieldErrors) next.fieldErrors = typed.fieldErrors;
        if (typed.data) next.data = typed.data;
        if (!typed.fieldErrors && typed.data && typeof typed.data === "object") {
            const payload = typed.data as { field_errors?: Record<string, string | string[]> };
            if (payload.field_errors) next.fieldErrors = payload.field_errors;
        }
    }

    return next;
};

interface VerifyPayloadLike {
    user_id?: string;
    access?: string;
    refresh?: string;
    first_name?: string;
    activated_listings_count?: number;
}

const toSession = (phone: string, payload?: VerifyPayloadLike): AuthSession => ({
    isAuthenticated: true,
    isGuest: false,
    phone,
    userName: payload?.first_name || "Spoto User",
    userId: payload?.user_id,
    accessToken: payload?.access,
    refreshToken: payload?.refresh,
    activatedListingsCount:
        typeof payload?.activated_listings_count === "number" && payload.activated_listings_count > 0
            ? payload.activated_listings_count
            : undefined,
});

class HybridAuthAdapter implements AuthAdapter {
    async requestOtp(phone: string): Promise<OtpRequestResult> {
        if (!/^\d{10}$/.test(phone)) {
            throw new Error("Please enter a valid 10-digit mobile number.");
        }

        writeJson(PENDING_OTP_KEY, {
            phone,
            requestedAt: new Date().toISOString(),
        } satisfies PendingOtp);

        try {
            await authService.generateOTP(phone);
            return {
                success: true,
                message: "OTP sent successfully.",
            };
        } catch (error) {
            if (!DEFAULT_MOCK_MODE) {
                throw toAuthAdapterError(error, "Unable to request OTP");
            }

            return {
                success: true,
                message: "OTP sent in mock mode.",
                demoCode: DEFAULT_MOCK_OTP,
            };
        }
    }

    async verifyOtp(code: string): Promise<AuthSession> {
        const pending = readJson<PendingOtp>(PENDING_OTP_KEY);
        if (!pending?.phone) {
            throw new Error("OTP request not found. Please request OTP again.");
        }

        try {
            const payload = await authService.verifyOTP(code, pending.phone);
            const session = toSession(pending.phone, payload);
            writeCachedLoginPhone(pending.phone);
            writeJson(SESSION_KEY, session);

            if (session.accessToken && isBrowser()) {
                localStorage.setItem("access_token", session.accessToken);
            }
            if (session.refreshToken && isBrowser()) {
                localStorage.setItem("refresh_token", session.refreshToken);
            }

            clearKey(PENDING_OTP_KEY);
            return session;
        } catch (error) {
            if (!(DEFAULT_MOCK_MODE && code === DEFAULT_MOCK_OTP)) {
                throw toAuthAdapterError(error, "OTP verification failed");
            }

            const session = toSession(pending.phone);
            writeCachedLoginPhone(pending.phone);
            writeJson(SESSION_KEY, session);
            clearKey(PENDING_OTP_KEY);
            return session;
        }
    }

    getSession(): AuthSession {
        const persisted = readJson<AuthSession>(SESSION_KEY);
        if (!isBrowser()) {
            return (
                persisted || {
                    isAuthenticated: false,
                    isGuest: true,
                }
            );
        }

        const accessToken = window.localStorage.getItem("access_token") || undefined;
        const refreshToken = window.localStorage.getItem("refresh_token") || undefined;

        if (!persisted) {
            if (accessToken) {
                return {
                    isAuthenticated: true,
                    isGuest: false,
                    accessToken,
                    refreshToken,
                    phone: readCachedLoginPhone() || undefined,
                };
            }
            return {
                isAuthenticated: false,
                isGuest: true,
            };
        }

        if (accessToken && !persisted.accessToken) {
            const p = normalizePhone10(persisted.phone || "");
            if (p.length === 10) writeCachedLoginPhone(persisted.phone || "");
            return {
                ...persisted,
                isAuthenticated: true,
                isGuest: false,
                accessToken,
                refreshToken: persisted.refreshToken || refreshToken,
                phone: (p.length === 10 ? p : readCachedLoginPhone()) || undefined,
            };
        }

        const digits = normalizePhone10(persisted.phone || "");
        if (digits.length === 10) writeCachedLoginPhone(persisted.phone || "");
        const mergedPhone = digits.length === 10 ? digits : readCachedLoginPhone() || persisted.phone;
        if (mergedPhone && mergedPhone !== persisted.phone) {
            return { ...persisted, phone: mergedPhone };
        }

        return persisted;
    }
}

export const authAdapter = new HybridAuthAdapter();

export const setGuestSession = (): AuthSession => {
    const session: AuthSession = {
        isAuthenticated: false,
        isGuest: true,
        userName: "Guest",
    };
    writeJson(SESSION_KEY, session);
    return session;
};

export const clearMockSession = () => {
    clearKey(SESSION_KEY);
    clearKey(PENDING_OTP_KEY);
    if (isBrowser()) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem(PHONE_CACHE_KEY);
    }
};
