/**
 * useBooking Hook
 * React hook for booking operations
 */

'use client';

import { useState } from 'react';
import { bookingService, paymentService } from '../api';
import { CreateBookingRequest, UpdateBookingRequest, Order } from '../api/types';

export const useBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  /**
   * Create a booking
   */
  const createBooking = async (
    eventId: string,
    bookingData: CreateBookingRequest
  ): Promise<Order> => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.createBooking(eventId, bookingData);
      setCurrentOrder(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update booking with visitor details
   */
  const updateBooking = async (
    eventId: string,
    bookingData: UpdateBookingRequest
  ): Promise<Order> => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.updateBooking(eventId, bookingData);
      setCurrentOrder(response);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to update booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get available tickets
   */
  const getEventTickets = async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.getEventTickets(eventId);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickets');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check ticket availability
   */
  const checkTicketAvailability = async (ticketId: string, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingService.checkTicketAvailability(ticketId, quantity);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to check ticket availability');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiate payment
   */
  const initiatePayment = async (orderId: string, userId: string, email: string, phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.createPaymentSession({
        amount: 0, // Amount will be calculated by backend
        order_id: orderId,
        customer_id: userId,
        customer_email: email,
        customer_phone: phone,
        payment_page_client_id: 'spoto',
        action: 'paymentPage',
      });
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check payment status
   */
  const checkPaymentStatus = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.getPaymentStatus(orderId);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to check payment status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    currentOrder,
    createBooking,
    updateBooking,
    getEventTickets,
    checkTicketAvailability,
    initiatePayment,
    checkPaymentStatus,
  };
};

