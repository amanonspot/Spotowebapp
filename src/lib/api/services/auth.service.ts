/**
 * Authentication API Service
 * Handles login, OTP verification, and Google Sign-in
 */

import { api } from '../client';
import {
  LoginResponse,
  VerifyOTPResponse,
} from '../types';

type VerifyPayload = Partial<VerifyOTPResponse> & {
  success?: boolean;
  data?: Partial<VerifyOTPResponse>;
};

const normalizeVerifyPayload = (payload: VerifyPayload): VerifyOTPResponse => {
  const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  const access = typeof data.access === 'string' ? data.access : '';
  const refresh = typeof data.refresh === 'string' ? data.refresh : '';
  const message = typeof data.message === 'string' ? data.message : 'OTP verified successfully.';
  const userId = typeof data.user_id === 'string' && data.user_id.trim() ? data.user_id : undefined;
  const activatedRaw = data.activated_listings_count;
  const activatedListingsCount =
    typeof activatedRaw === 'number' && Number.isFinite(activatedRaw) ? Math.max(0, Math.floor(activatedRaw)) : undefined;

  if (!access || !refresh) {
    throw new Error('Unable to verify OTP right now. Please try again.');
  }

  return {
    access,
    refresh,
    message,
    user_id: userId,
    activated_listings_count: activatedListingsCount,
  };
};

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
  const payload = phone ? { otp, phone } : { otp };
  const response = await api.post<VerifyPayload>('/api/verify-otp/', payload);
  const normalized = normalizeVerifyPayload(response);

  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', normalized.access);
    localStorage.setItem('refresh_token', normalized.refresh);
    if (normalized.user_id) {
      localStorage.setItem('user_id', normalized.user_id);
    } else {
      localStorage.removeItem('user_id');
    }
    localStorage.setItem('isAuthenticated', 'true');
    // Set auth-token cookie so middleware can verify authentication server-side
    document.cookie = `auth-token=${normalized.access}; path=/; max-age=604800; SameSite=Strict`;
  }

  return normalized;
};

/**
 * Google Sign-in
 */
export const googleSignIn = async (googleAccessToken: string): Promise<VerifyOTPResponse> => {
  const response = await api.post<VerifyPayload>(
    '/api/google/user/',
    {},
    {
      headers: {
        'Google-Access-Token': googleAccessToken,
      },
    }
  );
  
  const normalized = normalizeVerifyPayload(response);
  
  // Store tokens in localStorage only if both tokens are present
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', normalized.access);
    localStorage.setItem('refresh_token', normalized.refresh);
    if (normalized.user_id) {
      localStorage.setItem('user_id', normalized.user_id);
    } else {
      localStorage.removeItem('user_id');
    }
    localStorage.setItem('isAuthenticated', 'true');
    // Set auth-token cookie so middleware can verify authentication server-side
    document.cookie = `auth-token=${normalized.access}; path=/; max-age=604800; SameSite=Strict`;
  }
  
  return normalized;
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
    // Clear auth-token cookie to align with middleware
    document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Strict';
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
  googleSignIn,
  logout,
  isAuthenticated,
  getCurrentUserId,
};

