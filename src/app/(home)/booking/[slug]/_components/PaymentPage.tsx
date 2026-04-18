"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import toast from "react-hot-toast";
import BookingHeader from "./BookingHeader";
import PaymentLeftSection from "./PaymentLeftSection";
import PaymentRightSection from "./PaymentRightSection";
import { useAuth } from "@/lib/hooks";
import { eventService, bookingService } from "@/lib/api";

const PaymentPage: React.FC = () => {
    const searchParams = useSearchParams();
    const params = useParams();
    const { user } = useAuth();
    const [isMockBooking, setIsMockBooking] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [bookingData, setBookingData] = useState<any>(null);
    const [eventData, setEventData] = useState<any>(null);

    useEffect(() => {
        const mockParam = searchParams.get('mock');
        const orderIdParam = searchParams.get('order_id');
        const eventIdParam = searchParams.get('event_id');
        
        setIsMockBooking(mockParam === 'true');
        setOrderId(orderIdParam);
        
        // Get payment details from URL parameters - NO HARDCODED DEFAULTS
        const basePrice = parseFloat(searchParams.get('base_price') || '0');
        const serviceFee = parseFloat(searchParams.get('service_fee') || '0');
        const taxes = parseFloat(searchParams.get('taxes') || '0');
        const total = parseFloat(searchParams.get('total') || '0');
        const guests = parseInt(searchParams.get('guests') || '1');
        const checkIn = searchParams.get('check_in') || '';
        const checkOut = searchParams.get('check_out') || '';
        
        console.log('⚠️ PaymentPage - URL Parameters (NO DEFAULTS):', {
            basePrice,
            serviceFee,
            taxes,
            total,
            guests,
            checkIn,
            checkOut
        });
        
        if (mockParam === 'true') {
            console.log('🎭 Mock booking detected. Order ID:', orderIdParam);
            console.log('💰 Mock booking - URL params:', {
                basePrice,
                serviceFee,
                taxes,
                total,
                guests,
                checkIn,
                checkOut
            });
            
            // Set booking data from URL parameters
            const mockBookingData = {
                base_price: basePrice,
                service_fee: serviceFee,
                taxes: taxes,
                total: total,
                guests: guests,
                check_in: checkIn,
                check_out: checkOut,
                dates: checkIn && checkOut ? `${checkIn} - ${checkOut}` : '6-7 March',
                host: 'Aman',
                property_description: 'Private room in home hosted by Aman'
            };
            
            console.log('💰 Mock booking - Setting bookingData:', mockBookingData);
            console.log('💰 Mock booking - Total being set:', mockBookingData.total);
            
            setBookingData(mockBookingData);
        } else if (orderIdParam && eventIdParam) {
            console.log('📊 Real booking detected - fetching data...');
            // Fetch real booking data
            fetchBookingData(orderIdParam, eventIdParam);
        } else {
            console.error('❌ No valid booking parameters found!');
        }
    }, [searchParams]);

    const fetchBookingData = async (orderId: string, eventId: string) => {
        try {
            // Fetch event details
            const event = await eventService.getEventDetails(eventId);
            setEventData(event);
            
            // Use payment details from URL parameters to ensure correct total
            console.log('💰 PaymentPage - Reading URL parameters:');
            console.log('💰 base_price param:', searchParams.get('base_price'));
            console.log('💰 service_fee param:', searchParams.get('service_fee'));
            console.log('💰 taxes param:', searchParams.get('taxes'));
            console.log('💰 total param:', searchParams.get('total'));
            console.log('💰 guests param:', searchParams.get('guests'));
            
            // NO HARDCODED DEFAULTS - Must get from URL params
            const basePrice = parseFloat(searchParams.get('base_price') || '0');
            const serviceFee = parseFloat(searchParams.get('service_fee') || '0');
            const taxes = parseFloat(searchParams.get('taxes') || '0');
            const total = parseFloat(searchParams.get('total') || '0');
            const guests = parseInt(searchParams.get('guests') || '1');
            const checkIn = searchParams.get('check_in') || '';
            const checkOut = searchParams.get('check_out') || '';
            
            console.log('💰 PaymentPage - Parsed values:', {
                basePrice,
                serviceFee,
                taxes,
                total,
                guests,
                checkIn,
                checkOut
            });
            
            if (event) {
                // Use dates from URL params if available, otherwise fall back to event dates
                const displayDates = checkIn && checkOut 
                    ? `${checkIn} - ${checkOut}`
                    : `${event.start_date || 'Check in'}-${event.end_date || 'Check out'}`;
                
                const finalBookingData = {
                    base_price: basePrice,
                    service_fee: serviceFee,
                    taxes: taxes,
                    total: total,  // Use the total from URL params
                    guests: guests,
                    check_in: checkIn || event.start_date,
                    check_out: checkOut || event.end_date,
                    dates: displayDates,
                    host: event.venue_name || 'Host',
                    property_description: event.event_title || event.venue_name
                };
                
                console.log('💰 PaymentPage - Setting bookingData:', finalBookingData);
                console.log('💰 PaymentPage - Total being set:', finalBookingData.total);
                
                setBookingData(finalBookingData);
            } else {
                console.error('❌ Event data not available, bookingData not set!');
            }
        } catch (error) {
            console.error('Error fetching booking data:', error);
            toast.error('Failed to load booking details');
        }
    };

    return (
        <div className="w-full min-h-screen bg-white">
            <BookingHeader />

            {/* Mock Booking Notice */}
            {isMockBooking && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 sm:mx-6 lg:mx-8 mt-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <strong>Demo Mode:</strong> This is a demonstration booking. The backend payment system is currently being set up. 
                                Your booking details have been recorded and will be processed once the payment system is ready.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Payment Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                    {/* Left Section - Payment Details */}
                    <div className="order-2 xl:order-1 max-w-2xl xl:max-w-none">
                        <PaymentLeftSection bookingData={bookingData} eventData={eventData} orderId={orderId || undefined} />
                    </div>

                    {/* Right Section - Property & Price */}
                    <div className="order-1 xl:order-2 max-w-2xl xl:max-w-none">
                        <PaymentRightSection bookingData={bookingData} eventData={eventData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
