/**
 * useWishlist Hook
 * React hook for wishlist operations
 */

'use client';

import { useState, useEffect } from 'react';
import * as wishlistService from '../api/services/wishlist.service';

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  // Load wishlist on mount
  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    const items = wishlistService.getWishlistEventIds();
    setWishlistItems(items);
  };

  const addToWishlist = (eventId: string) => {
    wishlistService.addToWishlist(eventId);
    loadWishlist();
  };

  const removeFromWishlist = (eventId: string) => {
    wishlistService.removeFromWishlist(eventId);
    loadWishlist();
  };

  const isInWishlist = (eventId: string): boolean => {
    return wishlistItems.includes(eventId);
  };

  const toggleWishlist = (eventId: string) => {
    if (isInWishlist(eventId)) {
      removeFromWishlist(eventId);
    } else {
      addToWishlist(eventId);
    }
  };

  const clearWishlist = () => {
    wishlistService.clearWishlist();
    setWishlistItems([]);
  };

  return {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
  };
};

