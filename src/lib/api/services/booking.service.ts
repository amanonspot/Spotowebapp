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
    const response = await api.post<Order>(`/api/book/?event_id=${eventId}`, bookingData);
    return response;
  } catch (error: any) {
    // Handle specific database errors
    if (error.message && error.message.includes('paymenthandler_paymentsettingsmodel')) {
      const detailedError = new Error('Payment system is currently unavailable. Please try again shortly.');
      throw detailedError;
    }
    
    // Handle billing calculation errors
    if (error.message && error.message.includes('Billing calculation failed')) {
      const detailedError = new Error('Unable to process payment at this time. Please try again later or contact support.');
      throw detailedError;
    }
    
    // Handle empty error objects
    if (!error.message || error.message === '{}' || Object.keys(error).length === 0) {
      const detailedError = new Error('Booking request failed. The server did not provide error details. Please check your connection and try again.');
      throw detailedError;
    }
    
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
 * Backward-compatible alias used by my-bookings page
 */
export const getUserBookings = async (userId: string): Promise<any[]> => {
  return getUserTickets(userId);
};

/**
 * Initiate payment session (Step 3)
 */
export const initiatePaymentSession = async (
  paymentData: PaymentSessionRequest
): Promise<PaymentSessionResponse> => {
  const response = await api.post<PaymentSessionResponse>('/api/payment/session/', paymentData);
  return response;
};

/**
 * Get booking details by booking ID
 */
export const getBookingDetails = async (bookingId: string): Promise<any> => {
  const response = await api.get<any>(`/api/booking-details/${bookingId}/`);
  return response;
};
