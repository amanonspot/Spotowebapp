'use client';

/**
 * AnalyticsProvider.tsx
 *
 * React context provider responsible for:
 *  1. Auto-firing page_view on every Next.js App Router route change.
 *  2. Capturing UTM parameters on mount (first-touch persistence).
 *  3. Initialising Web Vitals reporters on mount.
 *  4. Exposing a React context so child components can read analytics utilities.
 *
 * Place this provider inside the root layout, wrapping {children}.
 * It must be a Client Component because it uses usePathname and useEffect.
 */

import { createContext, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { pushPageView } from './analytics';
import { captureUtm } from './utmCapture';
import { initWebVitals } from './webVitals';
import { mpPageView } from './metaPixel';

interface AnalyticsContextValue {
    /** No values needed publicly yet — extend if required */
    _initialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({ _initialized: false });

export const useAnalytics = () => useContext(AnalyticsContext);

interface AnalyticsProviderProps {
    children: React.ReactNode;
}

export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
    const pathname = usePathname();
    const isFirstRender = useRef(true);

    // ── Mount: capture UTM + init web vitals once ──────────────────────────────
    useEffect(() => {
        captureUtm();
        initWebVitals();
    }, []);

    // ── Route change: push page_view ───────────────────────────────────────────
    useEffect(() => {
        // Skip the very first render — GTM fires its own initial page_view
        // via the "All Pages" trigger. We only need to fire on subsequent
        // client-side navigations (SPA route changes).
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        pushPageView(pathname);
        // Meta Pixel PageView on every SPA navigation
        mpPageView();
    }, [pathname]);

    return (
        <AnalyticsContext.Provider value={{ _initialized: true }}>
            {children}
        </AnalyticsContext.Provider>
    );
}
