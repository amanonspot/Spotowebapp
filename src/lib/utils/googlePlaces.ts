/**
 * Google Places Autocomplete Utility
 * Provides location suggestions using Google Places API (client-side via script)
 */

import config from '@/config/config';

export interface PlaceSuggestion {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

// Load Google Places script dynamically
let isScriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

/**
 * Load Google Places API script
 */
export const loadGooglePlacesScript = (): Promise<void> => {
  if (isScriptLoaded) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googlePlacesApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isScriptLoaded = true;
      resolve();
    };
    
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Failed to load Google Places script'));
    };
    
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
};

/**
 * Get place autocomplete suggestions using Google Places Autocomplete Service
 * TODO: Migrate to new google.maps.places.AutocompleteSuggestion API when ready
 * Current implementation uses legacy AutocompleteService (still supported)
 */
export const getPlaceSuggestions = async (
  input: string
): Promise<PlaceSuggestion[]> => {
  if (!input || input.trim().length < 2) {
    return [];
  }

  try {
    // Ensure Google Places script is loaded
    await loadGooglePlacesScript();

    // Check if Google Places API is available
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Places API not loaded');
      return [];
    }

    return new Promise((resolve) => {
      // Suppress deprecation warning in console temporarily
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (!args[0]?.includes?.('AutocompleteService')) {
          originalWarn.apply(console, args);
        }
      };

      const service = new google.maps.places.AutocompleteService();
      
      service.getPlacePredictions(
        {
          input: input,
          types: ['(cities)'], // Restrict to cities
        },
        (predictions, status) => {
          // Restore original console.warn
          console.warn = originalWarn;
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const suggestions = predictions.map(prediction => ({
              description: prediction.description,
              place_id: prediction.place_id,
              main_text: prediction.structured_formatting.main_text,
              secondary_text: prediction.structured_formatting.secondary_text || '',
            }));
            resolve(suggestions);
          } else {
            resolve([]);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error fetching place suggestions:', error);
    return [];
  }
};

