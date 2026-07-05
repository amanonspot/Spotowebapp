/**
 * useUser Hook
 * React hook for user profile operations
 */

'use client';

import { useState, useEffect } from 'react';
import { userService } from '../api';
import { UserDetailsResponse, UpdateUserRequest } from '../api/types';

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



