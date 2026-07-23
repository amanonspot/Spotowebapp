import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { getApiBaseUrl } from "@/lib/runtime/publicEnv";
import { getClientId, getSessionId } from "@/lib/analytics/sessionManager";

const API_BASE_URL = getApiBaseUrl();

const CACHE_DURATION_MS = 300_000; // 5 min in-memory — masters also cached 24h in localStorage
const MASTERS_CACHE_DURATION_MS = 3_600_000; // 1 hour in-memory for master GETs
const requestCache = new Map<string, { data: unknown; timestamp: number }>();

const getAccessToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token") || localStorage.getItem("spoto_access_token");
};

const getRefreshToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refresh_token") || localStorage.getItem("spoto_refresh_token");
};

const persistTokens = (accessToken?: string, refreshToken?: string) => {
    if (typeof window === "undefined") return;
    if (accessToken) localStorage.setItem("access_token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    if (accessToken || refreshToken) localStorage.setItem("isAuthenticated", "true");
};

const clearAuthTokens = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("spoto_session_v1");
};

const persistTokensFromBody = (data: unknown) => {
    if (!data || typeof data !== "object") return;
    const payload = data as Record<string, unknown>;
    const access = typeof payload.access === "string" ? payload.access : "";
    const refresh = typeof payload.refresh === "string" ? payload.refresh : "";
    if (access || refresh) persistTokens(access || undefined, refresh || undefined);
};

const updateAuthCookie = (accessToken: string) => {
    if (typeof document !== "undefined") {
        document.cookie = `auth-token=${accessToken}; path=/; max-age=604800; SameSite=Strict`;
    }
};

const persistTokensFromHeaders = (headers: unknown) => {
    if (!headers || typeof headers !== "object") return;
    const record = headers as Record<string, unknown>;
    const access =
        typeof record["x-new-access-token"] === "string"
            ? record["x-new-access-token"]
            : typeof record["X-New-Access-Token"] === "string"
              ? record["X-New-Access-Token"]
              : "";
    const refresh =
        typeof record["x-new-refresh-token"] === "string"
            ? record["x-new-refresh-token"]
            : typeof record["X-New-Refresh-Token"] === "string"
              ? record["X-New-Refresh-Token"]
              : "";
    if (access || refresh) {
        persistTokens(access || undefined, refresh || undefined);
        if (access) updateAuthCookie(access);
    }
};

type RefreshedTokens = { access: string; refresh?: string };

/** Single in-flight refresh — avoids rotate/blacklist races during pass payment polling. */
let refreshInFlight: Promise<RefreshedTokens> | null = null;

const refreshAccessToken = (): Promise<RefreshedTokens> => {
    if (refreshInFlight) return refreshInFlight;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return Promise.reject(new Error("No refresh token"));
    }

    refreshInFlight = axios
        .post<{ access: string; refresh?: string }>(
            `${API_BASE_URL}/api/token/refresh/`,
            { refresh: refreshToken },
            { headers: { "Content-Type": "application/json" } }
        )
        .then((response) => {
            const access = response.data.access;
            const refresh = response.data.refresh;
            persistTokens(access, refresh);
            if (access) updateAuthCookie(access);
            return { access, refresh };
        })
        .finally(() => {
            refreshInFlight = null;
        });

    return refreshInFlight;
};

const extractFieldError = (payload: unknown): string => {
    if (!payload || typeof payload !== "object") return "";
    const fieldErrors = (payload as Record<string, unknown>).field_errors;
    if (!fieldErrors || typeof fieldErrors !== "object") return "";
    for (const value of Object.values(fieldErrors as Record<string, unknown>)) {
        if (typeof value === "string" && value.trim()) return value.trim();
        if (Array.isArray(value)) {
            const first = value.find((item) => typeof item === "string" && item.trim());
            if (typeof first === "string") return first.trim();
        }
    }
    return "";
};

const firstNonEmptyString = (...values: unknown[]) => {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
};

const buildErrorMessage = (error: AxiosError): string => {
    const payload = error.response?.data;
    if (payload && typeof payload === "object") {
        const data = payload as Record<string, unknown>;
        const message = firstNonEmptyString(data.error, data.message, data.detail);
        if (message) return message.slice(0, 200);
        const fieldMessage = extractFieldError(payload);
        if (fieldMessage) return fieldMessage.slice(0, 200);
    }

    const status = error.response?.status;
    if (status === 401) return "Your session has expired. Please log in again.";
    if (status === 403) return "You are not authorized to perform this action.";
    if (status === 429) return "Too many requests. Please try again shortly.";
    if (typeof status === "number" && status >= 500) {
        return "Something went wrong on the server. Please try again.";
    }
    if (error.message) return error.message;
    return "Network request failed";
};

export interface ApiError extends Error {
    status?: number;
    errors?: Record<string, string[]>;
    fieldErrors?: Record<string, string | string[]>;
    unauthorized?: boolean;
    data?: unknown;
}

type RequestConfig = AxiosRequestConfig & { skipAuth?: boolean };
type RetryRequestConfig = RequestConfig & { _retry?: boolean };

export const clearCache = (url?: string) => {
    if (!url) {
        requestCache.clear();
        return;
    }

    for (const key of requestCache.keys()) {
        if (key.includes(url)) requestCache.delete(key);
    }
};

const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60_000,
    headers: {
        Accept: "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const skipAuth = Boolean((config as RequestConfig).skipAuth);
    const token = getAccessToken();
    const refreshToken = getRefreshToken();
    if (!skipAuth) {
        config.headers = config.headers || {};
        if (token) config.headers.Authorization = `Bearer ${token}`;
        if (refreshToken) config.headers["X-Refresh-Token"] = refreshToken;
    }

    // Attach GA4 attribution headers for server-side event linking
    if (typeof window !== "undefined") {
        config.headers = config.headers || {};
        const clientId = getClientId();
        const sessionId = getSessionId();
        if (clientId) config.headers["X-GA-Client-ID"] = clientId;
        if (sessionId) config.headers["X-GA-Session-ID"] = sessionId;
    }

    return config;
});

apiClient.interceptors.response.use(
    async (response) => {
        persistTokensFromHeaders(response.headers);
        persistTokensFromBody(response.data);
        return response;
    },
    async (error: AxiosError) => {
        persistTokensFromHeaders(error.response?.headers);
        persistTokensFromBody(error.response?.data);

        const status = error.response?.status;
        const originalConfig = error.config as RetryRequestConfig | undefined;
        const refreshToken = getRefreshToken();
        const skipAuth = Boolean(originalConfig?.skipAuth);

        if (status === 401 && originalConfig && !originalConfig._retry && !skipAuth && refreshToken) {
            originalConfig._retry = true;

            try {
                const { access, refresh } = await refreshAccessToken();

                originalConfig.headers = originalConfig.headers || {};
                originalConfig.headers.Authorization = `Bearer ${access}`;
                if (refresh) originalConfig.headers["X-Refresh-Token"] = refresh;
                return await apiClient.request(originalConfig);
            } catch {
                clearAuthTokens();
                if (typeof document !== "undefined") {
                    document.cookie = "auth-token=; path=/; max-age=0; SameSite=Strict";
                }
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export const apiRequest = async <T = unknown>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    data?: unknown,
    config?: RequestConfig
): Promise<T> => {
    const cacheKey = method === "GET" ? `${method}:${url}:${JSON.stringify(config?.params || {})}` : null;
    const now = Date.now();

    if (cacheKey) {
        const cached = requestCache.get(cacheKey);
        const ttl = url.includes("/masters/") ? MASTERS_CACHE_DURATION_MS : CACHE_DURATION_MS;
        if (cached && now - cached.timestamp < ttl) {
            return cached.data as T;
        }
    }

    try {
        const response = await apiClient.request<T>({
            method,
            url,
            data,
            ...config,
        });

        const body = response.data as unknown;
        if (body && typeof body === "object" && (body as Record<string, unknown>).success === false) {
            const apiError = new Error(
                firstNonEmptyString(
                    (body as Record<string, unknown>).error,
                    (body as Record<string, unknown>).message,
                    extractFieldError(body),
                    "Request failed"
                )
            ) as ApiError;
            apiError.status = response.status;
            apiError.data = body;
            const fieldErrors = (body as Record<string, unknown>).field_errors;
            if (fieldErrors && typeof fieldErrors === "object") {
                apiError.fieldErrors = fieldErrors as Record<string, string | string[]>;
            }
            throw apiError;
        }

        if (cacheKey) {
            requestCache.set(cacheKey, { data: response.data, timestamp: now });
        }

        return response.data;
    } catch (unknownError) {
        if (!axios.isAxiosError(unknownError)) {
            throw unknownError;
        }

        const apiError = new Error(buildErrorMessage(unknownError)) as ApiError;
        apiError.status = unknownError.response?.status;
        apiError.unauthorized = unknownError.response?.status === 401;

        const payload = unknownError.response?.data;
        apiError.data = payload;
        if (payload && typeof payload === "object") {
            const errors = (payload as Record<string, unknown>).errors;
            if (errors && typeof errors === "object") {
                apiError.errors = errors as Record<string, string[]>;
            }
            const fieldErrors = (payload as Record<string, unknown>).field_errors;
            if (fieldErrors && typeof fieldErrors === "object") {
                apiError.fieldErrors = fieldErrors as Record<string, string | string[]>;
            }
        }

        throw apiError;
    }
};

export const api = {
    get: <T = unknown>(url: string, config?: RequestConfig) =>
        apiRequest<T>("GET", url, undefined, config),
    post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) =>
        apiRequest<T>("POST", url, data, config),
    put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) =>
        apiRequest<T>("PUT", url, data, config),
    patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) =>
        apiRequest<T>("PATCH", url, data, config),
    delete: <T = unknown>(url: string, config?: RequestConfig) =>
        apiRequest<T>("DELETE", url, undefined, config),
};

export const apiFormData = {
    post: async <T = unknown>(url: string, formData: FormData): Promise<T> =>
        api.post<T>(url, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),
};

export default apiClient;
