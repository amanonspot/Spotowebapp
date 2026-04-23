/**
 * User API Service
 * Handles user profile, updates, and bookings
 */

import { api } from '../client';
import {
  UpdateUserRequest,
  UserDetailsResponse,
  UserBooking,
} from '../types';

/**
 * Get user details
 */
export const getUserDetails = async (): Promise<UserDetailsResponse> => {
  const response = await api.get<UserDetailsResponse | { success: true; data: UserDetailsResponse }>('/api/user/details/');
  if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response) {
    return response.data;
  }
  return response as UserDetailsResponse;
};

/**
 * Update user profile
 */
export const updateUser = async (
  userId: string,
  userData: UpdateUserRequest
): Promise<UserDetailsResponse> => {
  const response = await api.patch<UserDetailsResponse>(
    `/api/user/update/?user_id=${userId}`,
    userData
  );
  return response;
};

/**
 * Delete user account
 */
export const deleteUser = async (): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>('/api/user/delete/');
    return response;
  } catch (error: any) {
    // Handle specific database errors with user-friendly messages
    if (error?.message && error.message.includes('mediahandler_mediaservemodel')) {
      const detailedError = new Error('Account deletion failed due to a backend database issue. Please contact support for assistance.');
      (detailedError as any).status = error?.status;
      throw detailedError;
    }
    
    throw error;
  }
};

/**
 * Update user city
 */
export const updateUserCity = async (userId: string): Promise<any> => {
  const formData = new FormData();
  formData.append('user_id', userId);
  
  const response = await api.patch(`/api/city/?user_id=${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

/**
 * Get user bookings
 */
export const getUserBookings = async (userId: string): Promise<UserBooking[]> => {
  try {
    const response = await api.get<UserBooking[]>(`/api/user-bookings/?user_id=${userId}`);
    return response;
  } catch (error: any) {
    // Handle 404 error gracefully - endpoint might not be implemented yet or no bookings found
    if (error?.status === 404) {
      return [];
    }
    
    throw error;
  }
};

