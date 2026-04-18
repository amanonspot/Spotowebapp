/**
 * useEventTypes Hook
 * React hook for fetching event types/categories
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../api';
import { EventType } from '../api/types';

export const useEventTypes = () => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch event types
   */
  const fetchEventTypes = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loading) return eventTypes;
    
    setLoading(true);
    setError(null);
    try {
      const response = await eventService.getEventTypes();
      setEventTypes(response);
      return response;
    } catch (err: any) {
      console.error('Error fetching event types:', err);
      setError(err.message || 'Failed to fetch event types');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loading, eventTypes]);

  // Remove auto-fetch to prevent multiple calls
  // useEffect(() => {
  //   fetchEventTypes();
  // }, []);

  return {
    eventTypes,
    loading,
    error,
    fetchEventTypes,
  };
};

