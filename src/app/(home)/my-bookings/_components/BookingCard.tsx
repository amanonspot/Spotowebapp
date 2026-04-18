"use client";

import React from "react";
import Image from "next/image";
import { MapPin, Phone, HelpCircle, Info, CheckCircle2 } from "lucide-react";
import { whatsappUtils } from "@/lib/utils/whatsapp";

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

interface BookingCardProps {
  booking: Booking;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  // Format date with ordinal (24th, 30th, etc.)
  const formatDateWithOrdinal = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    
    // Get ordinal suffix
    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${getOrdinal(day)} ${month}, ${year}`;
  };

  const formatDateRange = () => {
    if (!booking.event || !booking.event.start_date || !booking.event.end_date) {
      return 'Dates not available';
    }
    const startDate = formatDateWithOrdinal(booking.event.start_date);
    const endDate = formatDateWithOrdinal(booking.event.end_date);
    
    // Extract just the date part if same month/year
    const startDateObj = new Date(booking.event.start_date);
    const endDateObj = new Date(booking.event.end_date);
    
    if (startDateObj.getMonth() === endDateObj.getMonth() && 
        startDateObj.getFullYear() === endDateObj.getFullYear()) {
      const startDay = startDateObj.getDate();
      const endDay = endDateObj.getDate();
      const month = startDateObj.toLocaleDateString('en-US', { month: 'short' });
      const year = startDateObj.getFullYear();
      
      const getOrdinal = (n: number) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };
      
      return `${getOrdinal(startDay)} ${month} - ${getOrdinal(endDay)} ${month}, ${year}`;
    }
    
    return `${startDate} - ${endDate}`;
  };

  // Get status display based on backend enum values
  const getStatusDisplay = () => {
    const status = booking.booking_status.toLowerCase();
    
    // DRAFT -> "Draft" - Pending Host Approval
    if (status === 'draft') {
      return {
        label: 'Pending Host Approval',
        icon: <Info className="w-4 h-4" />,
        className: 'text-yellow-500'
      };
    }
    
    // WAITING_FOR_CONFIRMATION -> "Waiting for Confirmation" - Pending Host Approval
    if (status === 'waiting_for_confirmation' || status === 'waiting for confirmation') {
      return {
        label: 'Pending Host Approval',
        icon: <Info className="w-4 h-4" />,
        className: 'text-yellow-500'
      };
    }
    
    // WAITING_FOR_PAYMENT -> "Waiting for Payment"
    if (status === 'waiting_for_payment' || status === 'waiting for payment') {
      return {
        label: 'Waiting for Payment',
        icon: <Info className="w-4 h-4" />,
        className: 'text-orange-500'
      };
    }
    
    // CONFIRMED -> "Confirmed" - Booking Confirmed
    if (status === 'confirmed' || status === 'booked') {
      return {
        label: 'Booking Confirmed',
        icon: <CheckCircle2 className="w-4 h-4" />,
        className: 'text-green-500'
      };
    }
    
    // CANCELLED -> "Cancelled"
    if (status === 'cancelled' || status === 'canceled') {
      return {
        label: 'Cancelled',
        icon: <Info className="w-4 h-4" />,
        className: 'text-red-500'
      };
    }
    
    // REFUNDED -> "Refunded"
    if (status === 'refunded') {
      return {
        label: 'Refunded',
        icon: <Info className="w-4 h-4" />,
        className: 'text-gray-500'
      };
    }
    
    // Fallback for any other status
    return {
      label: booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1),
      icon: <Info className="w-4 h-4" />,
      className: 'text-gray-500'
    };
  };

  // Get property coordinates for Google Maps
  const getCoordinates = () => {
    // Try venue coordinates first
    // NOTE: API has lat/lng swapped - venue_latitude is actually longitude and vice versa
    if (booking.event.venue_latitude && booking.event.venue_longitude) {
      const rawLat = typeof booking.event.venue_latitude === 'string' 
        ? parseFloat(booking.event.venue_latitude)
        : booking.event.venue_latitude;
      const rawLng = typeof booking.event.venue_longitude === 'string'
        ? parseFloat(booking.event.venue_longitude)
        : booking.event.venue_longitude;
      
      // IMPORTANT: The API has these swapped, so we need to correct them
      // venue_latitude in API is actually longitude, venue_longitude is actually latitude
      const lat = rawLng;  // Use venue_longitude as latitude
      const lng = rawLat;  // Use venue_latitude as longitude
      
      // Validate coordinates are valid numbers and in correct ranges
      // Latitude: -90 to 90, Longitude: -180 to 180
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    
    // Try event coordinates (these should be correct, not swapped)
    if (booking.event.latitude && booking.event.longitude) {
      const lat = typeof booking.event.latitude === 'string' 
        ? parseFloat(booking.event.latitude)
        : booking.event.latitude;
      const lng = typeof booking.event.longitude === 'string'
        ? parseFloat(booking.event.longitude)
        : booking.event.longitude;
      
      // Validate coordinates
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    
    return null;
  };

  // Handle Location button click - open Google Maps directions
  const handleLocationClick = () => {
    const coords = getCoordinates();
    if (coords) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: try to use venue name for search
      const searchQuery = encodeURIComponent(booking.event.venue_name || booking.event.event_title);
      const url = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle Call The Host button click
  const handleCallHost = () => {
    const phoneNumber = booking.event.vendor_phone || 
                       (typeof booking.event.vendor === 'object' && booking.event.vendor?.phone) ||
                       (typeof booking.event.vendor === 'object' && booking.event.vendor?.phone_number);
    
    if (phoneNumber) {
      // Remove any non-digit characters except +
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      window.location.href = `tel:${cleanPhone}`;
    } else {
      // If no phone number, show alert or use WhatsApp as fallback
      alert('Host phone number not available. Please use the "Need help?" button to contact support.');
    }
  };

  // Handle Need help? button click - open Spoto WhatsApp
  const handleNeedHelp = () => {
    const bookingInfo = `Booking ID: ${booking.id}\nProperty: ${booking.event.event_title}\nDates: ${formatDateRange()}`;
    whatsappUtils.contactForBooking(`Hi! I need help with my booking on Spoto.\n\n${bookingInfo}\n\nCould you please assist me?`);
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div>
      {/* Property Image - Increased height */}
      <div className="w-full h-80 sm:h-96 md:h-[500px] relative rounded-lg overflow-hidden">
        <Image
          src={booking.event.display_image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"}
          alt={booking.event.event_title}
          fill
          className="object-cover"
        />
      </div>

      {/* Booking Details */}
      <div className="p-4 space-y-3">
        {/* Status with Icon */}
        <div className="flex items-center gap-2">
          <div className={statusDisplay.className}>
            {statusDisplay.icon}
          </div>
          <span className="text-sm font-medium text-white">
            {statusDisplay.label}
          </span>
        </div>

        {/* Property Title */}
        <h3 className="text-base font-semibold text-white leading-tight">
          {booking.event.event_title}
        </h3>

        {/* Property Location */}
        {booking.event.venue_name && (
          <p className="text-sm text-gray-400">
            {booking.event.venue_name}
          </p>
        )}

        {/* Dates */}
        <p className="text-sm text-white font-medium">
          {formatDateRange()}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {/* Location Button - Purple, Half Width */}
          <button
            onClick={handleLocationClick}
            className="w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white rounded-lg hover:from-[#9575e6] hover:to-[#7e5bc4] transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-sm font-semibold"
          >
            <MapPin className="w-4 h-4" />
            Location
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 8v9m-9-9h9" />
            </svg>
          </button>

          {/* Call The Host and Need help? buttons side by side */}
          <div className="flex gap-2">
            <button
              onClick={handleCallHost}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <Phone className="w-4 h-4" />
              Call The Host
            </button>
            <button
              onClick={handleNeedHelp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <HelpCircle className="w-4 h-4" />
              Need help?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
