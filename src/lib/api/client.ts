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

const persistTokensFromHeaders = (headers: Record<string, unknown> | undefined) => {
    if (!headers) return;
    const getHeader = (key: string) => {
        const value = headers[key] ?? headers[key.toLowerCase()];
        return typeof value === "string" ? value : "";
    };
    const access = getHeader("X-New-Access-Token");
    const refresh = getHeader("X-New-Refresh-Token");
    if (access || refresh) persistTokens(access || undefined, refresh || undefined);
};

const buildErrorMessage = (error: AxiosError): string => {
    const status = error.response?.status;
    if (status === 401) return "Your session has expired. Please log in again.";
    if (status === 403) return "You are not authorized to perform this action.";
    if (status === 429) return "Too many requests. Please try again shortly.";
    if (typeof status === "number" && status >= 500) {
        return "Something went wrong on the server. Please try again.";
    }

    const payload = error.response?.data;
    if (payload && typeof payload === "object") {
        const data = payload as Record<string, unknown>;
        const message = data.message || data.error || data.detail;
        if (typeof message === "string" && message.trim()) {
            return message.trim().slice(0, 200);
        }
    }
    if (error.message) return error.message;
    return "Network request failed";
};

export interface ApiError extends Error {
    status?: number;
    errors?: Record<string, string[]>;
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
    const refreshToken = getRefreshToken();
    if (!skipAuth) {
        config.headers = config.headers || {};
        if (token) config.headers.Authorization = `Bearer ${token}`;
        if (refreshToken) config.headers["X-Refresh-Token"] = refreshToken;
    }
    return config;
});

apiClient.interceptors.response.use(
    async (response) => {
        persistTokensFromHeaders(response.headers as Record<string, unknown>);
        persistTokensFromBody(response.data);
        return response;
    },
    async (error: AxiosError) => {
        persistTokensFromHeaders(error.response?.headers as Record<string, unknown> | undefined);
        persistTokensFromBody(error.response?.data);

        const status = error.response?.status;
        const originalConfig = error.config as RetryRequestConfig | undefined;
        const refreshToken = getRefreshToken();
        const skipAuth = Boolean(originalConfig?.skipAuth);

        if (status === 401 && originalConfig && !originalConfig._retry && !skipAuth && refreshToken) {
            originalConfig._retry = true;
            originalConfig.headers = originalConfig.headers || {};
            const latestAccess = getAccessToken();
            if (latestAccess) {
                originalConfig.headers.Authorization = `Bearer ${latestAccess}`;
            }
            originalConfig.headers["X-Refresh-Token"] = refreshToken;

            try {
                return await apiClient.request(originalConfig);
            } catch (retryError) {
                if (axios.isAxiosError(retryError) && retryError.response?.status === 401) {
                    clearAuthTokens();
                }
                return Promise.reject(retryError);
            }
        }

        if (status === 401) {
            clearAuthTokens();
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
