/**
 * useAuth Hook
 * React hook for authentication operations
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { authService, userService } from '../api';
import { VerifyOTPResponse, User } from '../api/types';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const loadingUserDataRef = useRef(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = authService.isAuthenticated();
      setIsAuthenticated(authStatus);
      
      if (authStatus && !user && !userDataLoaded && !loading) {
        // Load user data if authenticated and user data not already loaded
        loadUserData();
      }
    };

    checkAuthStatus();
  }, []); // Only run once on mount

  // Listen for storage changes to update auth status
  useEffect(() => {
    const handleStorageChange = () => {
      const authStatus = authService.isAuthenticated();
      setIsAuthenticated(authStatus);
      
      if (!authStatus) {
        setUser(null);
        setUserDataLoaded(false);
        loadingUserDataRef.current = false;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Load user data from API
   */
  const loadUserData = async () => {
    if (userDataLoaded || loading || loadingUserDataRef.current) return; // Prevent multiple calls
    
    loadingUserDataRef.current = true;
    setLoading(true);
    try {
      console.log('Loading user data...');
      const userData = await userService.getUserDetails();
      console.log('User data loaded:', userData);
      setUser(userData);
      setUserDataLoaded(true);
    } catch (err: any) {
      console.error('Failed to load user data:', {
        message: err?.message || 'Unknown error',
        status: err?.status,
        response: err?.response?.data
      });
      // If user data loading fails, clear auth state
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setUserDataLoaded(true);
      window.location.href = '/auth/login';
    } finally {
      setLoading(false);
      loadingUserDataRef.current = false;
    }
  };

  /**
   * Generate OTP for phone number
   */
  const generateOTP = async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Generating OTP for phone:', phone);
      const response = await authService.generateOTP(phone);
      console.log('OTP generation response:', response);
      // Removed toast.success - using inline notification in form instead
      return response;
    } catch (err: any) {
      console.error('OTP generation error:', err);
      const errorMessage = err.message || 'Failed to generate OTP';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP
   */
  const verifyOTP = async (otp: string): Promise<VerifyOTPResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log('Verifying OTP:', otp);
      const response = await authService.verifyOTP(otp);
      console.log('OTP verification response:', response);
      
      // Validate that both tokens are present in the response
      if (!response.access || !response.refresh) {
        throw new Error('Invalid response: Missing access or refresh token');
      }
      
      // Only set authentication status after successful OTP verification with valid tokens
      setIsAuthenticated(true);
      
      // Load user data after successful authentication
      await loadUserData();
      
      toast.success('Login successful!');
      return response;
    } catch (err: any) {
      console.error('OTP verification error:', {
        message: err?.message || 'Unknown error',
        status: err?.status,
        response: err?.response,
        stack: err?.stack,
        otp: otp ? 'Present' : 'Missing'
      });
      const errorMessage = err.message || 'Failed to verify OTP';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Google Sign-in
   */
  const googleSignIn = async (googleAccessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.googleSignIn(googleAccessToken);
      
      // Validate that both tokens are present in the response
      if (!response.access || !response.refresh) {
        throw new Error('Invalid response: Missing access or refresh token');
      }
      
      // Set authentication status after successful Google sign-in with valid tokens
      setIsAuthenticated(true);
      
      // Load user data after successful authentication
      await loadUserData();
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setUserDataLoaded(false);
    loadingUserDataRef.current = false;
    window.location.href = '/auth/login';
  };

  /**
   * Check if user is authenticated
   */
  const checkIsAuthenticated = () => {
    return authService.isAuthenticated();
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
    generateOTP,
    verifyOTP,
    googleSignIn,
    logout,
    checkIsAuthenticated,
    getCurrentUserId,
    loadUserData, // Export to allow manual refresh
    refreshUser: loadUserData, // Alias for clarity
  };
};

