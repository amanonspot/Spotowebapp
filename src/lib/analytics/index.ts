/**
 * Analytics module barrel export.
 * Import from here in product code: import { pushEvent, ANALYTICS_EVENTS } from '@/lib/analytics';
 */
export { pushEvent, pushPageView, setUserProperty, identifyUser } from './analytics';
export { ANALYTICS_EVENTS } from './events';
export type { AnalyticsEventName } from './events';
export { generateEventId } from './eventId';
export { getClientId, getSessionId, getUserId, setUserId, clearUserId } from './sessionManager';
export { captureUtm, getFirstTouchUtm, getLastTouchUtm } from './utmCapture';
export { default as AnalyticsProvider } from './AnalyticsProvider';
