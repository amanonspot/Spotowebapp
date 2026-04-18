/**
 * User API Service
 * Handles user profile, updates, and bookings
 */

import { api } from '../client';
import {
  User,
  UpdateUserRequest,
  UserDetailsResponse,
  UserBooking,
} from '../types';

/**
 * Get user details
 */
export const getUserDetails = async (): Promise<UserDetailsResponse> => {
  try {
    console.log('Fetching user details...');
    const response = await api.get<UserDetailsResponse>('/api/user/details');
    console.log('User details response:', response);
    return response;
  } catch (error: any) {
    console.error('Error in getUserDetails service:', {
      message: error?.message,
      status: error?.status,
      response: error?.response?.data
    });
    throw error;
  }
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
    console.error('Error in deleteUser service:', {
      message: error?.message,
      status: error?.status,
      response: error?.response?.data
    });
    
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
    console.log('Fetching bookings for user:', userId);
    const response = await api.get<UserBooking[]>(`/api/user-bookings/?user_id=${userId}`);
    console.log('Bookings response:', response);
    return response;
  } catch (error: any) {
    console.error('Error in getUserBookings service:', {
      message: error?.message,
      status: error?.status,
      response: error?.response?.data,
      userId
    });
    
    // Handle 404 error gracefully - endpoint might not be implemented yet or no bookings found
    if (error?.status === 404) {
      console.log('User bookings endpoint not available (404), returning empty array');
      return [];
    }
    
    throw error;
  }
};

