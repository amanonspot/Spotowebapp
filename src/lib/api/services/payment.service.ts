/**
 * Payment API Service
 * Handles payment session creation and status checks
 */

import { api } from '../client';
import {
  PaymentSessionRequest,
  PaymentSessionResponse,
  PaymentStatusResponse,
} from '../types';

/**
 * Create payment session
 */
export const createPaymentSession = async (
  paymentData: PaymentSessionRequest
): Promise<PaymentSessionResponse> => {
  const response = await api.post<PaymentSessionResponse>(
    '/api/payment/session/',
    paymentData
  );
  return response;
};

/**
 * Get payment order status
 */
export const getPaymentOrderStatus = async (
  customerId: string,
  orderId: string
): Promise<any> => {
  const response = await api.get(
    `/api/payment/orders/?customer_id=${customerId}&order_id=${orderId}`
  );
  return response;
};

/**
 * Get final payment status
 */
export const getPaymentStatus = async (orderId: string): Promise<PaymentStatusResponse> => {
  const response = await api.get<PaymentStatusResponse>(
    `/api/payment/status/?order_id=${orderId}`
  );
  return response;
};

/**
 * Get payment model listing
 */
export const getPaymentModelListing = async (orderId: string): Promise<any[]> => {
  const response = await api.get<any[]>(`/api/payment/status/list/?order_id=${orderId}`);
  return response;
};

/**
 * Request refund
 */
export const requestRefund = async (refundData: {
  unique_request_id?: string;
  amount: number;
  order_id: string;
  customer_id: string;
}): Promise<any> => {
  const response = await api.post('/api/payment/refunds/', refundData);
  return response;
};

