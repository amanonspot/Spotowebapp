const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

export const getPublicSiteUrl = () =>
    stripTrailingSlashes(process.env.NEXT_PUBLIC_FRONTEND_URL?.trim() || "https://spoto.in");

/**
 * Canonical backend origin for browser + server fetches.
 * Mirrors `src/lib/api/client.ts` precedence.
 */
export const getApiBaseUrl = () => {
    const primary = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    const secondary = process.env.NEXT_PUBLIC_API_URL?.trim();
    return stripTrailingSlashes(primary || secondary || "https://production.api.spoto.in");
};
