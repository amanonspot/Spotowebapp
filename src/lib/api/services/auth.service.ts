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
  console.log('API: Generating OTP for phone:', phone);
  const response = await api.post<LoginResponse>('/api/login/', { phone });
  console.log('API: OTP generation response:', response);
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
    console.log('API: Verifying OTP:', otp);
    const payload = phone ? { otp, phone } : { otp };
    const response = await api.post<VerifyOTPResponse>('/api/verify-otp/', payload);
    console.log('API: OTP verification response:', response);
    
    // Validate response structure - ensure both access and refresh tokens are present
    if (!response.access || !response.refresh) {
      const error = new Error('Invalid response: Missing access or refresh token');
      console.error('API: Invalid OTP verification response:', response);
      throw error;
    }
    
    // Store tokens in localStorage only if both tokens are present
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user_id', response.user_id);
      localStorage.setItem('isAuthenticated', 'true');
      console.log('API: Tokens stored in localStorage successfully');
    }
    
    return response;
  } catch (error: any) {
    console.error('API: OTP verification failed:', {
      message: error?.message || 'Unknown error',
      status: error?.status,
      response: error?.response,
      otp: otp ? 'Present' : 'Missing'
    });
    throw error;
  }
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
    const error = new Error('Invalid response: Missing access or refresh token');
    console.error('API: Invalid Google sign-in response:', response);
    throw error;
  }
  
  // Store tokens in localStorage only if both tokens are present
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    localStorage.setItem('user_id', response.user_id);
    localStorage.setItem('isAuthenticated', 'true');
    console.log('API: Google sign-in tokens stored in localStorage successfully');
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
  googleSignIn,
  logout,
  isAuthenticated,
  getCurrentUserId,
};

