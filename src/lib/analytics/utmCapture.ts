'use client';

/**
 * utmCapture.ts
 *
 * First-touch UTM attribution persistence.
 *
 * Strategy:
 *  - On every page load, inspect the URL for utm_* query params.
 *  - If UTM params are present AND no first-touch cookie exists yet → write them.
 *  - If UTM params are present AND a first-touch cookie already exists → do NOT overwrite.
 *  - All analytics events include the stored first-touch UTM values as parameters.
 *  - Also captures last-touch UTM in sessionStorage for last-touch attribution model.
 *
 * Cookie spec:
 *  Name:     spoto_utm_first_touch
 *  Value:    URL-encoded JSON of up to 5 UTM params
 *  Expiry:   90 days from first visit
 *  SameSite: Lax
 */

const FIRST_TOUCH_COOKIE = 'spoto_utm_first_touch';
const LAST_TOUCH_KEY = 'spoto_utm_last_touch';
const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60;

export interface UtmParams {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}

const UTM_KEYS: (keyof UtmParams)[] = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
];

/** Reads UTM params from the current URL's search string. */
const extractFromUrl = (search: string): UtmParams => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(search);
    const result: UtmParams = {};
    for (const key of UTM_KEYS) {
        const value = params.get(key);
        if (value) result[key] = value;
    }
    return result;
};

const hasAnyUtm = (utm: UtmParams): boolean =>
    UTM_KEYS.some((k) => Boolean(utm[k]));

/** Reads the first-touch cookie and returns parsed UTM params. */
export const getFirstTouchUtm = (): UtmParams => {
    if (typeof document === 'undefined') return {};
    const cookie = document.cookie
        .split('; ')
        .find((r) => r.startsWith(`${FIRST_TOUCH_COOKIE}=`));
    if (!cookie) return {};
    try {
        return JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('=')));
    } catch {
        return {};
    }
};

/** Reads the last-touch UTM from sessionStorage. */
export const getLastTouchUtm = (): UtmParams => {
    if (typeof sessionStorage === 'undefined') return {};
    try {
        const raw = sessionStorage.getItem(LAST_TOUCH_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

/**
 * Main entry point. Call once on page load (in AnalyticsProvider).
 * Persists UTM params from the URL into the first-touch cookie (if not set)
 * and always updates sessionStorage with the latest (last-touch).
 */
export const captureUtm = (): void => {
    if (typeof window === 'undefined') return;
    const current = extractFromUrl(window.location.search);
    if (!hasAnyUtm(current)) return;

    // Always update last-touch (sessionStorage)
    try {
        sessionStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(current));
    } catch {
        // sessionStorage quota exceeded — non-fatal
    }

    // Only write first-touch cookie if it doesn't exist yet
    const existing = getFirstTouchUtm();
    if (hasAnyUtm(existing)) return;

    const encoded = encodeURIComponent(JSON.stringify(current));
    document.cookie = [
        `${FIRST_TOUCH_COOKIE}=${encoded}`,
        `max-age=${NINETY_DAYS_SECONDS}`,
        'path=/',
        'SameSite=Lax',
        ...(window.location.protocol === 'https:' ? ['Secure'] : []),
    ].join('; ');
};
