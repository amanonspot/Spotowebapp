'use client';

/**
 * CookieConsentBanner.tsx
 *
 * Displays a minimal consent banner the first time a user visits.
 *
 * On Accept → updates GTM Consent Mode v2 to `analytics_storage: granted`,
 *             stores decision in localStorage so the banner never reappears.
 * On Decline → keeps analytics_storage denied, stores decision.
 *
 * The banner is built to be non-intrusive: it floats at the bottom of the
 * viewport, respects safe-area insets, and never blocks page content.
 *
 * Storage key: spoto_cookie_consent_v1
 * Values: 'accepted' | 'declined'
 */

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'spoto_cookie_consent_v1';

type ConsentState = 'accepted' | 'declined' | null;

const updateGtmConsent = (granted: boolean) => {
    if (typeof window === 'undefined') return;
    const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
    if (!dl) return;
    dl.push('consent', 'update', {
        analytics_storage: granted ? 'granted' : 'denied',
        ad_storage: 'denied',
    });
};

const readStoredConsent = (): ConsentState => {
    if (typeof window === 'undefined') return null;
    try {
        const val = window.localStorage.getItem(CONSENT_KEY);
        if (val === 'accepted' || val === 'declined') return val;
    } catch {
        // storage blocked (private mode etc.)
    }
    return null;
};

const storeConsent = (value: 'accepted' | 'declined') => {
    try {
        window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
        // ignore
    }
};

export default function CookieConsentBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const stored = readStoredConsent();
        if (!stored) {
            setVisible(true);
        } else if (stored === 'accepted') {
            updateGtmConsent(true);
        }
    }, []);

    if (!visible) return null;

    const handleAccept = () => {
        storeConsent('accepted');
        updateGtmConsent(true);
        setVisible(false);
    };

    const handleDecline = () => {
        storeConsent('declined');
        updateGtmConsent(false);
        setVisible(false);
    };

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            aria-live="polite"
            className="fixed bottom-0 left-0 right-0 z-[9999] pb-[env(safe-area-inset-bottom,0px)]"
        >
            <div className="mx-auto max-w-2xl px-4 pb-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-[#10101a]/95 px-4 py-4 shadow-[0_-8px_40px_rgba(0,0,0,0.6)] backdrop-blur-md sm:flex-row sm:items-center sm:gap-4">
                    <p className="flex-1 text-xs leading-relaxed text-white/75">
                        We use cookies to improve your experience and understand how you use Spoto.
                        Your data is never sold.{' '}
                        <a
                            href="/privacy"
                            className="text-[#A67AEB] underline underline-offset-2 hover:text-[#c4a4f9]"
                        >
                            Learn more
                        </a>
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDecline}
                            className="h-9 rounded-xl border border-white/20 px-4 text-xs font-semibold text-white/70 transition hover:border-white/40 hover:text-white active:scale-[0.97]"
                        >
                            Decline
                        </button>
                        <button
                            type="button"
                            onClick={handleAccept}
                            className="h-9 rounded-xl bg-[#A67AEB] px-5 text-xs font-semibold text-white transition hover:bg-[#b891f5] active:scale-[0.97]"
                        >
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
