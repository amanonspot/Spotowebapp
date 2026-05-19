/**
 * useAuth Hook
 * React hook for authentication operations
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { authService, userService } from '../api';
import { User } from '../api/types';
import { authAdapter, clearMockSession, setGuestSession } from '@/lib/adapters';
import { clearAuthIntent } from '@/lib/auth/authIntent';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const loadingUserDataRef = useRef(false);

  const resetSessionState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setUserDataLoaded(false);
    loadingUserDataRef.current = false;
  }, []);

  const syncAuthState = useCallback(() => {
    const session = authAdapter.getSession();
    const tokenAuthenticated = authService.isAuthenticated();
    const sessionTokenAuthenticated = Boolean(session.isAuthenticated && session.accessToken);
    const nextAuthenticated = Boolean(tokenAuthenticated || sessionTokenAuthenticated);
    setIsAuthenticated(nextAuthenticated);

    if (!nextAuthenticated) {
      resetSessionState();
    }
  }, [resetSessionState]);

  /**
   * Load user data from API
   */
  const loadUserData = useCallback(async (options?: { force?: boolean; strict?: boolean }) => {
    const force = options?.force === true;
    const strict = options?.strict === true;
    if (!force && (userDataLoaded || loadingUserDataRef.current)) return user; // Prevent multiple calls
    
    loadingUserDataRef.current = true;
    setLoading(true);
    try {
      const userData = await userService.getUserDetails();
      setUser(userData);
      setUserDataLoaded(true);
      return userData;
    } catch (err: any) {
      const status = err?.status;
      if (status === 401 || status === 403) {
        clearMockSession();
        authService.logout();
        resetSessionState();
        if (strict) {
          throw new Error('Session expired. Please sign in again.');
        }
      } else {
        setError(err?.message || 'Unable to load profile right now.');
        setUserDataLoaded(false);
        if (strict) {
          throw err instanceof Error ? err : new Error('Unable to load profile right now.');
        }
      }
    } finally {
      setLoading(false);
      loadingUserDataRef.current = false;
    }
    return null;
  }, [resetSessionState, user, userDataLoaded]);

  // Check authentication status on mount
  useEffect(() => {
    syncAuthState();
  }, [syncAuthState]);

  // Load profile after auth is resolved
  useEffect(() => {
    if (isAuthenticated && !user && !userDataLoaded && !loading) {
      loadUserData();
    }
  }, [isAuthenticated, user, userDataLoaded, loading, loadUserData]);

  // Listen for storage changes to update auth status
  useEffect(() => {
    const handleStorageChange = () => {
      syncAuthState();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncAuthState]);

  /**
   * Generate OTP for phone number
   */
  const requestOtp = useCallback(async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAdapter.requestOtp(phone);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate OTP';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify OTP
   */
  const verifyOtp = useCallback(async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAdapter.verifyOtp(otp);
      setUserDataLoaded(false);
      await loadUserData({ force: true, strict: true });
      syncAuthState();
      
      const activated = response.activatedListingsCount ?? 0;
      if (activated > 0) {
        toast.success(
          activated === 1
            ? 'Login successful! 1 listing from your field visit is now active.'
            : `Login successful! ${activated} listings from your field visits are now active.`
        );
      } else {
        toast.success('Login successful!');
      }
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to verify OTP';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserData, syncAuthState]);

  /**
   * Continue as guest
   */
  const continueAsGuest = useCallback(() => {
    setGuestSession();
    authService.logout();
    resetSessionState();
  }, [resetSessionState]);

  /**
   * Google Sign-in
   */
  const googleSignIn = useCallback(async (googleAccessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.googleSignIn(googleAccessToken);
      
      // Validate that both tokens are present in the response
      if (!response.access || !response.refresh) {
        throw new Error('Invalid response: Missing access or refresh token');
      }
      
      // Set authentication status after successful Google sign-in with valid tokens
      setUserDataLoaded(false);
      await loadUserData({ force: true, strict: true });
      syncAuthState();
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserData, syncAuthState]);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    clearMockSession();
    authService.logout();
    clearAuthIntent();
    resetSessionState();
    window.location.href = '/auth/login';
  }, [resetSessionState]);

  /**
   * Check if user is authenticated
   */
  const checkIsAuthenticated = () => {
    const session = authAdapter.getSession();
    return Boolean(authService.isAuthenticated() || (session.isAuthenticated && session.accessToken));
  };

  /**
   * Get current user ID
   */
  const getCurrentUserId = () => {
    return authService.getCurrentUserId();
  };

  return {
    loading,
    error,
    user,
    isAuthenticated,
    requestOtp,
    verifyOtp,
    generateOTP: requestOtp,
    verifyOTP: verifyOtp,
    googleSignIn,
    continueAsGuest,
    logout,
    checkIsAuthenticated,
    getCurrentUserId,
    loadUserData, // Export to allow manual refresh
    refreshUser: loadUserData, // Alias for clarity
  };
};

