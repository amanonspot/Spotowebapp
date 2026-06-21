'use client';

/**
 * analytics.ts — Core DataLayer-First Analytics Module
 *
 * Architecture:
 *   Product code → pushEvent() → window.dataLayer
 *                                      ↓
 *                                     GTM
 *                              ┌───────┼───────┐
 *                             GA4  Google Ads  Meta (future)
 *
 * NEVER call gtag() directly from product code. All events go through this module.
 *
 * The DataLayer push contract (every event includes):
 *   event, event_version, event_id, timestamp, session_id, client_id, user_id,
 *   utm_source, utm_medium, utm_campaign, utm_term, utm_content,
 *   ...event-specific parameters
 */

import { getClientId, getSessionId, getUserId } from './sessionManager';
import { getFirstTouchUtm } from './utmCapture';
import { generateEventId } from './eventId';
import { AnalyticsEventName } from './events';

const IS_DEV = process.env.NODE_ENV !== 'production';
const IS_DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG_MODE === 'true';

declare global {
    interface Window {
        dataLayer: Record<string, unknown>[];
        gtag?: (...args: unknown[]) => void;
    }
}

/** Ensures window.dataLayer is initialised before any push. */
const ensureDataLayer = (): void => {
    if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
    }
};

/**
 * Core event push — the only function product code should ever call.
 *
 * @param eventName  - Event name constant from ANALYTICS_EVENTS
 * @param params     - Event-specific parameters (typed per event)
 * @param eventId    - Pass an existing eventId to continue a flow; omit to auto-generate
 */
export const pushEvent = (
    eventName: AnalyticsEventName | string,
    params: Record<string, unknown> = {},
    eventId?: string
): void => {
    if (typeof window === 'undefined') return;

    ensureDataLayer();

    const utm = getFirstTouchUtm();
    const resolvedEventId = eventId ?? generateEventId();

    const payload: Record<string, unknown> = {
        event: eventName,
        event_version: 'v1',
        event_id: resolvedEventId,
        timestamp: Date.now(),
        session_id: getSessionId(),
        client_id: getClientId(),
        user_id: getUserId(),
        utm_source: utm.utm_source ?? null,
        utm_medium: utm.utm_medium ?? null,
        utm_campaign: utm.utm_campaign ?? null,
        utm_term: utm.utm_term ?? null,
        utm_content: utm.utm_content ?? null,
        ...params,
    };

    window.dataLayer.push(payload);

    if (IS_DEV || IS_DEBUG) {
        console.group(`[Analytics] ${eventName}`);
        console.table(payload);
        console.groupEnd();
    }
};

/**
 * Pushes a standard GA4 page_view event.
 * Called automatically by AnalyticsProvider on every route change.
 *
 * @param path  - The URL path (e.g. "/booking/my-flat-slug")
 * @param title - The document title
 */
export const pushPageView = (path: string, title?: string): void => {
    if (typeof window === 'undefined') return;
    ensureDataLayer();

    window.dataLayer.push({
        event: 'page_view',
        page_path: path,
        page_title: title || document.title,
        page_location: window.location.href,
        client_id: getClientId(),
        session_id: getSessionId(),
        user_id: getUserId(),
    });

    if (IS_DEV || IS_DEBUG) {
        console.log(`[Analytics] page_view → ${path}`);
    }
};

/**
 * Sets a GA4 user property that persists across sessions.
 * Pushes a special GTM-compatible user_properties event to the dataLayer.
 *
 * @param key   - Property name (e.g. "user_type")
 * @param value - Property value
 */
export const setUserProperty = (key: string, value: string | boolean | number | null): void => {
    if (typeof window === 'undefined') return;
    ensureDataLayer();

    window.dataLayer.push({
        event: 'set_user_property',
        user_property_key: key,
        user_property_value: value,
    });

    if (IS_DEV || IS_DEBUG) {
        console.log(`[Analytics] set_user_property → ${key}: ${value}`);
    }
};

/**
 * Sets the GA4 user_id for cross-device stitching.
 * Should be called once immediately after a successful login.
 *
 * @param userId - The authenticated user's ID from the backend
 */
export const identifyUser = (userId: string | number): void => {
    if (typeof window === 'undefined') return;
    ensureDataLayer();

    window.dataLayer.push({
        event: 'user_identified',
        user_id: String(userId),
    });

    if (IS_DEV || IS_DEBUG) {
        console.log(`[Analytics] identifyUser → ${userId}`);
    }
};
