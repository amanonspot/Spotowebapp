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

const buildErrorMessage = (error: AxiosError): string => {
    const payload = error.response?.data;
    if (payload && typeof payload === "object") {
        const data = payload as Record<string, unknown>;
        const message = data.message || data.error || data.detail;
        if (typeof message === "string" && message.trim()) return message;
    }
    if (error.message) return error.message;
    return "Network request failed";
};

export interface ApiError extends Error {
    status?: number;
    errors?: Record<string, string[]>;
    payload?: unknown;
    unauthorized?: boolean;
}

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
    const token = getAccessToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("isAuthenticated");
        }

        return Promise.reject(error);
    }
);

export const apiRequest = async <T = unknown>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
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
        apiError.payload = unknownError.response?.data;
        apiError.unauthorized = unknownError.response?.status === 401;

        const payload = unknownError.response?.data;
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
    get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
        apiRequest<T>("GET", url, undefined, config),
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        apiRequest<T>("POST", url, data, config),
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        apiRequest<T>("PUT", url, data, config),
    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        apiRequest<T>("PATCH", url, data, config),
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
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

