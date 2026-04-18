"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { bookingService, eventService } from "@/lib/api";
import BookingHeader from "../../booking/[slug]/_components/BookingHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { CalendarDays, Users, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

interface BookingDetails {
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
    description: string;
    address: string;
  };
  visitors: Array<{
    visitor_first_name: string;
    visitor_last_name: string;
    visitor_email: string;
    visitor_phone: string;
    visitor_age: number;
  }>;
}

const BookingDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventDetails, setEventDetails] = useState<any>(null);

  const bookingId = params.slug as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchBookingDetails();
  }, [bookingId, isAuthenticated]);

  const fetchBookingDetails = async () => {
    if (!bookingId || !user?.id) return;
    
    setLoading(true);
    try {
      const bookingDetails = await bookingService.getBookingDetails(bookingId);
      setBooking(bookingDetails);
      
      // Fetch additional event details
      if (bookingDetails.event_id) {
        const event = await eventService.getEventDetails(bookingDetails.event_id);
        setEventDetails(event);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateRange = () => {
    if (!booking) return '';
    const startDate = formatDate(booking.event.start_date);
    const endDate = formatDate(booking.event.end_date);
    return `${startDate} - ${endDate}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-white">
        <BookingHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to view booking details.</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white">
        <BookingHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="w-full min-h-screen bg-white">
        <BookingHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/my-bookings')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <BookingHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Property Image */}
        <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden mb-6">
          <Image
            src={booking.event.display_image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
            alt={booking.event.event_title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Hi {user?.first_name || 'Guest'}</h1>
            <p className="text-lg">
              {booking.booking_status.toLowerCase() === 'pending' || booking.booking_status.toLowerCase() === 'draft'
                ? 'Waiting for Host to Accept Booking'
                : 'Your Stay Is Booked'}
            </p>
          </div>
        </div>
        
        {/* Status Banner */}
        {(booking.booking_status.toLowerCase() === 'pending' || booking.booking_status.toLowerCase() === 'draft') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Waiting for Host Approval</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The host will review your booking request and confirm soon. You'll receive a notification once approved.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {(booking.booking_status.toLowerCase() === 'confirmed' || booking.booking_status.toLowerCase() === 'booked') && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Booking Confirmed!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your booking has been confirmed by the host. Get ready for your stay!
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Property Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your place</h2>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={booking.event.display_image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
                alt={booking.event.event_title}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{booking.event.event_title}</h3>
              <p className="text-sm text-gray-600">{booking.event.venue_name}</p>
            </div>
          </div>
        </div>

        {/* Reservation Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reservation details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Guests</p>
                <p className="font-medium">{booking.visitors.length} {booking.visitors.length === 1 ? 'guest' : 'guests'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Dates</p>
                <p className="font-medium">{formatDateRange()}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-2">Confirmation code</p>
            {booking.booking_status.toLowerCase() === 'pending' || booking.booking_status.toLowerCase() === 'draft' ? (
              <p className="text-yellow-600 font-medium">Pending - Waiting for Host to Accept Booking</p>
            ) : (
              <p className="font-mono text-lg font-bold text-gray-900">{booking.id.slice(0, 8).toUpperCase()}</p>
            )}
          </div>
          
          {/* Additional Actions */}
          <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Get a PDF for visa purposes
            </button>
            <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print details
            </button>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cancellation policy</h2>
          <p className="text-gray-600 mb-3">
            Free cancellation before {formatDate(booking.event.start_date)}.
          </p>
          <button className="text-purple-600 hover:text-purple-700 font-medium">
            Read more
          </button>
        </div>

        {/* Rules and Instructions */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rules and instructions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">House rules</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Check-in after 4:00 p.m.</li>
                <li>• Checkout before 11:00 a.m.</li>
                <li>• {booking.visitors.length} guests maximum</li>
                <li>• No smoking</li>
                <li>• No pets</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Safety & property</h3>
              <ul className="space-y-1 text-gray-600">
                <li>• Nearby lake, river, other body of water</li>
                <li>• Heights without rails or protection</li>
                <li>• Climbing or play structure</li>
              </ul>
            </div>
          </div>
          
          <button className="text-purple-600 hover:text-purple-700 font-medium mt-4">
            Show more
          </button>
        </div>

        {/* Message Host */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Message your Host</h2>
          
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">H</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Host</p>
              <p className="text-sm text-gray-600">Usually responds within an hour</p>
            </div>
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        
        {/* Hosted by */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Hosted by Aman</h2>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">A</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Aman</p>
              <p className="text-sm text-gray-600">Host since 2020</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Call</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Message</span>
              </button>
            </div>
          </div>
          
          <button className="text-purple-600 hover:text-purple-700 font-medium mt-4 text-sm">
            Show more
          </button>
        </div>
        
        {/* Payment Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Payment info</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total amount</span>
              <span className="font-semibold text-gray-900">₹{booking.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment status</span>
              <span className={`font-medium ${booking.is_paid ? 'text-green-600' : 'text-yellow-600'}`}>
                {booking.is_paid ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Get Support Anytime */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Get support anytime</h2>
          <p className="text-gray-600 mb-4 text-sm">
            We're here to help with your booking questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Contact Support
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Visit the Help Centre
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
            Modify booking
          </button>
          <button className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Cancel booking
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default BookingDetailsPage;
