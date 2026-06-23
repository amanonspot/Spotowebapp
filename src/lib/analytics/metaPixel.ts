/**
 * Meta Pixel (fbq) utility — typed wrappers around the global fbq function.
 *
 * Architecture:
 *   - `fbq` is loaded by MetaPixelScript.tsx as a `beforeInteractive` consent-aware script.
 *   - Consent defaults to revoked; granted via CookieConsentBanner.
 *   - All helpers are no-ops when fbq is not loaded (server-side or blocked).
 */

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
        _fbq?: unknown;
    }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

/** Returns the fbq function if available in the browser. */
function fbq(): ((...args: unknown[]) => void) | null {
    if (typeof window === 'undefined') return null;
    return window.fbq ?? null;
}

// ── Consent ───────────────────────────────────────────────────────────────────

export function metaPixelGrantConsent() {
    fbq()?.('consent', 'grant');
}

export function metaPixelRevokeConsent() {
    fbq()?.('consent', 'revoke');
}

// ── Standard Events ────────────────────────────────────────────────────────────

/** Fire on every page navigation. Called by AnalyticsProvider. */
export function mpPageView() {
    fbq()?.('track', 'PageView');
}

/**
 * ViewContent — property detail page viewed.
 * Used to build "interested in rentals" audiences.
 */
export function mpViewContent(params: {
    property_id: string;
    city?: string;
    bhk?: string;
    rent?: number;
}) {
    fbq()?.('track', 'ViewContent', {
        content_ids: [params.property_id],
        content_type: 'product',
        content_name: `${params.bhk ?? ''} in ${params.city ?? ''}`.trim(),
        value: params.rent ?? 0,
        currency: 'INR',
    });
}

/**
 * InitiateCheckout — user sees the pass paywall overlay.
 * Signals high purchase intent for retargeting.
 */
export function mpInitiateCheckout(params: {
    property_id: string;
    amount: number;
}) {
    fbq()?.('track', 'InitiateCheckout', {
        content_ids: [params.property_id],
        content_type: 'product',
        value: params.amount,
        currency: 'INR',
        num_items: 1,
    });
}

/**
 * Purchase — pass bought (client-side confirmation).
 * Use Conversions API (backend) for verified revenue reporting.
 */
export function mpPurchase(params: {
    property_id: string;
    amount: number;
    pass_type?: string;
    event_id?: string;
}) {
    fbq()?.('track', 'Purchase', {
        content_ids: [params.property_id],
        content_type: 'product',
        value: params.amount,
        currency: 'INR',
    }, params.event_id ? { eventID: params.event_id } : undefined);
}

/**
 * Lead — owner contact unlocked (phone number revealed).
 * Signals a completed tenant-owner connection.
 */
export function mpLead(params: {
    property_id: string;
    city?: string;
}) {
    fbq()?.('track', 'Lead', {
        content_name: `Contact Unlocked – ${params.city ?? 'Unknown City'}`,
        content_ids: [params.property_id],
    });
}

/**
 * CompleteRegistration — new user signed up for the first time.
 */
export function mpCompleteRegistration() {
    fbq()?.('track', 'CompleteRegistration', {
        content_name: 'Spoto Signup',
        currency: 'INR',
        value: 0,
    });
}

/**
 * Search — triggered when user performs a property search.
 */
export function mpSearch(params: { query?: string; city?: string }) {
    fbq()?.('track', 'Search', {
        search_string: params.query ?? params.city ?? '',
    });
}

/**
 * Custom event — fires an arbitrary custom Meta Pixel event.
 */
export function mpCustomEvent(name: string, data?: Record<string, unknown>) {
    fbq()?.('trackCustom', name, data);
}

export { PIXEL_ID };
