/**
 * Booking API Service
 * Handles ticket booking and order management
 */

import { api } from '../client';
import {
  CreateBookingRequest,
  UpdateBookingRequest,
  Order,
  EventPhaseTicket,
  PaymentSessionRequest,
  PaymentSessionResponse,
} from '../types';

/**
 * Get available tickets for an event
 */
export const getEventTickets = async (eventId: string): Promise<EventPhaseTicket[]> => {
  const response = await api.get<EventPhaseTicket[]>(`/api/book?event_id=${eventId}`);
  return response;
};

/**
 * Create a booking (Step 1)
 */
export const createBooking = async (
  eventId: string,
  bookingData: CreateBookingRequest
): Promise<Order> => {
  try {
    console.log('📦 Creating booking for event:', eventId);
    console.log('📦 Booking data:', JSON.stringify(bookingData, null, 2));
    
    const response = await api.post<Order>(`/api/book/?event_id=${eventId}`, bookingData);
    
    console.log('✅ Booking creation successful:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Booking creation error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      status: error.status,
      errors: error.errors,
      response: error.response
    });
    
    // Handle specific database errors
    if (error.message && error.message.includes('paymenthandler_paymentsettingsmodel')) {
      const detailedError = new Error('Payment system configuration is incomplete. The backend team needs to set up the payment handler database tables. Please contact support.');
      console.error('❌ Payment handler error:', detailedError.message);
      throw detailedError;
    }
    
    // Handle billing calculation errors
    if (error.message && error.message.includes('Billing calculation failed')) {
      const detailedError = new Error('Unable to process payment at this time. Please try again later or contact support.');
      console.error('❌ Billing calculation error:', detailedError.message);
      throw detailedError;
    }
    
    // Handle empty error objects
    if (!error.message || error.message === '{}' || Object.keys(error).length === 0) {
      const detailedError = new Error('Booking request failed. The server did not provide error details. Please check your connection and try again.');
      console.error('❌ Empty error object:', detailedError.message);
      throw detailedError;
    }
    
    // Re-throw other errors with enhanced logging
    console.error('❌ Unhandled booking error:', error);
    throw error;
  }
};

/**
 * Update booking with visitor details (Step 2)
 */
export const updateBooking = async (
  eventId: string,
  bookingData: UpdateBookingRequest
): Promise<Order> => {
  const response = await api.put<Order>(`/api/order-update/?event_id=${eventId}`, bookingData);
  return response;
};

/**
 * Check ticket availability
 */
export const checkTicketAvailability = async (
  ticketId: string,
  quantity: number
): Promise<{ available: boolean; message: string }> => {
  const response = await api.post<any>(
    '/api/check-tickets/',
    {
      ticket_id: ticketId,
      quantity: quantity,
    }
  );
  
  console.log('Availability API response:', response);
  
  // Parse the nested response structure
  if (response.results && response.results.success) {
    const message = response.results.message;
    return {
      available: message.status === 'available',
      message: message.message || `Tickets ${message.status === 'available' ? 'available' : 'not available'}`
    };
  }
  
  // Fallback for unexpected response structure
  return {
    available: false,
    message: 'Unable to check ticket availability'
  };
};

/**
 * Get visitor details for an order
 */
export const getVisitorDetails = async (orderId: string): Promise<any[]> => {
  const response = await api.get<any[]>(`/api/visitors/?orderid=${orderId}`);
  return response;
};

/**
 * Update visitor check-in status
 */
export const updateVisitorCheckIn = async (visitorData: {
  visitor_id: string;
  visitor_age?: number;
  visitor_checked_in?: boolean;
  visitor_checkin_time?: string;
  visitor_checkout_time?: string;
  is_visitor_cancelled?: boolean;
  is_visitor_blocked?: boolean;
}): Promise<any> => {
  const response = await api.put('/api/visitors/', visitorData);
  return response;
};

/**
 * Get user tickets
 */
export const getUserTickets = async (userId: string): Promise<any[]> => {
  const response = await api.get<any[]>(`/api/tickets/?user_id=${userId}`);
  return response;
};

/**
 * Initiate payment session (Step 3)
 */
export const initiatePaymentSession = async (
  paymentData: PaymentSessionRequest
): Promise<PaymentSessionResponse> => {
  console.log('Initiating payment session with data:', paymentData);
  const response = await api.post<PaymentSessionResponse>(
    '/api/payment/session/',
    paymentData,
    {
      headers: {
        'Authorization': 'Basic Og=='
      }
    }
  );
  console.log('Payment session response:', response);
  return response;
};

/**
 * Get user bookings
 */
export const getUserBookings = async (userId: string): Promise<any[]> => {
  console.log('📋 getUserBookings - Fetching for userId:', userId);
  const url = `/api/tickets/?user_id=${userId}`;
  console.log('📋 getUserBookings - API URL:', url);
  
  const response = await api.get<any[]>(url);
  
  console.log('📋 getUserBookings - Response:', response);
  console.log('📋 getUserBookings - Response type:', typeof response);
  console.log('📋 getUserBookings - Is array:', Array.isArray(response));
  
  return response;
};

/**
 * Get booking details by booking ID
 */
export const getBookingDetails = async (bookingId: string): Promise<any> => {
  const response = await api.get<any>(`/api/booking-details/${bookingId}/`);
  return response;
};

