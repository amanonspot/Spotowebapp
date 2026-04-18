/**
 * Google Places Autocomplete Hook
 * React hook for location autocomplete using Google Places API
 */

import { useState, useEffect, useCallback } from 'react';
import { getPlaceSuggestions, PlaceSuggestion } from '../utils/googlePlaces';

export const useGooglePlaces = () => {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch place suggestions based on input
   */
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await getPlaceSuggestions(input);
      setSuggestions(results);
    } catch (err) {
      setError('Failed to fetch location suggestions');
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
};

