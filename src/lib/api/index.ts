/**
 * API Services Index
 * Central export point for all API services
 */

// Export API client
export { default as apiClient, api, apiFormData } from './client';

// Export types
export * from './types';

// Export services
export * as authService from './services/auth.service';
export * as userService from './services/user.service';
export * as eventService from './services/event.service';
export * as bookingService from './services/booking.service';
export * as paymentService from './services/payment.service';
export * as insightsService from './services/insights.service';
export * as wishlistService from './services/wishlist.service';

