/**
 * Data Transformers
 * Utility functions to transform API data to UI-friendly formats
 */

import { Event, EventMedia } from '../api/types';

/**
 * Property interface for UI components
 */
export interface UIProperty {
  id: string;
  title: string;
  location: string;
  price: string;
  image: string;
  status?: string;
  rating?: string;
}

/**
 * Get primary image from event media or other sources
 */
const getPrimaryImage = (event: Event): string => {
  // Check for display_image first (from API response)
  if (event.display_image) {
    return event.display_image;
  }

  // Check if event has event_media (from API response)
  if (event.event_media?.image && event.event_media.image.length > 0) {
    return event.event_media.image[0];
  }

  // Check if event has media (legacy structure)
  if (event.media && event.media.length > 0) {
    // Find the highest priority non-hidden, non-deleted image
    const sortedImages = event.media
      .filter(m => m.media_type === 'image' && !m.is_deleted && !m.is_hidden)
      .sort((a, b) => a.media_priority_ranking - b.media_priority_ranking);

    const selectedImage = sortedImages[0]?.media_file;
    
    if (selectedImage) {
      // Ensure the image URL is properly formatted
      if (selectedImage.startsWith('http')) {
        return selectedImage;
      } else {
        // If it's a relative path, make it absolute
        return selectedImage.startsWith('/') ? selectedImage : `/${selectedImage}`;
      }
    }
  }

  // Check if any artist has a profile picture
  if (event.artists && event.artists.length > 0) {
    const artistWithImage = event.artists.find(artist => artist.profile_pic);
    if (artistWithImage?.profile_pic) {
      return artistWithImage.profile_pic;
    }
  }
  
  // Return a diverse set of fallback images based on event type/title
  const fallbackImages = [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ];
  
  // Use event ID to consistently pick the same fallback image for the same event
  const hash = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbackImages[hash % fallbackImages.length];
};

/**
 * Get display status based on event features and amenities
 */
const getPropertyStatus = (event: Event): string => {
  // Check budget keywords
  if (event.budget_keywords?.some((b: any) => b.name.toLowerCase().includes('premium') || b.name.toLowerCase().includes('luxury'))) {
    return 'Premium Stay ✨';
  }
  
  // Check property types
  if (event.property_types?.some((p: any) => p.name.toLowerCase().includes('resort'))) {
    return 'Resort Stay ✨';
  }
  if (event.property_types?.some((p: any) => p.name.toLowerCase().includes('villa'))) {
    return 'Villa ✨';
  }
  if (event.property_types?.some((p: any) => p.name.toLowerCase().includes('cottage'))) {
    return 'Cottage Stay ✨';
  }
  
  // Check pax size
  if (event.pax_size_keywords?.some((p: any) => p.name.toLowerCase().includes('group'))) {
    return 'Best for Groups ✨';
  }
  if (event.pax_size_keywords?.some((p: any) => p.name.toLowerCase().includes('couple') || p.name.toLowerCase().includes('1-2 pax'))) {
    return 'Perfect for Couples ✨';
  }
  
  // Check amenities
  if (event.amenities_keywords?.some((a: any) => a.name.toLowerCase().includes('pool'))) {
    return 'Poolside Stay ✨';
  }
  if (event.amenities_keywords?.some((a: any) => a.name.toLowerCase().includes('beach'))) {
    return 'Beachfront ✨';
  }
  if (event.amenities_keywords?.some((a: any) => a.name.toLowerCase().includes('ac'))) {
    return 'AC Rooms ✨';
  }
  
  // Check space info
  if (event.space_info_keywords?.some((s: any) => s.name.toLowerCase().includes('mountain'))) {
    return 'Mountain View ✨';
  }
  if (event.space_info_keywords?.some((s: any) => s.name.toLowerCase().includes('balcony'))) {
    return 'Balcony View ✨';
  }
  
  // Check features
  if (event.features_keywords?.some((f: any) => f.name.toLowerCase().includes('breakfast'))) {
    return 'Breakfast Included ✨';
  }
  
  // Default status
  return 'Featured ✨';
};

/**
 * Calculate average rating (mock for now, can be updated when rating API is available)
 */
const getPropertyRating = (): string => {
    // In a real implementation, this would come from reviews
    return (Math.random() * (5 - 4.5) + 4.5).toFixed(1);
};

/**
 * Format price from event phases
 */
const formatPrice = (event: Event): string => {
  // Check for event_lowest_price first (from API response)
  if (event.event_lowest_price && event.event_lowest_price > 0) {
    return `₹${event.event_lowest_price.toLocaleString('en-IN')} / Night`;
  }

  // Check phases_tickets (from API response) for price_per_day (for stays) or price_per_ticket (for events)
  if (event.phases_tickets && event.phases_tickets.length > 0) {
    const allTickets = event.phases_tickets.flatMap(phase => phase.ticket || []);
    if (allTickets.length > 0) {
      // For stay events, check price_per_day first
      const dayPrices = allTickets
        .map(t => t.price_per_day)
        .filter((p): p is number => p !== null && p !== undefined && p > 0);
      
      if (dayPrices.length > 0) {
        const minPrice = Math.min(...dayPrices);
        return `₹${minPrice.toLocaleString('en-IN')} / Night`;
      }

      // For event tickets, check price_per_ticket
      const ticketPrices = allTickets
        .map(t => t.price_per_ticket)
        .filter((p): p is number => p !== null && p !== undefined && p > 0);
      
      if (ticketPrices.length > 0) {
        const minPrice = Math.min(...ticketPrices);
        return `₹${minPrice.toLocaleString('en-IN')}`;
      }
    }
  }

  // Check legacy phases structure
  if (event.phases && event.phases.length > 0 && event.phases[0].tickets && event.phases[0].tickets.length > 0) {
    const allTickets = event.phases.flatMap(phase => phase.tickets);
    const prices = allTickets.map(t => t.price_per_ticket).filter(p => p > 0);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      return `₹${minPrice.toLocaleString('en-IN')} / Night`;
    }
  }

  // If no price is available, return a placeholder
  return 'Price on Request';
};

/**
 * Get location display string
 */
const getLocationString = (event: Event): string => {
  if (!event.location) {
    return 'Location not specified';
  }

  const { location_city, location_state } = event.location;
  
  if (location_city && location_state) {
    return `${location_city}, ${location_state}`;
  }
  
  return location_city || location_state || 'Location not specified';
};

/**
 * Transform Event to UIProperty
 */
export const transformEventToProperty = (event: Event): UIProperty => {
  // Ensure event has an ID, log a warning if not
  if (!event || !event.id) {
    console.error('⚠️ transformEventToProperty - Event missing ID:', event);
    console.error('⚠️ Event keys:', event ? Object.keys(event) : 'null/undefined');
  }
  
  const property = {
    id: event?.id || 'unknown',
    title: event?.event_title || event?.venue_name || 'Event',
    location: getLocationString(event),
    price: formatPrice(event),
    image: getPrimaryImage(event),
    status: getPropertyStatus(event),
    rating: getPropertyRating(),
  };
  
  console.log('✅ transformEventToProperty - Event ID:', event?.id);
  console.log('✅ transformEventToProperty - Property:', property);
  
  return property;
};

/**
 * Transform multiple Events to UIProperties
 */
export const transformEventsToProperties = (events: Event[]): UIProperty[] => {
  return events.map(transformEventToProperty);
};

/**
 * Filter events by category (event type)
 */
export const filterEventsByCategory = (events: Event[], category: string): Event[] => {
  console.log('🔍 filterEventsByCategory called with:', { eventsCount: events.length, category });
  
  if (!category || category.trim() === '') {
    return events;
  }

  const categoryLower = category.toLowerCase().trim();
  console.log('🔍 Filtering for category:', categoryLower);

  const filtered = events.filter(event => {
    // Handle event_type as string or object
    const eventTypeString = typeof event.event_type === 'string' 
      ? event.event_type 
      : event.event_type?.type_name || '';
    
    console.log('🔍 Event type for', event.event_title, ':', eventTypeString);
    
    // Direct match with event_type
    const eventTypeMatch = eventTypeString.toLowerCase() === categoryLower;
    
    // Partial match with event_type
    const eventTypePartialMatch = eventTypeString.toLowerCase().includes(categoryLower);
    
    // Match with event title
    const titleMatch = typeof event.event_title === 'string' && 
                      event.event_title.toLowerCase().includes(categoryLower);
    
    // Match with venue name
    const venueMatch = typeof event.venue_name === 'string' && 
                      event.venue_name.toLowerCase().includes(categoryLower);
    
    // Match with tags
    const tagsMatch = event.tags?.some(tag => 
      typeof tag.name === 'string' && tag.name.toLowerCase().includes(categoryLower)
    );
    
    // More flexible matching - check if any part of the category matches
    const flexibleMatch = categoryLower.split(' ').some(word => 
      (typeof event.event_title === 'string' && event.event_title.toLowerCase().includes(word)) ||
      eventTypeString.toLowerCase().includes(word) ||
      (typeof event.venue_name === 'string' && event.venue_name.toLowerCase().includes(word)) ||
      (event.tags?.some(tag => typeof tag.name === 'string' && tag.name.toLowerCase().includes(word)))
    );

    const matches = eventTypeMatch || eventTypePartialMatch || titleMatch || venueMatch || tagsMatch || flexibleMatch;
    
    if (matches) {
      console.log('✅ Match found:', event.event_title, 'with type:', eventTypeString);
    }
    
    return matches;
  });
  
  console.log('🔍 Filtered result:', filtered.length, 'events');
  return filtered;
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
};

/**
 * Calculate similarity between two strings (0-100%)
 * Uses multiple algorithms: exact match, substring, word matching, and Levenshtein distance
 */
const calculateStringSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // One contains the other (substring)
  if (s1.includes(s2) || s2.includes(s1)) return 85;
  
  // Calculate Levenshtein similarity for phonetic/spelling variations
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen > 0) {
    const distance = levenshteinDistance(s1, s2);
    const levenshteinSimilarity = ((maxLen - distance) / maxLen) * 100;
    
    // If strings are similar enough (e.g., "Kaziranga" vs "Kohora"), give good score
    if (levenshteinSimilarity >= 30) {
      return Math.min(levenshteinSimilarity + 10, 95); // Boost by 10%
    }
  }
  
  // Split into words and check word matches
  const words1 = s1.split(/[\s,]+/).filter(w => w.length > 2);
  const words2 = s2.split(/[\s,]+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Count matching words
  let matchingWords = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      // Exact word match
      if (word1 === word2) {
        matchingWords++;
        break;
      }
      
      // Check if words start with same prefix (at least 4 chars)
      if (word1.length >= 4 && word2.length >= 4) {
        const prefix = Math.min(4, word1.length, word2.length);
        if (word1.substring(0, prefix) === word2.substring(0, prefix)) {
          matchingWords += 0.8;
          break;
        }
      }
      
      // Partial word match (contains)
      if (word1.length >= 4 && word2.length >= 4) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matchingWords += 0.7;
          break;
        }
      }
      
      // Check Levenshtein for individual words
      if (word1.length >= 5 && word2.length >= 5) {
        const wordMaxLen = Math.max(word1.length, word2.length);
        const wordDistance = levenshteinDistance(word1, word2);
        const wordSimilarity = ((wordMaxLen - wordDistance) / wordMaxLen) * 100;
        
        if (wordSimilarity >= 50) {
          matchingWords += (wordSimilarity / 100) * 0.8;
          break;
        }
      }
    }
  }
  
  // Calculate percentage based on matching words
  const wordMatchScore = (matchingWords / Math.max(words1.length, words2.length)) * 80;
  return Math.min(wordMatchScore, 100);
};

/**
 * Known location aliases and related areas (case-insensitive)
 */
const locationAliases: { [key: string]: string[] } = {
  'kaziranga': ['kohora', 'bagori', 'agoratoli', 'kaziranga national park'],
  'kohora': ['kaziranga', 'kaziranga national park'],
  'goa': ['panaji', 'panjim', 'margao', 'vasco', 'calangute', 'baga', 'candolim'],
  'bangalore': ['bengaluru', 'blr'],
  'bengaluru': ['bangalore', 'blr'],
  'mumbai': ['bombay'],
  'bombay': ['mumbai'],
  'delhi': ['new delhi', 'ncr'],
  'kolkata': ['calcutta'],
  'calcutta': ['kolkata'],
  'chennai': ['madras'],
  'madras': ['chennai'],
};

/**
 * Check if two locations are related/aliases
 * DISABLED: Alias system turned off for more precise matching
 * Keeping function for potential future use with city aliases only (e.g., Bangalore/Bengaluru)
 */
const areLocationsRelated = (loc1: string, loc2: string, searchTerm: string): boolean => {
  // Alias system disabled - return false to use only fuzzy string matching
  // This ensures "Kohora" only matches "Kohora", not "Kaziranga"
  return false;
  
  /* DISABLED CODE - Can be re-enabled for specific city aliases if needed
  const l1 = loc1.toLowerCase().trim();
  const l2 = loc2.toLowerCase().trim();
  
  // Only match common city name aliases (e.g., Bangalore/Bengaluru)
  const cityAliases: { [key: string]: string[] } = {
    'bangalore': ['bengaluru', 'blr'],
    'bengaluru': ['bangalore', 'blr'],
    'mumbai': ['bombay'],
    'bombay': ['mumbai'],
    'kolkata': ['calcutta'],
    'calcutta': ['kolkata'],
  };
  
  if (cityAliases[l1]?.some(alias => l2 === alias)) {
    return true;
  }
  if (cityAliases[l2]?.some(alias => l1 === alias)) {
    return true;
  }
  */
};

/**
 * Calculate location match score for an event
 */
const calculateLocationScore = (event: Event, searchTerm: string): number => {
  const eventAny = event as any;
  
  // Get all location-related fields
  const locationCity = event.location?.location_city || eventAny.event_location?.location_city || '';
  const locationState = event.location?.location_state || eventAny.event_location?.location_state || '';
  const locationName = event.location?.location_name || eventAny.event_location?.location_name || '';
  const locationAddress = event.location?.location_address || eventAny.event_location?.location_address || '';
  const venueName = event.venue_name || eventAny.event_venue?.venue_name || '';
  const venueCity = eventAny.event_venue?.venue_city || '';
  
  // Check for related/alias locations first (only for general searches)
  const allLocationFields = [locationCity, locationState, locationName, locationAddress, venueName, venueCity];
  for (const field of allLocationFields) {
    if (field && areLocationsRelated(field, searchTerm, searchTerm)) {
      return 90; // High score for known related locations (only for general searches)
    }
  }
  
  // Calculate similarity for each field
  const scores = [
    calculateStringSimilarity(locationCity, searchTerm),
    calculateStringSimilarity(locationState, searchTerm),
    calculateStringSimilarity(locationName, searchTerm),
    calculateStringSimilarity(locationAddress, searchTerm),
    calculateStringSimilarity(venueName, searchTerm),
    calculateStringSimilarity(venueCity, searchTerm),
    // Also check combined location string
    calculateStringSimilarity(`${locationCity} ${locationState}`.trim(), searchTerm),
    calculateStringSimilarity(`${locationName} ${locationState}`.trim(), searchTerm),
    // Check with common separators
    calculateStringSimilarity(`${locationCity}, ${locationState}`.trim(), searchTerm),
  ];
  
  // Return the highest score
  return Math.max(...scores, 0);
};

/**
 * Search events by query with fuzzy matching
 * Matches locations with similarity score >= 40%
 * Uses Levenshtein distance and word matching for spelling variations and typos
 * Each location is matched independently - "Kohora" only matches "Kohora", not related areas
 */
export const searchEvents = (events: Event[], query: string): Event[] => {
  if (!query || query.trim() === '') {
    return events;
  }

  const searchTerm = query.toLowerCase().trim();
  console.log('🔍 searchEvents - Searching for:', searchTerm);
  
  // Minimum similarity threshold (40% match for precise results)
  // Higher threshold ensures "Kohora" doesn't match "Kaziranga"
  const SIMILARITY_THRESHOLD = 40;

  // Calculate scores for all events
  const eventsWithScores = events.map(event => {
    // Check event title (exact or substring match)
    const titleMatch = (typeof event.event_title === 'string' && event.event_title.toLowerCase().includes(searchTerm));
    
    // Calculate location similarity score
    const locationScore = calculateLocationScore(event, searchTerm);
    
    // Check tags
    const tagsMatch = event.tags?.some(tag => (typeof tag.name === 'string' && tag.name.toLowerCase().includes(searchTerm))) || false;
    
    // Combine scores (prioritize location matches)
    let finalScore = locationScore;
    if (titleMatch) finalScore = Math.max(finalScore, 60);
    if (tagsMatch) finalScore = Math.max(finalScore, 50);
    
    return {
      event,
      score: finalScore,
      locationScore
    };
  });

  // Filter events that meet the threshold and sort by score
  const filtered = eventsWithScores
    .filter(item => item.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .map(item => {
      const eventAny = item.event as any;
      const locationCity = item.event.location?.location_city || eventAny.event_location?.location_city || '';
      const locationState = item.event.location?.location_state || eventAny.event_location?.location_state || '';
      
      console.log(`✅ Match found (${Math.round(item.score)}%):`, item.event.event_title, '|', locationCity, locationState);
      return item.event;
    });

  console.log(`🔍 searchEvents - Found ${filtered.length} matches out of ${events.length} events (threshold: ${SIMILARITY_THRESHOLD}%)`);
  return filtered;
};

/**
 * Sort events by price
 */
export const sortEventsByPrice = (events: Event[], order: 'asc' | 'desc' = 'asc'): Event[] => {
  return [...events].sort((a, b) => {
    const priceA = a.phases?.[0]?.tickets?.[0]?.price_per_ticket || 0;
    const priceB = b.phases?.[0]?.tickets?.[0]?.price_per_ticket || 0;
    
    return order === 'asc' ? priceA - priceB : priceB - priceA;
  });
};

