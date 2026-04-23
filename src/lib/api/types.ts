/**
 * API Type Definitions
 * TypeScript interfaces for API requests and responses
 */

// ==================== Authentication Types ====================

export interface LoginRequest {
  phone: string;
}

export interface LoginResponse {
  message: string;
  user_id?: string;
}

export interface VerifyOTPRequest {
  otp: string;
  phone?: string;
}

export interface VerifyOTPResponse {
  access: string;
  refresh: string;
  user_id: string;
  message: string;
}

export interface GoogleSignInHeaders {
  'Google-Access-Token': string;
}

// ==================== User Types ====================

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  dob?: string;
  profile_pic?: string;
  city?: string;
  is_owner?: boolean;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  address?: string;
  dob?: string;
  profile_pic?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UserDetailsResponse extends User {
  // Add any additional fields returned by the API
}

// ==================== Event/Property Types ====================

export interface EventType {
  id: string;
  type_name: string;
  is_time_required: boolean;
  is_date_required: boolean;
  is_per_day_pricing?: boolean;
  is_per_ticket_pricing?: boolean;
}

export interface Location {
  id: string;
  location_name: string;
  location_address: string;
  location_city: string;
  location_state: string;
  location_country: string;
  location_pincode: string;
}

export interface Artist {
  id: string;
  full_name: string;
  profile_pic?: string;
  details?: string;
  social_links?: Record<string, string>;
  spotify_stream?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Amenity {
  id: string;
  name: string;
}

export interface EventMedia {
  id: string;
  media_file: string;
  media_type: 'image' | 'video';
  is_deleted: boolean;
  is_hidden: boolean;
  media_priority_ranking: number;
}

export interface EventPhase {
  id: string;
  phase_name: string;
  tickets: EventPhaseTicket[];
}

export interface EventPhaseTicket {
  id: string;
  ticket_name: string;
  ticket_description: string;
  price_per_ticket: number;
  available_qty: number;
  sale_start_datetime: string;
  sale_end_datetime: string;
}

export interface Event {
  id: string;
  company_name: string;
  event_type: string | EventType; // Can be string or object
  event_title: string;
  event_details: string;
  venue_name: string;
  location: Location;
  longitude?: string;
  latitude?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  allow_date_range?: boolean;
  min_days?: number;
  max_days?: number;
  tags: Tag[];
  amenities_keywords?: Amenity[];
  essentials_keywords?: Amenity[];
  features_keywords?: Amenity[];
  pax_size_keywords?: Amenity[];
  space_info_keywords?: Amenity[];
  budget_keywords?: Amenity[];
  artists: Artist[];
  media?: EventMedia[];
  phases?: EventPhase[];
  phases_tickets?: any[]; // API returns this instead of phases
  event_media?: any; // API returns this instead of media
  vendor: string | any; // Can be string or object
  event_status: 'draft' | 'published' | 'cancelled';
  // Additional fields from API response
  venue?: any;
  event_gallery?: any;
  event_lowest_price?: number;
  ticket_buyers?: any[];
  property_types?: any;
  display_image?: string;
}

export interface EventListingParams {
  event_type?: string;
  start_date?: string;
  end_date?: string;  // Added from Postman collection
  min_guests?: number;  // Added from Postman collection
  location?: string;  // Location name (e.g., "kaziranga, india")
  location_id?: string;
  event_status?: string;
  tags?: string;  // Comma-separated tag IDs
  sort?: string;
  recommended?: number;
  limit?: string;
}

export interface EventDetailsParams {
  event_id: string;
}

// ==================== Booking Types ====================

export interface BookingTicket {
  event_phase_ticket_id: string;
  ticket_name: string;
  phase_id: string;
  qty: number;
  // Required for per_day_pricing events
  user_selected_start_date?: string;
  user_selected_end_date?: string;
  // Optional for events requiring time
  user_selected_start_time?: string;
  user_selected_end_time?: string;
}

export interface CreateBookingRequest {
  user_id: string;
  subtotal_amount: number;
  total_discount: number;
  amount: number;
  billing_address: string;
  tickets: BookingTicket[];
  email: string;
  phone: string;
  name: string;
}

export interface UpdateBookingRequest {
  order_id: string;
  visitors: Visitor[];
  booking_status: 'Pending' | 'Completed' | 'Cancelled';
  user_selected_start_datetime?: string;
  user_selected_end_datetime?: string;
  user_selected_start_time?: string;
  user_selected_end_time?: string;
  user_selected_start_date?: string;
  user_selected_end_date?: string;
  is_paid: boolean;
}

export interface Visitor {
  visitor_first_name: string;
  visitor_last_name: string;
  visitor_email: string;
  visitor_age: number;
  event_phase_ticket_id: string;
  ticket_name: string;
  phase_id: string;
  visitor_phone: string;
}

export interface OrderMetadata {
  amount: number;
  subtotal_amount: number;
  sub_total_amount: number;
  total_discount: number;
  platform_fee: number;
  service_charge: number;
  delivery_charge: number;
  cgst_amount: number;
  sgst_amount: number;
  tds_amount: number;
  cess_amount: number;
  total_tax: number;
  order_id: string;
  event_id: string;
  customer_id: string;
  customer_phone: string;
  customer_email: string;
  payment_page_client_id: string;
  action: string;
  is_paid: boolean;
  booking_status: string;
  created_at: string;
}

export interface Order {
  id: string;
  success: boolean;
  qr?: string | null;
  metadata: OrderMetadata;
  billing_breakdown: any[];
  coupon_code?: string | null;
  billing_summary: any;
  user_id?: string;
  event_id: string;
  subtotal_amount?: number;
  total_discount?: number;
  amount?: number;
  billing_address?: string;
  booking_status?: string;
  is_paid?: boolean;
  created_at?: string;
  order_details?: any[];
}

export interface UserBooking {
  order: Order;
  event: Event;
  visitors: Visitor[];
}

export interface PaymentSessionRequest {
  amount: number;
  order_id: string;
  customer_id: string;
  customer_phone: string;
  customer_email: string;
  payment_page_client_id: string;
  action: 'paymentPage';
}

export interface PaymentSessionResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    id: string;
    order_id: string;
    payment_links: {
      web: string;
      expiry: string | null;
    };
    sdk_payload: {
      requestId: string;
      service: string;
      payload: {
        clientId: string;
        customerId: string;
        orderId: string;
        returnUrl: string;
        currency: string;
        customerEmail: string;
        customerPhone: string;
        service: string;
        description: string;
        environment: string;
        merchantId: string;
        amount: string;
        clientAuthTokenExpiry: string;
        clientAuthToken: string;
        action: string;
        udf1: string;
        collectAvsInfo: boolean;
      };
      currTime: string;
    };
  };
}

export interface PaymentStatusResponse {
  status: 'CHARGED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  order_id: string;
  amount: number;
  txn_id?: string;
  payment_method?: string;
}

// ==================== Insights Types ====================

export interface EventInsights {
  total_tickets_sold: number;
  total_revenue: number;
  total_visitors: number;
  checked_in_visitors: number;
  pending_visitors: number;
  cancelled_bookings: number;
}

export interface OverallInsights extends EventInsights {
  total_events: number;
  active_events: number;
  draft_events: number;
}

