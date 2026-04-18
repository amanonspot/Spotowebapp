/**
 * Event/Property API Service
 * Handles event listings, details, and related data
 */

import { api } from '../client';
import {
  Event,
  EventType,
  EventListingParams,
  EventDetailsParams,
  Location,
  Artist,
  Tag,
  Amenity,
} from '../types';

/**
 * Get event types
 */
export const getEventTypes = async (): Promise<EventType[]> => {
  const response = await api.get<EventType[]>('/api/event/type');
  return response;
};

/**
 * Get event listings with filters
 */
export const getEventListings = async (params: EventListingParams = {}): Promise<Event[]> => {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();
  
  // Match curl format: /api/event/listing/?location=...&start_date=...&end_date=...&min_guests=...
  const url = `/api/event/listing/${queryString ? `?${queryString}` : ''}`;
  
  console.log('🔍 API Call - getEventListings URL:', url);
  console.log('🔍 API Call - Params:', params);
  console.log('🔍 API Call - Query String:', queryString);
  console.log('🔍 API Call - Full Backend URL: https://production.api.spoto.in' + url);
  
  const response = await api.get<Event[]>(url);
  
  console.log('🔍 API Response - getEventListings count:', response?.length || 0);
  
  return response;
};

/**
 * Get event details by ID
 */
export const getEventDetails = async (eventId: string): Promise<Event> => {
  console.log('🔍 API Call - getEventDetails for eventId:', eventId);
  const response = await api.get<Event>(`/api/event/details/?event_id=${eventId}`);
  console.log('🔍 API Response - getEventDetails:', response);
  console.log('🔍 API Response - event_lowest_price:', response?.event_lowest_price);
  console.log('🔍 API Response - phases_tickets:', response?.phases_tickets);
  return response;
};

/**
 * Get recommended events
 */
export const getRecommendedEvents = async (): Promise<Event[]> => {
  const response = await api.get<Event[]>('/api/event/listing/?recommended=1');
  return response;
};

/**
 * Get event locations
 */
export const getEventLocations = async (locationId?: string): Promise<Location[]> => {
  const url = locationId 
    ? `/api/event/location?location_id=${locationId}`
    : '/api/event/location';
  const response = await api.get<Location[]>(url);
  return response;
};

/**
 * Create event location
 */
export const createEventLocation = async (locationData: Omit<Location, 'id'>): Promise<Location> => {
  const response = await api.post<Location>('/api/event/location/', locationData);
  return response;
};

/**
 * Get artists
 */
export const getArtists = async (artistId?: string): Promise<Artist[]> => {
  const url = artistId 
    ? `/api/artist/?artist_id=${artistId}`
    : '/api/artist/';
  const response = await api.get<Artist[]>(url);
  return response;
};

/**
 * Get tags
 */
export const getTags = async (tagId?: string): Promise<Tag[]> => {
  const url = tagId 
    ? `/api/event/tag/?tag_id=${tagId}`
    : '/api/event/tag/';
  const response = await api.get<Tag[]>(url);
  return response;
};

/**
 * Get amenities keywords
 */
export const getAmenities = async (amenityId?: string): Promise<Amenity[]> => {
  const url = amenityId 
    ? `/api/event/amenities-keywords/?amenities_id=${amenityId}`
    : '/api/event/amenities-keywords/';
  const response = await api.get<Amenity[]>(url);
  return response;
};

/**
 * Get essentials keywords
 */
export const getEssentials = async (essentialId?: string): Promise<Amenity[]> => {
  const url = essentialId 
    ? `/api/event/essentials-keywords/?Essentials_id=${essentialId}`
    : '/api/event/essentials-keywords/';
  const response = await api.get<Amenity[]>(url);
  return response;
};

/**
 * Get features keywords
 */
export const getFeatures = async (featureId?: string): Promise<Amenity[]> => {
  const url = featureId 
    ? `/api/event/features-keywords/?features_id=${featureId}`
    : '/api/event/features-keywords/';
  const response = await api.get<Amenity[]>(url);
  return response;
};

/**
 * Get property types
 */
export const getPropertyTypes = async (typeId?: string): Promise<{ id: string; name: string }[]> => {
  const url = typeId 
    ? `/api/event/property-types/?id=${typeId}`
    : '/api/event/property-types/';
  const response = await api.get<{ id: string; name: string }[]>(url);
  return response;
};

/**
 * Get pax size keywords
 */
export const getPaxSizeKeywords = async (): Promise<Amenity[]> => {
  const response = await api.get<Amenity[]>('/api/event/pax-size-keywords/');
  return response;
};

/**
 * Get space info keywords
 */
export const getSpaceInfoKeywords = async (): Promise<Amenity[]> => {
  const response = await api.get<Amenity[]>('/api/event/space-info-keywords/');
  return response;
};

/**
 * Get budget keywords
 */
export const getBudgetKeywords = async (): Promise<Amenity[]> => {
  const response = await api.get<Amenity[]>('/api/event/budget-keywords/');
  return response;
};

