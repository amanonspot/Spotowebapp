/**
 * Authentication API Service
 * Handles login, OTP verification, and Google Sign-in
 */

import { api } from '../client';
import {
  LoginResponse,
  VerifyOTPResponse,
} from '../types';

/**
 * Generate OTP for phone login
 */
export const generateOTP = async (phone: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/login/', { phone });
  return response;
};

/**
 * Generate OTP for email login
 */
export const generateEmailOTP = async (email: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/login-email/', { email });
  return response;
};

/**
 * Verify OTP and get access token
 */
export const verifyOTP = async (otp: string, phone?: string): Promise<VerifyOTPResponse> => {
  try {
    const payload = phone ? { otp, phone } : { otp };
    const response = await api.post<VerifyOTPResponse>('/api/verify-otp/', payload);
    
    // Validate response structure - ensure both access and refresh tokens are present
    if (!response.access || !response.refresh) {
      throw new Error('Unable to verify OTP right now. Please try again.');
    }
    
    // Store tokens in localStorage only if both tokens are present
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user_id', response.user_id);
      localStorage.setItem('isAuthenticated', 'true');
    }
    
    return response;
  } catch (error: unknown) {
    throw error;
  }
};

/**
 * Verify OTP for listing flow.
 * Keeps existing login flow untouched while allowing owner listing OTP checks.
 */
export const verifyListingOTP = async (otp: string, phone: string): Promise<boolean> => {
  const response = await api.post<Partial<VerifyOTPResponse> | Record<string, unknown>>('/api/verify-otp/', { otp, phone });

  // Backend may rotate tokens on successful OTP verification. Persist if present.
  if (typeof window !== 'undefined' && response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    const access = typeof record.access === 'string' ? record.access : '';
    const refresh = typeof record.refresh === 'string' ? record.refresh : '';
    const userId = typeof record.user_id === 'string' ? record.user_id : '';

    if (access) localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
    if (userId) localStorage.setItem('user_id', userId);
    if (access || refresh) localStorage.setItem('isAuthenticated', 'true');
  }

  return true;
};

/**
 * Google Sign-in
 */
export const googleSignIn = async (googleAccessToken: string): Promise<VerifyOTPResponse> => {
  const response = await api.post<VerifyOTPResponse>(
    '/api/google/user/',
    {},
    {
      headers: {
        'Google-Access-Token': googleAccessToken,
      },
    }
  );
  
  // Validate response structure - ensure both access and refresh tokens are present
  if (!response.access || !response.refresh) {
    throw new Error('Unable to complete Google sign-in. Please try again.');
  }
  
  // Store tokens in localStorage only if both tokens are present
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    localStorage.setItem('user_id', response.user_id);
    localStorage.setItem('isAuthenticated', 'true');
  }
  
  return response;
};

/**
 * Logout - clear local storage
 */
export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('isAuthenticated');
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    return !!token;
  }
  return false;
};

/**
 * Get current user ID
 */
export const getCurrentUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user_id');
  }
  return null;
};

// Export auth service object
export const authService = {
  generateOTP,
  generateEmailOTP,
  verifyOTP,
  verifyListingOTP,
  googleSignIn,
  logout,
  isAuthenticated,
  getCurrentUserId,
};

