'use client';

/**
 * sessionManager.ts
 *
 * Manages two GA4 identifiers that must be attached to every analytics event:
 *
 *  client_id   — Persistent browser identity. Extracted from the _ga cookie
 *                (set by the GA4 gtag.js script loaded via GTM).
 *                Format: GA1.1.<random>.<timestamp>  →  we keep the last two
 *                numeric segments, e.g. "1234567890.9876543210".
 *
 *  session_id  — Per-tab session identity. Stored in sessionStorage so it
 *                resets when the tab is closed, matching GA4's session model.
 *
 * These values are forwarded to the Django backend via request headers
 * (X-GA-Client-ID, X-GA-Session-ID) so server-side Measurement Protocol
 * events can be stitched to the correct GA4 session.
 */

import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'spoto_ga_session_id';

/**
 * Returns the GA4 client_id extracted from the _ga cookie.
 * Falls back to a stable value stored in localStorage if the cookie
 * is not yet available (e.g. consent denied / GTM not loaded).
 */
export const getClientId = (): string => {
    if (typeof document === 'undefined') return '';

    // Try _ga cookie (set by gtag.js / GTM GA4 tag)
    const gaCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('_ga='));

    if (gaCookie) {
        const value = gaCookie.split('=')[1]; // GA1.1.XXXXXXXXXX.XXXXXXXXXX
        const parts = value.split('.');
        if (parts.length >= 4) {
            return `${parts[2]}.${parts[3]}`;
        }
    }

    // Fallback: generate + persist a stable client-like ID in localStorage
    const fallbackKey = 'spoto_ga_client_id_fallback';
    const existing = localStorage.getItem(fallbackKey);
    if (existing) return existing;
    const generated = `fallback.${Date.now()}`;
    localStorage.setItem(fallbackKey, generated);
    return generated;
};

/**
 * Returns the current session ID.
 * Creates a new UUID and persists it to sessionStorage if none exists.
 */
export const getSessionId = (): string => {
    if (typeof sessionStorage === 'undefined') return '';

    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const newId = uuidv4();
    sessionStorage.setItem(SESSION_KEY, newId);
    return newId;
};

/**
 * Returns the authenticated user ID from localStorage (JWT decode-free shortcut).
 * The auth hook sets 'spoto_user_id' after successful login.
 * Returns null for guest users.
 */
export const getUserId = (): string | null => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('spoto_user_id');
};

/**
 * Persists the authenticated user ID so sessionManager can attach it to events.
 * Call this from useAuth after a successful login.
 */
export const setUserId = (id: string | number): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('spoto_user_id', String(id));
};

/**
 * Clears the persisted user ID on logout.
 */
export const clearUserId = (): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('spoto_user_id');
};
