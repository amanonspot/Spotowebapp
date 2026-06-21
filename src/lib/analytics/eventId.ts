import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique event ID (UUID v4) for deduplication of critical events.
 *
 * Use once at the START of a flow (e.g. pass purchase, unlock) and carry the
 * same ID through every subsequent event in that flow so GA4 / BigQuery can
 * deduplicate with COUNT(DISTINCT event_id).
 *
 * @returns A RFC 4122 v4 UUID string
 */
export const generateEventId = (): string => uuidv4();
