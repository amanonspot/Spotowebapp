/**
 * Insights API Service
 * Handles analytics and insights data
 */

import { api } from '../client';
import { EventInsights, OverallInsights } from '../types';

/**
 * Get event insights
 */
export const getEventInsights = async (eventId: string): Promise<EventInsights> => {
  const response = await api.get<EventInsights>(`/api/insights/?event_id=${eventId}`);
  return response;
};

/**
 * Get overall insights
 */
export const getOverallInsights = async (): Promise<OverallInsights> => {
  const response = await api.get<OverallInsights>('/api/insights/?overall=True');
  return response;
};

