/**
 * useUser Hook
 * React hook for user profile operations
 */

'use client';

import { useState, useEffect } from 'react';
import { userService } from '../api';
import { UserDetailsResponse, UpdateUserRequest, UserBooking } from '../api/types';

export const useUser = (autoFetch = false) => {
  const [user, setUser] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user details
   */
  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getUserDetails();
      setUser(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateUser = async (userId: string, userData: UpdateUserRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.updateUser(userId, userData);
      setUser(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete user account
   */
  const deleteUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.deleteUser();
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchUserDetails();
    }
  }, [autoFetch]);

  return {
    user,
    loading,
    error,
    fetchUserDetails,
    updateUser,
    deleteUser,
    refetch: fetchUserDetails,
  };
};

/**
 * useUserBookings Hook
 * Hook for fetching user bookings
 */
export const useUserBookings = (userId?: string) => {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedFetch, setHasTriedFetch] = useState(false);

  /**
   * Fetch user bookings
   */
  const fetchUserBookings = async (id: string) => {
    if (loading) return; // Prevent multiple simultaneous calls
    
    setLoading(true);
    setError(null);
    try {
      console.log('useUserBookings: Fetching bookings for user:', id);
      const response = await userService.getUserBookings(id);
      console.log('useUserBookings: Bookings response:', response);
      setBookings(response || []);
      setHasTriedFetch(true);
      return response;
    } catch (err: any) {
      console.error('useUserBookings: Error fetching bookings:', {
        message: err?.message,
        status: err?.status,
        response: err?.response?.data,
        userId: id
      });
      
      // Handle 404 error gracefully - API endpoint might not exist yet
      if (err?.status === 404) {
        console.log('useUserBookings: User bookings endpoint not available (404), setting empty bookings');
        setError(null); // Don't show error for 404
        setBookings([]);
      } else {
        setError(err.message || 'Failed to fetch user bookings');
        setBookings([]);
      }
      setHasTriedFetch(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if userId provided and haven't tried yet
  useEffect(() => {
    if (userId && !hasTriedFetch) {
      fetchUserBookings(userId);
    }
  }, [userId, hasTriedFetch]);

  return {
    bookings,
    loading,
    error,
    fetchUserBookings,
    refetch: () => userId && fetchUserBookings(userId),
  };
};

