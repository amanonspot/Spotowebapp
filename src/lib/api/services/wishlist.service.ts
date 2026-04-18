/**
 * Wishlist Service
 * Handles wishlist/favorites management
 * Note: This is a client-side implementation using localStorage
 * Can be replaced with API calls when backend support is added
 */

export interface WishlistItem {
  eventId: string;
  addedAt: string;
}

const WISHLIST_KEY = 'spoto_wishlist';

/**
 * Get wishlist from localStorage
 */
export const getWishlist = (): WishlistItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const wishlist = localStorage.getItem(WISHLIST_KEY);
    return wishlist ? JSON.parse(wishlist) : [];
  } catch (error) {
    console.error('Error reading wishlist:', error);
    return [];
  }
};

/**
 * Add item to wishlist
 */
export const addToWishlist = (eventId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const wishlist = getWishlist();
    
    // Check if already in wishlist
    if (wishlist.some(item => item.eventId === eventId)) {
      return;
    }
    
    wishlist.push({
      eventId,
      addedAt: new Date().toISOString(),
    });
    
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  } catch (error) {
    console.error('Error adding to wishlist:', error);
  }
};

/**
 * Remove item from wishlist
 */
export const removeFromWishlist = (eventId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const wishlist = getWishlist();
    const filtered = wishlist.filter(item => item.eventId !== eventId);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from wishlist:', error);
  }
};

/**
 * Check if item is in wishlist
 */
export const isInWishlist = (eventId: string): boolean => {
  const wishlist = getWishlist();
  return wishlist.some(item => item.eventId === eventId);
};

/**
 * Clear entire wishlist
 */
export const clearWishlist = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(WISHLIST_KEY);
  } catch (error) {
    console.error('Error clearing wishlist:', error);
  }
};

/**
 * Get wishlist event IDs
 */
export const getWishlistEventIds = (): string[] => {
  const wishlist = getWishlist();
  return wishlist.map(item => item.eventId);
};

