import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://production.api.spoto.in";

const CACHE_DURATION_MS = 30_000;
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
    timeout: 30_000,
    headers: {
        Accept: "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const skipAuth = Boolean((config as RequestConfig).skipAuth);
    const token = getAccessToken();
    if (!skipAuth) {
        config.headers = config.headers || {};
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    async (response) => {
        persistTokensFromBody(response.data);
        return response;
    },
    async (error: AxiosError) => {
        persistTokensFromBody(error.response?.data);

        const status = error.response?.status;
        const originalConfig = error.config as RetryRequestConfig | undefined;
        const refreshToken = getRefreshToken();
        const skipAuth = Boolean(originalConfig?.skipAuth);

        if (status === 401 && originalConfig && !originalConfig._retry && !skipAuth && refreshToken) {
            originalConfig._retry = true;

            try {
                // Call the token refresh endpoint to get a new access token
                const refreshResponse = await axios.post<{ access: string; refresh?: string }>(
                    `${API_BASE_URL}/api/token/refresh/`,
                    { refresh: refreshToken },
                    { headers: { "Content-Type": "application/json" } }
                );

                const newAccessToken = refreshResponse.data.access;
                const newRefreshToken = refreshResponse.data.refresh;

                persistTokens(newAccessToken, newRefreshToken);

                // Update auth-token cookie with new access token
                if (typeof document !== "undefined") {
                    document.cookie = `auth-token=${newAccessToken}; path=/; max-age=604800; SameSite=Strict`;
                }

                // Retry the original request with the new access token
                originalConfig.headers = originalConfig.headers || {};
                originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
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
        if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
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
