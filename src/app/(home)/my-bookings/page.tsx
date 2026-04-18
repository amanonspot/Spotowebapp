"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { bookingService } from "@/lib/api";
import BookingHeader from "../booking/[slug]/_components/BookingHeader";
import BookingCard from "./_components/BookingCard";
import BottomNavigation from "@/components/BottomNavigation";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  event_id: string;
  booking_status: string;
  is_paid: boolean;
  created_at: string;
  amount: number;
  event: {
    id: string;
    event_title: string;
    venue_name: string;
    display_image: string;
    start_date: string;
    end_date: string;
    latitude?: string | number;
    longitude?: string | number;
    venue_latitude?: string | number;
    venue_longitude?: string | number;
    vendor?: any;
    vendor_phone?: string;
  };
  visitors: Array<{
    visitor_first_name: string;
    visitor_last_name: string;
    visitor_email: string;
  }>;
}

type TabType = 'upcoming' | 'past' | 'cancelled';

const MyBookingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    
    if (!user || !user.id) {
      return;
    }
    
    fetchBookings();
  }, [isAuthenticated, user, user?.id, activeTab]);


  const fetchBookings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Call the API to get user bookings
      const apiResponse = await bookingService.getUserBookings(user.id);
      
      // Transform API response to match the Booking interface
      const transformedBookings = transformAPIResponse(apiResponse);
      
      // Sort bookings by created_at in descending order (newest first - LIFO)
      const sortedBookings = transformedBookings.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      setBookings(sortedBookings);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual refresh - reload the page
  const handleRefresh = () => {
    window.location.reload();
  };

  // Transform API response to match Booking interface
  const transformAPIResponse = (apiResponse: any): Booking[] => {
    if (!apiResponse) {
      return [];
    }

    // The API returns an array directly
    const bookingsData = apiResponse;
    if (!Array.isArray(apiResponse)) {
      return [];
    }

    console.log('📋 Transforming API response:', bookingsData);

    return bookingsData.map((item: any) => {
      // Decode base64 QR to get order data including dates
      let orderData: any = {};
      try {
        if (item.base_64_encoded_qr) {
          const decoded = atob(item.base_64_encoded_qr);
          const parsedData = JSON.parse(decoded);
          orderData = parsedData.order_data || {};
        }
      } catch (e) {
        console.error('Error decoding QR data:', e);
      }

      // Extract dates from orderData - use user_selected_start_date and user_selected_end_date
      const startDate = orderData.user_selected_start_date || '';
      const endDate = orderData.user_selected_end_date || '';

      // Build display image URL - prioritize event_images array from API
      let displayImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';
      if (item.event_images && Array.isArray(item.event_images) && item.event_images.length > 0) {
        displayImage = item.event_images[0];
      } else if (item.display_image) {
        displayImage = item.display_image;
      } else if (item.event_image) {
        displayImage = item.event_image;
      } else if (item.event_media?.image && Array.isArray(item.event_media.image) && item.event_media.image.length > 0) {
        displayImage = item.event_media.image[0];
      } else if (item.event_gallery?.image && Array.isArray(item.event_gallery.image) && item.event_gallery.image.length > 0) {
        displayImage = item.event_gallery.image[0];
      }

      // Build venue name from event_location or event_venue
      let venueName = 'Unknown Venue';
      if (item.event_venue?.venue_name) {
        venueName = item.event_venue.venue_name;
      } else if (item.event_location?.location_name) {
        venueName = item.event_location.location_name;
      } else if (item.event_location?.location_city) {
        venueName = item.event_location.location_city;
      }

      // Build location string for display
      const locationParts = [];
      if (item.event_location?.location_city) locationParts.push(item.event_location.location_city);
      if (item.event_location?.location_state) locationParts.push(item.event_location.location_state);
      const locationString = locationParts.length > 0 ? locationParts.join(', ') : venueName;

      return {
        id: item.order_id || '',
        event_id: item.event_id || '',
        booking_status: item.booking_status || 'draft',
        is_paid: item.is_paid || false,
        created_at: item.created_at || new Date().toISOString(),
        amount: parseFloat(item.amount || item.subtotal_amount || 0),
        event: {
          id: item.event_id || '',
          event_title: item.event_title || 'Untitled Event',
          venue_name: locationString || venueName,
          display_image: displayImage,
          start_date: startDate,
          end_date: endDate,
          // Extract coordinates from event_venue
          latitude: item.event_venue?.venue_latitude,
          longitude: item.event_venue?.venue_longitude,
          venue_latitude: item.event_venue?.venue_latitude,
          venue_longitude: item.event_venue?.venue_longitude,
          // Extract vendor/host information (if available in future)
          vendor: item.event_vendor || item.vendor,
          vendor_phone: item.event_vendor?.phone || item.event_vendor?.phone_number || item.vendor_phone
        },
        visitors: [] // Visitors need to be fetched separately if needed
      };
    }).filter((booking: Booking) => booking.id); // Filter out invalid bookings
  };

  const getFilteredBookings = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for fair comparison
    
    // ============================================
    // 📋 BOOKING STATUS CONFIGURATION
    // ============================================
    // Based on backend statuses:
    // - DRAFT
    // - CANCELLED
    // - WAITING_FOR_PAYMENT
    // - WAITING_FOR_CONFIRMATION
    // - CONFIRMED
    // - REFUNDED
    //
    // Filtering rules:
    // - Upcoming: CONFIRMED bookings with future dates, WAITING_FOR_CONFIRMATION (Pending Host Approval)
    // - Past: CONFIRMED bookings with past dates, REFUNDED bookings
    // - Cancelled: CANCELLED bookings (including rejected bookings)
    // ============================================
    
    console.log('📋 Filtering bookings. Total bookings:', bookings.length);
    console.log('📋 Active tab:', activeTab);
    console.log('📋 Current date:', now);
    
    const filtered = bookings.filter(booking => {
      // Add null/undefined checks for booking.event
      if (!booking || !booking.event) {
        console.log('⚠️ Skipping booking with incomplete data:', booking);
        return false; // Skip bookings with incomplete data
      }
      
      // Normalize status to handle both uppercase and lowercase from API
      const status = booking.booking_status.toLowerCase().trim();
      const normalizedStatus = status.replace(/\s+/g, '_');
      
      // Handle CANCELLED status - only show in Cancelled tab
      if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
        return activeTab === 'cancelled';
      }
      
      // Handle REFUNDED status - only show in Past tab
      if (normalizedStatus === 'refunded') {
        return activeTab === 'past';
      }
      
      // Handle WAITING_FOR_CONFIRMATION (Pending Host Approval) - show in Upcoming
      if (normalizedStatus === 'waiting_for_confirmation' || normalizedStatus === 'waiting for confirmation') {
        // Show in Upcoming tab only (after payment is done, waiting for host approval)
        return activeTab === 'upcoming';
      }
      
      // For CONFIRMED status, check the date
      if (normalizedStatus === 'confirmed' || normalizedStatus === 'booked') {
        // Need a valid date to determine if it's upcoming or past
        if (!booking.event.start_date) {
          // If no date, skip this booking (can't determine if upcoming or past)
          console.log(`⚠️ Skipping CONFIRMED booking ${booking.id} - no start date`);
          return false;
        }
        
        const bookingDate = new Date(booking.event.start_date);
        if (isNaN(bookingDate.getTime())) {
          // Invalid date, skip
          console.log(`⚠️ Skipping CONFIRMED booking ${booking.id} - invalid date: ${booking.event.start_date}`);
          return false;
        }
        
        bookingDate.setHours(0, 0, 0, 0); // Reset to start of day
        
        const isFuture = bookingDate >= now;
        
        console.log(`📋 Booking ${booking.id}: Date=${booking.event.start_date}, Status=${normalizedStatus.toUpperCase()}, Future=${isFuture}`);
        
        if (activeTab === 'upcoming') {
          // Show CONFIRMED bookings with future dates (stays in Upcoming after confirmation)
          return isFuture;
        } else if (activeTab === 'past') {
          // Show CONFIRMED bookings with past dates
          return !isFuture;
        }
        
        return false;
      }
      
      // For other statuses (DRAFT, WAITING_FOR_PAYMENT)
      // Don't show them in any tab
      return false;
    });
    
    console.log('📋 Filtered bookings count:', filtered.length);
    return filtered;
  };

  // Pagination logic
  const getPaginatedBookings = () => {
    const filtered = getFilteredBookings();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredBookings().length / itemsPerPage);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const tabs = [
    { key: 'upcoming' as TabType, label: 'Upcoming' },
    { key: 'past' as TabType, label: 'Past' },
    { key: 'cancelled' as TabType, label: 'Cancelled' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-[#120A1A]">
        <BookingHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Please Login</h2>
            <p className="text-gray-400 mb-6">You need to be logged in to view your bookings.</p>
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white px-6 py-3 rounded-lg hover:from-[#9575e6] hover:to-[#7e5bc4] transition-all shadow-md hover:shadow-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#120A1A]">
      <BookingHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {/* Mobile Header - My Bookings with Profile Icon */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">My Bookings</h1>
          {/* Profile Icon - Already in BookingHeader, but adding here for mobile view per Figma */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Bookings</h1>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] hover:from-[#9575e6] hover:to-[#7e5bc4] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 sm:w-auto w-full"
            title="Reload page to refresh bookings"
            aria-label="Refresh page"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-lg border border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#AF7AEB]"></div>
            <span className="ml-2 text-white">Loading bookings...</span>
          </div>
        ) : (
          <>
            {getFilteredBookings().length > 0 ? (
              <>
                {/* Grid Layout for Booking Cards - Single column */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  {getPaginatedBookings().map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-purple-500/30'
                                  : 'border border-white/20 text-white hover:bg-white/10'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="text-white px-2">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No {activeTab} bookings</h3>
                <p className="text-gray-400">You don't have any {activeTab} bookings yet.</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MyBookingsPage;
