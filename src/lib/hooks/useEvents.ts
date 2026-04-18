/**
 * useEvents Hook
 * React hook for event/property operations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../api';
import { Event, EventListingParams } from '../api/types';

export const useEvents = (initialParams?: EventListingParams) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch events with filters
   */
  const fetchEvents = useCallback(async (params: EventListingParams = {}) => {
    // Prevent multiple simultaneous calls
    if (loading) return events;
    
    setLoading(true);
    setError(null);
    try {
      const response = await eventService.getEventListings(params);
      setEvents(response);
      return response;
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to fetch events');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loading, events]);

  /**
   * Fetch recommended events
   */
  const fetchRecommendedEvents = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loading) return events;
    
    setLoading(true);
    setError(null);
    try {
      const response = await eventService.getRecommendedEvents();
      setEvents(response);
      return response;
    } catch (err: any) {
      console.error('Error fetching recommended events:', err);
      setError(err.message || 'Failed to fetch recommended events');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loading, events]);

  // Remove auto-fetch to prevent multiple calls
  // useEffect(() => {
  //   if (initialParams) {
  //     fetchEvents(initialParams);
  //   }
  // }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    fetchRecommendedEvents,
  };
};

/**
 * useEventDetails Hook
 * Hook for fetching single event details
 */
export const useEventDetails = (eventId?: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch event details
   */
  const fetchEventDetails = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventService.getEventDetails(id);
      setEvent(response);
      return response;
    } catch (err: any) {
      // Better error handling
      const errorMessage = err?.response?.data?.message || 
                          err?.message || 
                          err?.toString() || 
                          'Failed to fetch event details';
      const errorDetails = {
        message: errorMessage,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        eventId: id
      };
      console.error('Error in fetchEventDetails:', errorDetails);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount if eventId provided
  useEffect(() => {
    if (eventId) {
      fetchEventDetails(eventId);
    }
  }, [eventId, fetchEventDetails]);

  return {
    event,
    loading,
    error,
    fetchEventDetails,
    refetch: () => eventId && fetchEventDetails(eventId),
  };
};

