import { useState, useEffect } from 'react';
import { getEssentials, getFeatures } from '@/lib/api/services/event.service';
import { Amenity } from '@/lib/api/types';

interface UseEssentialsReturn {
  essentials: Amenity[];
  loading: boolean;
  error: string | null;
}

interface UseFeaturesReturn {
  features: Amenity[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch essentials data dynamically
 */
export const useEssentials = (eventId?: string): UseEssentialsReturn => {
  const [essentials, setEssentials] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEssentials = async () => {
      if (!eventId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getEssentials(eventId);
        setEssentials(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch essentials');
        console.error('Error fetching essentials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEssentials();
  }, [eventId]);

  return { essentials, loading, error };
};

/**
 * Hook to fetch features data dynamically
 */
export const useFeatures = (eventId?: string): UseFeaturesReturn => {
  const [features, setFeatures] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatures = async () => {
      if (!eventId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getFeatures(eventId);
        setFeatures(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch features');
        console.error('Error fetching features:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, [eventId]);

  return { features, loading, error };
};
