'use client';

/**
 * webVitals.ts
 *
 * Tracks Core Web Vitals (LCP, CLS, INP, TTFB, FCP) and pushes them to
 * window.dataLayer so GTM can forward them to GA4.
 *
 * Metrics are reported once per page navigation.
 *
 * Call initWebVitals() once from AnalyticsProvider on mount.
 *
 * GA4 events emitted:
 *  web_vital_lcp  — Largest Contentful Paint   (good: <2.5s)
 *  web_vital_cls  — Cumulative Layout Shift     (good: <0.1)
 *  web_vital_inp  — Interaction to Next Paint   (good: <200ms)
 *  web_vital_ttfb — Time to First Byte          (good: <800ms)
 *  web_vital_fcp  — First Contentful Paint      (good: <1.8s)
 */

import type { Metric } from 'web-vitals';

declare global {
    interface Window {
        dataLayer: Record<string, unknown>[];
    }
}

const IS_DEV = process.env.NODE_ENV !== 'production';

const ratingFor = (metric: Metric): 'good' | 'needs-improvement' | 'poor' => {
    return metric.rating as 'good' | 'needs-improvement' | 'poor';
};

const pushVital = (eventName: string, metric: Metric): void => {
    if (typeof window === 'undefined') return;
    window.dataLayer = window.dataLayer || [];

    const pagePath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    window.dataLayer.push({
        event: eventName,
        value_ms: metric.name === 'CLS' ? undefined : Math.round(metric.value),
        value: metric.name === 'CLS' ? metric.value : undefined,
        rating: ratingFor(metric),
        page_path: pagePath,
        navigation_type: metric.navigationType ?? 'navigate',
        metric_id: metric.id,
    });

    if (IS_DEV) {
        console.log(`[WebVitals] ${metric.name} = ${metric.value} (${ratingFor(metric)})`);
    }
};

/**
 * Registers all web vitals reporters.
 * Safe to call multiple times — web-vitals library itself deduplicates internally.
 */
export const initWebVitals = async (): Promise<void> => {
    if (typeof window === 'undefined') return;

    try {
        const { onCLS, onINP, onLCP, onTTFB, onFCP } = await import('web-vitals');

        onLCP((m) => pushVital('web_vital_lcp', m));
        onCLS((m) => pushVital('web_vital_cls', m));
        onINP((m) => pushVital('web_vital_inp', m));
        onTTFB((m) => pushVital('web_vital_ttfb', m));
        onFCP((m) => pushVital('web_vital_fcp', m));
    } catch {
        // web-vitals not available (e.g. old browser) — non-fatal
    }
};
