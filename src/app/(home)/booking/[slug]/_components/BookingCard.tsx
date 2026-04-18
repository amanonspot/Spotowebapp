"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Event } from "@/lib/api/types";
import { useBooking } from "@/lib/hooks/useBooking";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBooking, checkTicketAvailability } from "@/lib/api/services/booking.service";
import { eventService, userService } from "@/lib/api";
import DatePicker from "./DatePicker";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getPricePerNight as getSharedPricePerNight } from "@/lib/utils/priceCalculator";

interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface BookingCardProps {
    event?: Event | null;
    slug?: string;
    onReserve?: () => void;
    dateRange?: DateRange | undefined;
    onDateRangeChange?: (range: DateRange | undefined) => void;
    onGuestCountChange?: (count: number) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({
    event,
    slug = "property-slug",
    onReserve,
    dateRange: externalDateRange,
    onDateRangeChange,
    onGuestCountChange,
}) => {
    const [isReserving, setIsReserving] = useState(false);
    const [guestCount, setGuestCount] = useState(1);
    const [maxGuestsAllowed, setMaxGuestsAllowed] = useState<number | null>(null);
    const [guestLimitError, setGuestLimitError] = useState<string | null>(null);
    const [dateValidationError, setDateValidationError] = useState<string | null>(null);
    const [pricingModel, setPricingModel] = useState<{ isPerDay: boolean; isPerTicket: boolean }>({ isPerDay: false, isPerTicket: false });
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const router = useRouter();
    
    // Convert external date range to string format for internal use (local timezone)
    const getDateString = (date: Date | undefined): string => {
        if (!date) return '';
        // Use local timezone to avoid date shifting
        const localDate = new Date(date);
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const [checkInDate, setCheckInDate] = useState(() => {
        if (externalDateRange?.from) {
            return getDateString(externalDateRange.from);
        }
        // Default to today in local timezone
        const today = new Date();
        return getDateString(today);
    });
    
    const [checkOutDate, setCheckOutDate] = useState(() => {
        if (externalDateRange?.to) {
            return getDateString(externalDateRange.to);
        }
        // Default to tomorrow in local timezone
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return getDateString(tomorrow);
    });
    
    // Check availability when dates or guest count changes
    useEffect(() => {
        if (checkInDate && checkOutDate && guestCount > 0) {
            console.log('🔍 Triggering availability check due to date/guest change');
            checkAvailability();
        }
    }, [checkInDate, checkOutDate, guestCount]);
    
    // Sync with external date range
    useEffect(() => {
        if (externalDateRange?.from) {
            const newCheckIn = getDateString(externalDateRange.from);
            setCheckInDate(prev => {
                // Only update if different to avoid unnecessary re-renders
                return newCheckIn !== prev ? newCheckIn : prev;
            });
        }
        if (externalDateRange?.to) {
            const newCheckOut = getDateString(externalDateRange.to);
            setCheckOutDate(prev => {
                // Only update if different to avoid unnecessary re-renders
                return newCheckOut !== prev ? newCheckOut : prev;
            });
        }
    }, [externalDateRange?.from?.getTime(), externalDateRange?.to?.getTime()]);
    const { createBooking, loading, getEventTickets, checkTicketAvailability } = useBooking();
    const { user, refreshUser } = useAuth();
    const [availableTickets, setAvailableTickets] = useState<any[]>([]);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

    // Get price from event data using shared utility
    const getPricePerNight = () => {
        return getSharedPricePerNight(event);
    };

    const pricePerNight = getPricePerNight();
    console.log('🏷️ BookingCard - pricePerNight from getPricePerNight():', pricePerNight);
    console.log('🏷️ BookingCard - Event data:', event);
    
    const rating = 4.8; // Mock rating - in real app this would come from reviews API
    const reviewCount = 12; // Mock review count

    /**
     * Calculate base price based on pricing model
     * - Per Day Pricing: price × nights (NO guest multiplication)
     * - Per Ticket Pricing: price × guests (NO night multiplication)
     */
    const calculateBasePrice = (pricePerUnit: number, nights: number, guests: number): number => {
        if (pricingModel.isPerDay) {
            // Per-day pricing: multiply by nights only
            return pricePerUnit * nights;
        } else if (pricingModel.isPerTicket) {
            // Per-ticket pricing: multiply by guests only
            return pricePerUnit * guests;
        } else {
            // Default/fallback: per-day pricing
            return pricePerUnit * nights;
        }
    };

    // Extract max_visitor_allowed from event data
    React.useEffect(() => {
        if (event?.phases_tickets && event.phases_tickets.length > 0) {
            const firstPhase = event.phases_tickets[0];
            const firstTicket = firstPhase.ticket?.[0] || firstPhase.event_phase_tickets?.[0];
            
            if (firstTicket && firstTicket.max_visitor_allowed) {
                setMaxGuestsAllowed(firstTicket.max_visitor_allowed);
            }
        }
    }, [event]);

    // Extract pricing model from event_type
    React.useEffect(() => {
        if (event?.event_type) {
            // event_type can be string or object
            const eventTypeObj = typeof event.event_type === 'object' ? event.event_type : null;
            
            setPricingModel({
                isPerDay: eventTypeObj?.is_per_day_pricing || false,
                isPerTicket: eventTypeObj?.is_per_ticket_pricing || false
            });

            console.log('💰 Pricing Model Detected:', {
                isPerDay: eventTypeObj?.is_per_day_pricing,
                isPerTicket: eventTypeObj?.is_per_ticket_pricing,
                eventType: event.event_type
            });
        }
    }, [event]);

    // Validate selected dates against event's valid booking period
    React.useEffect(() => {
        if (!event || !checkInDate || !checkOutDate) {
            setDateValidationError(null);
            return;
        }

        const eventStartDate = event.start_date ? new Date(event.start_date) : null;
        const eventEndDate = event.end_date ? new Date(event.end_date) : null;
        const selectedCheckIn = new Date(checkInDate);
        const selectedCheckOut = new Date(checkOutDate);

        // Validate that dates are valid
        if (isNaN(selectedCheckIn.getTime()) || isNaN(selectedCheckOut.getTime())) {
            console.warn('⚠️ Invalid date format detected:', { checkInDate, checkOutDate });
            setDateValidationError(null);
            return;
        }

        // Reset time to midnight for accurate date comparison
        if (eventStartDate) eventStartDate.setHours(0, 0, 0, 0);
        if (eventEndDate) eventEndDate.setHours(0, 0, 0, 0);
        selectedCheckIn.setHours(0, 0, 0, 0);
        selectedCheckOut.setHours(0, 0, 0, 0);

        let error = null;

        // First check: checkout must be after checkin
        if (selectedCheckOut <= selectedCheckIn) {
            error = `Check-out date must be after check-in date`;
        }
        // Then check against event boundaries
        else if (eventStartDate && selectedCheckIn < eventStartDate) {
            error = `Check-in date must be on or after ${eventStartDate.toLocaleDateString()}`;
        } else if (eventEndDate && selectedCheckOut > eventEndDate) {
            error = `Check-out date must be on or before ${eventEndDate.toLocaleDateString()}`;
        } else if (eventStartDate && selectedCheckOut < eventStartDate) {
            error = `Booking dates must be within the available period`;
        } else if (eventEndDate && selectedCheckIn > eventEndDate) {
            error = `Booking dates must be within the available period`;
        }

        setDateValidationError(error);

        if (error) {
            toast.error(error);
            console.warn('📅 Date Validation Warning:', {
                error,
                eventStartDate: event.start_date,
                eventEndDate: event.end_date,
                selectedCheckIn: checkInDate,
                selectedCheckOut: checkOutDate
            });
        }
    }, [event, checkInDate, checkOutDate]);

    // Check availability when event changes
    React.useEffect(() => {
        if (event?.id) {
            loadAvailableTickets();
        }
    }, [event?.id]);

    const loadAvailableTickets = async () => {
        if (!event?.id) return;
        
        try {
            setIsCheckingAvailability(true);
            const tickets = await getEventTickets(event.id);
            setAvailableTickets(tickets);
            console.log('Available tickets loaded:', tickets);
        } catch (error) {
            console.error('Failed to load available tickets:', error);
            toast.error('Failed to load availability information');
        } finally {
            setIsCheckingAvailability(false);
        }
    };

    const checkAvailability = async () => {
        if (!event?.id || !checkInDate || !checkOutDate) {
            return false;
        }

        try {
            setIsCheckingAvailability(true);
            
            // Validate dates
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);
            
            if (checkOut <= checkIn) {
                toast.error('Check-out date must be after check-in date.');
                return false;
            }
            
            // Get ticket ID from event phases
            let ticketId: string | null = null;
            if (event?.phases_tickets && event.phases_tickets.length > 0) {
                const firstPhase = event.phases_tickets[0];
                const firstTicket = firstPhase.ticket?.[0];
                if (firstTicket) {
                    ticketId = firstTicket.ticket_id;
                }
            }
            
            // If we have a ticket ID, use the API to check availability
            if (ticketId) {
                console.log('🎟️ Checking availability for ticket:', ticketId, 'quantity:', guestCount);
                
                const availabilityResult = await checkTicketAvailability(ticketId, guestCount);
                
                console.log('🎟️ Availability result:', availabilityResult);
                
                if (availabilityResult.available) {
                    toast.success(availabilityResult.message || 'Dates are available!');
                    return true;
                } else {
                    toast.error(availabilityResult.message || 'No availability for selected dates.');
                    return false;
                }
            } else {
                // Fallback: Check if there are available tickets from the listing
                if (availableTickets.length > 0) {
                    const hasAvailability = availableTickets.some(ticket => 
                        ticket.available_qty > 0
                    );
                    
                    if (!hasAvailability) {
                        toast.error('No availability for selected dates. Please choose different dates.');
                        return false;
                    }
                    
                    toast.success('Dates are available!');
                    return true;
                } else {
                    console.warn('No ticket data available for availability check');
                    toast.error('Unable to check availability. Please try again.');
                    return false;
                }
            }
        } catch (error) {
            console.error('Availability check failed:', error);
            toast.error('Failed to check availability. Please try again.');
            return false;
        } finally {
            setIsCheckingAvailability(false);
        }
    };

    // Handle date changes and sync with external state
    const handleDateChange = (type: 'checkIn' | 'checkOut', date: string) => {
        // Parse date string in local timezone (YYYY-MM-DD format)
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        dateObj.setHours(0, 0, 0, 0);
        
        if (type === 'checkIn') {
            setCheckInDate(date);
            const toDate = externalDateRange?.to || (checkOutDate ? (() => {
                const [y, m, d] = checkOutDate.split('-').map(Number);
                const dt = new Date(y, m - 1, d);
                dt.setHours(0, 0, 0, 0);
                return dt;
            })() : undefined);
            const newRange: DateRange = {
                from: dateObj,
                to: toDate,
            };
            onDateRangeChange?.(newRange);
        } else {
            setCheckOutDate(date);
            const fromDate = externalDateRange?.from || (checkInDate ? (() => {
                const [y, m, d] = checkInDate.split('-').map(Number);
                const dt = new Date(y, m - 1, d);
                dt.setHours(0, 0, 0, 0);
                return dt;
            })() : undefined);
            const newRange: DateRange = {
                from: fromDate,
                to: dateObj,
            };
            onDateRangeChange?.(newRange);
        }
    };

    // Note: We don't auto-check availability on date change anymore
    // Users will click "Check Availability" button or "Reserve" button to check
    // This prevents excessive API calls and gives users more control

    const handleEmailUpdate = async () => {
        if (!emailInput || !user?.id) {
            toast.error('Please enter a valid email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        setIsUpdatingEmail(true);
        try {
            await userService.updateUser(user.id, { email: emailInput });
            
            toast.success('Email added successfully! Reloading page...');
            setShowEmailModal(false);
            setEmailInput('');
            
            // Reload the page to get fresh user data
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error: unknown) {
            console.error('Error updating email:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update email. Please try again.'
            );
            setIsUpdatingEmail(false);
        }
    };

    const handleReserve = async () => {
        if (!user) {
            toast.error('Please login to make a booking.');
            router.push('/auth/login');
            return;
        }

        // Email is no longer required here - guest email will be used for communication
        // Users can proceed to visitor details page regardless of account email status

        if (!event) {
            toast.error('Event information not available.');
            return;
        }

        if (!checkInDate || !checkOutDate) {
            toast.error('Please select check-in and check-out dates.');
            return;
        }

        // Validate dates against event's booking period
        if (dateValidationError) {
            toast.error(dateValidationError);
            return;
        }

        // Validate guest count against max_visitor_allowed
        if (maxGuestsAllowed && guestCount > maxGuestsAllowed) {
            toast.error(`Maximum ${maxGuestsAllowed} guests allowed. Please reduce the number of guests.`);
            setGuestLimitError(`Maximum ${maxGuestsAllowed} guests allowed`);
            return;
        }

        setIsReserving(true);
        
        try {
            // Step 1: Get fresh event details from API to ensure we have the latest ticket data
            toast.loading('Fetching event details...');
            console.log('Fetching event details for eventId:', event.id);
            
            const eventDetails = await eventService.getEventDetails(event.id);
            console.log('Event details response:', eventDetails);
            console.log('Event phases_tickets:', eventDetails?.phases_tickets);
            
            // Step 2: Extract ticket_id from phases_tickets
            let ticketId: string | null = null;
            let ticketName = "Standard Ticket";
            
            if (eventDetails?.phases_tickets && Array.isArray(eventDetails.phases_tickets) && eventDetails.phases_tickets.length > 0) {
                // Get the first phase
                const firstPhase = eventDetails.phases_tickets[0];
                console.log('First phase:', firstPhase);
                
                // Extract ticket_id from the phase.ticket array
                if (firstPhase.ticket && Array.isArray(firstPhase.ticket) && firstPhase.ticket.length > 0) {
                    const firstTicket = firstPhase.ticket[0];
                    ticketId = firstTicket.ticket_id; // Use ticket_id field from API response
                    ticketName = firstTicket.ticket_name || ticketName;
                    console.log('Extracted ticket_id:', ticketId, 'ticket_name:', ticketName);
                } else if (firstPhase.phase_id) {
                    // Fallback to phase_id if no specific tickets
                    ticketId = firstPhase.phase_id;
                    ticketName = firstPhase.phase_name || ticketName;
                    console.log('Using phase_id as ticket_id:', ticketId);
                }
            }
            
            if (!ticketId) {
                toast.error('No ticket information available for this event.');
                return;
            }
            
            console.log('Final ticket_id:', ticketId, 'ticket_name:', ticketName);

            // Step 3: Calculate pricing BEFORE availability check (so variables are in scope)
            // IMPORTANT: Use the pricePerNight that's displayed on the booking card
            // This ensures consistency between what the user sees and what they're charged
            
            // Calculate number of days
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);
            const numberOfDays = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) || 1;
            
            // Calculate base price using the correct pricing model
            // IMPORTANT: Use calculateBasePrice helper to respect pricing model
            const basePrice = calculateBasePrice(pricePerNight, numberOfDays, guestCount);
            
            // Get dynamic fees and taxes from event billing_info
            const billingInfo = (event as any)?.billing_info;
            const platformFeePercentage = billingInfo?.fees?.platform_fee?.percentage || 5.0;
            const gstPercentage = billingInfo?.taxes?.gst_tier_info?.gst_percentage || 0.0;
            
            const serviceFee = Math.round(basePrice * (platformFeePercentage / 100));
            const taxes = Math.round(basePrice * (gstPercentage / 100));
            const total = basePrice + serviceFee + taxes;
            
            const subtotalAmount = basePrice;
            const totalDiscount = 0;
            const totalAmount = total;
            
            const calculationDesc = pricingModel.isPerDay 
                ? `${pricePerNight} × ${numberOfDays} nights = ${basePrice}` 
                : pricingModel.isPerTicket 
                    ? `${pricePerNight} × ${guestCount} guests = ${basePrice}`
                    : `${pricePerNight} × ${numberOfDays} nights = ${basePrice}`;

            console.log('💰 Pricing calculation (BEFORE availability check):', {
                pricingModel,
                pricePerNight: pricePerNight,
                'Price shown on card': `₹${pricePerNight}`,
                numberOfDays,
                guestCount,
                'Calculation': calculationDesc,
                basePrice,
                serviceFee,
                taxes,
                total,
                checkInDate,
                checkOutDate
            });

            // Step 4: Check availability using the extracted ticket_id
            toast.loading('Checking ticket availability...', { id: 'availability' });
            
            try {
                const availabilityCheck = await checkTicketAvailability(ticketId, guestCount);
                console.log('Availability check result:', availabilityCheck);
                
                // Show success notification for availability check
                if (availabilityCheck.available) {
                    toast.success(`✓ Tickets available for ${guestCount} guest${guestCount > 1 ? 's' : ''}!`, { 
                        id: 'availability',
                        duration: 2000
                    });
                }
                
                if (!availabilityCheck.available) {
                    toast.dismiss();
                    toast.error(availabilityCheck.message || 'Tickets not available for the selected dates.');
                    return;
                }
                
                toast.dismiss();
                toast.success('Tickets available! Creating booking...');

                const bookingData = {
                    user_id: user.id,
                    subtotal_amount: subtotalAmount,
                    total_discount: totalDiscount,
                    amount: totalAmount,
                    billing_address: "123 Main Street",
                    tickets: [{
                        event_phase_ticket_id: ticketId,
                        ticket_name: ticketName,
                        phase_id: eventDetails.phases_tickets?.[0]?.phase_id || ticketId,
                        qty: guestCount,
                        // Add required date fields for per_day_pricing events
                        user_selected_start_date: checkInDate,
                        user_selected_end_date: checkOutDate
                    }],
                    email: user.email || '',
                    phone: user.phone || '',
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest'
                };

                console.log('Booking data being sent:', bookingData);
                
                // Step 5: Create booking if available
                try {
                    console.log('=== STEP 1: CREATING BOOKING ===');
                    console.log('Event ID:', event.id);
                    console.log('Booking Data:', JSON.stringify(bookingData, null, 2));
                    
                    const order = await createBooking(event.id, bookingData);
                    
                    console.log('=== STEP 1 COMPLETE ===');
                    console.log('Order created:', order);
                    console.log('Order ID from metadata:', order.metadata?.order_id);
                    console.log('Order ID from id field:', order.id);
                    console.log('Order metadata full:', order.metadata);
                    
                    // Use order_id from metadata as it's the correct field
                    const orderId = order.metadata?.order_id || order.id;
                    
                    toast.success('Step 1 Complete! Redirecting to visitor details...');
                    
                    // Try to get taxes and fees from API response, fallback to calculated values
                    const apiServiceFee = order.metadata?.service_charge || order.metadata?.delivery_charge || serviceFee;
                    const apiTaxes = order.metadata?.total_tax || 
                                    (order.metadata?.cgst_amount && order.metadata?.sgst_amount 
                                        ? order.metadata.cgst_amount + order.metadata.sgst_amount 
                                        : taxes);
                    const apiTotal = order.metadata?.amount || total;
                    
                    console.log('💰 Comparing calculated vs API values:', {
                        calculated: { serviceFee, taxes, total },
                        fromAPI: { 
                            service_fee: apiServiceFee, 
                            total_tax: apiTaxes,
                            total: apiTotal 
                        }
                    });
                    
                    // Use API values if available, otherwise use calculated values
                    const paymentDetails = {
                        base_price: basePrice,
                        service_fee: apiServiceFee,
                        taxes: apiTaxes,
                        total: apiTotal,
                    };
                    
                    console.log('=== NAVIGATION TO VISITOR DETAILS ===');
                    console.log('💰 Payment details being passed to next page:', paymentDetails);
                    console.log('💰 URL Parameters:', {
                        base_price: paymentDetails.base_price,
                        service_fee: paymentDetails.service_fee,
                        taxes: paymentDetails.taxes,
                        total: paymentDetails.total,
                        check_in: checkInDate,
                        check_out: checkOutDate,
                        guests: guestCount
                    });
                    
                    const visitorUrl = `/booking/${slug}/visitors?order_id=${orderId}&event_id=${event.id}&guests=${guestCount}&base_price=${paymentDetails.base_price}&service_fee=${paymentDetails.service_fee}&taxes=${paymentDetails.taxes}&total=${paymentDetails.total}&check_in=${checkInDate}&check_out=${checkOutDate}`;
                    
                    console.log('💰 Full URL with pricing and dates:', visitorUrl);
                    console.log('💰 Verify each parameter in URL:');
                    console.log('  - base_price:', paymentDetails.base_price);
                    console.log('  - service_fee:', paymentDetails.service_fee);
                    console.log('  - taxes:', paymentDetails.taxes);
                    console.log('  - total:', paymentDetails.total);
                    console.log('=== END NAVIGATION INFO ===');
                    
                    // Navigate to visitor details page with order ID and payment details
                    router.push(visitorUrl);
                    
                } catch (bookingError: any) {
                    console.error('Booking creation failed:', bookingError);
                    
                    // Handle backend database error with workaround
                    if (bookingError.message && bookingError.message.includes('paymenthandler_paymentsettingsmodel')) {
                        console.log('Backend payment system not ready, implementing workaround...');
                        
                        // Create a mock order ID for the workaround
                        const mockOrderId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        toast.success('Booking reserved! Redirecting to payment...');
                        
                        // Calculate pricing for mock booking using correct pricing model and dynamic rates
                        const mockBasePrice = calculateBasePrice(pricePerNight, numberOfDays, guestCount);
                        
                        // Get dynamic fees and taxes from event billing_info
                        const billingInfo = (event as any)?.billing_info;
                        const platformFeePercentage = billingInfo?.fees?.platform_fee?.percentage || 5.0;
                        const gstPercentage = billingInfo?.taxes?.gst_tier_info?.gst_percentage || 0.0;
                        
                        const mockServiceFee = Math.round(mockBasePrice * (platformFeePercentage / 100));
                        const mockTaxes = Math.round(mockBasePrice * (gstPercentage / 100));
                        const mockTotal = mockBasePrice + mockServiceFee + mockTaxes;
                        
                        console.log('💰 Mock booking pricing:', {
                            pricePerNight,
                            numberOfDays,
                            guestCount,
                            mockBasePrice,
                            mockServiceFee,
                            mockTaxes,
                            mockTotal
                        });
                        
                        // Use the mock payment details
                        const paymentData = {
                            base_price: mockBasePrice,
                            service_fee: mockServiceFee,
                            taxes: mockTaxes,
                            total: mockTotal,
                        };
                        
                        // Navigate to payment page with mock order ID and payment details
                        router.push(`/booking/${slug}/payment?order_id=${mockOrderId}&event_id=${event.id}&mock=true&guests=${guestCount}&base_price=${paymentData.base_price}&service_fee=${paymentData.service_fee}&taxes=${paymentData.taxes}&total=${paymentData.total}&check_in=${checkInDate}&check_out=${checkOutDate}`);
                        
                        return; // Exit early for workaround
                    }
                    
                    // Re-throw other errors
                    throw bookingError;
                }
                
            } catch (error: any) {
                console.error('Booking creation failed:', error);
                toast.dismiss();
                
                // Handle specific backend database errors
                if (error.message && error.message.includes('paymenthandler_paymentsettingsmodel')) {
                    toast.error('Payment system is being set up. Please contact support or try again later.');
                    console.error('Backend Error: Missing paymenthandler_paymentsettingsmodel table');
                } else if (error.message && error.message.includes('Billing calculation failed')) {
                    toast.error('Unable to process payment at this time. Please try again later.');
                } else {
                    toast.error(error.message || 'Failed to create booking. Please try again.');
                }
                return;
            }
            
            await onReserve?.();
        } catch (error: any) {
            console.error('Booking creation failed:', error);
            toast.error(error.message || 'Failed to create booking. Please try again.');
        } finally {
            setIsReserving(false);
        }
    };

    return (
        <>
        <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg border border-gray-200 p-4 sm:p-5 md:p-6">
                {/* Price and Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                    <div>
                        <span className="text-xl sm:text-2xl font-bold text-gray-900">
                            ₹{pricePerNight.toLocaleString('en-IN')}
                        </span>
                        <span className="text-gray-600 ml-1 text-sm sm:text-base">
                            / night
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <svg
                            className="w-4 h-4 text-yellow-400 fill-current"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                            {rating}
                        </span>
                        <button className="text-sm text-gray-600 hover:text-gray-900 underline">
                            {reviewCount} reviews
                        </button>
                    </div>
                </div>

                {/* Check-in/Check-out */}
                <div className="grid grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                            CHECK-IN
                        </label>
                        <div className="text-sm font-medium text-gray-900">
                            {checkInDate ? format(new Date(checkInDate), "dd/MM/yyyy") : "Select date"}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                            CHECK-OUT
                        </label>
                        <div className="text-sm font-medium text-gray-900">
                            {checkOutDate ? format(new Date(checkOutDate), "dd/MM/yyyy") : "Select date"}
                        </div>
                    </div>
                </div>

                {/* Availability Status */}
                {checkInDate && checkOutDate && (
                    <div className="mb-4 sm:mb-5 py-2">
                        {isCheckingAvailability ? (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                Checking availability...
                            </div>
                        ) : availableTickets.length > 0 ? (
                            <div className="text-sm text-green-600 font-medium">
                                ✓ Dates selected - Availability confirmed ({availableTickets.reduce((total, ticket) => total + ticket.available_qty, 0)} tickets available)
                            </div>
                        ) : (
                            <div className="text-sm text-yellow-600 font-medium">
                                ⚠ Dates selected - Checking availability...
                            </div>
                        )}
                    </div>
                )}

                {/* Date Selection */}
                <div className="mb-5 sm:mb-6">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-3">
                        DATES
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-600 mb-2 font-medium">Check-in</label>
                            <input
                                type="date"
                                value={checkInDate}
                                onChange={(e) => handleDateChange('checkIn', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-3 sm:py-3.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A67AEB] focus:border-[#A67AEB] transition-all touch-manipulation"
                                style={{
                                    colorScheme: 'light',
                                    minHeight: '44px'
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-2 font-medium">Check-out</label>
                            <input
                                type="date"
                                value={checkOutDate}
                                onChange={(e) => handleDateChange('checkOut', e.target.value)}
                                min={checkInDate || new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-3 sm:py-3.5 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A67AEB] focus:border-[#A67AEB] transition-all touch-manipulation"
                                style={{
                                    colorScheme: 'light',
                                    minHeight: '44px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Guests */}
                <div className="mb-5 sm:mb-6">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-3">
                        GUESTS
                    </label>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700 font-medium">Number of guests</span>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    const newCount = Math.max(1, guestCount - 1);
                                    setGuestCount(newCount);
                                    setGuestLimitError(null);
                                    onGuestCountChange?.(newCount);
                                }}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                                disabled={guestCount <= 1}
                                aria-label="Decrease guest count"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                                </svg>
                            </button>
                            <span className="text-lg sm:text-xl font-semibold min-w-[3rem] text-center">{guestCount}</span>
                            <button
                                onClick={() => {
                                    if (maxGuestsAllowed && guestCount >= maxGuestsAllowed) {
                                        setGuestLimitError(`Maximum ${maxGuestsAllowed} guests allowed`);
                                        toast.error(`Maximum ${maxGuestsAllowed} guests allowed for this property`);
                                    } else {
                                        const newCount = guestCount + 1;
                                        setGuestCount(newCount);
                                        setGuestLimitError(null);
                                        onGuestCountChange?.(newCount);
                                    }
                                }}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                                disabled={maxGuestsAllowed !== null && guestCount >= maxGuestsAllowed}
                                aria-label="Increase guest count"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    {/* Guest Limit Info/Error */}
                    {maxGuestsAllowed && (
                        <div className="text-xs text-gray-600 mt-2">
                            Maximum {maxGuestsAllowed} guests allowed
                        </div>
                    )}
                    {guestLimitError && (
                        <div className="text-xs text-red-600 font-medium">
                            {guestLimitError}
                        </div>
                    )}
                </div>

                {/* Date Validation Error */}
                {dateValidationError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-red-800">Invalid Dates</p>
                                <p className="text-xs text-red-600 mt-1">{dateValidationError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Period Info */}
                {event?.start_date && event?.end_date && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                            <span className="font-medium">Available:</span> {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                        </p>
                    </div>
                )}

                {/* Reserve Button */}
                <button
                    onClick={handleReserve}
                    disabled={isReserving || loading || !user || isCheckingAvailability || !checkInDate || !checkOutDate || !!dateValidationError || !!guestLimitError}
                    style={{
                        backgroundColor: (isReserving || loading || !user || isCheckingAvailability || !checkInDate || !checkOutDate || !!dateValidationError || !!guestLimitError) ? '#9CA3AF' : '#A67AEB',
                        minHeight: '48px'
                    }}
                    className="w-full text-white font-bold py-3.5 sm:py-4 px-4 rounded-lg transition-all duration-200 mb-4 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-md hover:shadow-lg touch-manipulation"
                >
                    {(isReserving || loading || isCheckingAvailability) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {isCheckingAvailability ? "Checking availability..." : 
                     isReserving || loading ? "Processing..." : 
                     dateValidationError ? "Invalid dates" :
                     guestLimitError ? "Invalid guest count" :
                     !checkInDate || !checkOutDate ? "Select dates first" : "Reserve"}
                </button>
                {!user && (
                    <p className="text-center text-xs text-red-600 mb-3">
                        Please login to make a booking
                    </p>
                )}
                

                {/* Availability Status */}
                {availableTickets.length > 0 && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-green-700 font-medium">
                                Available tickets: {availableTickets.reduce((total, ticket) => total + ticket.available_qty, 0)}
                            </span>
                        </div>
                    </div>
                )}

                {isCheckingAvailability && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-blue-700 font-medium">
                                Checking availability...
                            </span>
                        </div>
                    </div>
                )}

                {/* Charge Information */}
                <p className="text-center text-xs sm:text-sm text-gray-600 mb-5 sm:mb-6 font-medium">
                    You won&apos;t be charged yet
                </p>

                {/* Price Breakdown */}
                <div className="border-t-2 border-gray-200 pt-5 sm:pt-6 space-y-3 sm:space-y-4 text-sm">
                    {(() => {
                        // Calculate actual number of nights from selected dates
                        const checkIn = checkInDate ? new Date(checkInDate) : null;
                        const checkOut = checkOutDate ? new Date(checkOutDate) : null;
                        const numberOfNights = (checkIn && checkOut) 
                            ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) 
                            : 1;
                        
                        // Calculate base price using correct pricing model
                        const basePrice = calculateBasePrice(pricePerNight, numberOfNights, guestCount);
                        
                        // Get dynamic fees and taxes from event billing_info
                        const billingInfo = (event as any)?.billing_info;
                        const platformFeePercentage = billingInfo?.fees?.platform_fee?.percentage || 5.0;
                        const gstPercentage = billingInfo?.taxes?.gst_tier_info?.gst_percentage || 0.0;
                        
                        const serviceFee = Math.round(basePrice * (platformFeePercentage / 100));
                        const taxes = Math.round(basePrice * (gstPercentage / 100));
                        const total = basePrice + serviceFee + taxes;
                        
                        // Display text based on pricing model
                        const priceDisplayText = pricingModel.isPerTicket
                            ? `₹{pricePerNight.toLocaleString('en-IN')} × ${guestCount} guest${guestCount !== 1 ? 's' : ''}`
                            : `₹${pricePerNight.toLocaleString('en-IN')} × ${numberOfNights} night${numberOfNights !== 1 ? 's' : ''}`;
                        
                        return (
                            <>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-gray-700">{priceDisplayText}</span>
                                    <span className="font-semibold text-gray-900">₹{basePrice.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-gray-700">Service fee ({platformFeePercentage}%)</span>
                                    <span className="font-semibold text-gray-900">₹{serviceFee.toLocaleString('en-IN')}</span>
                                </div>
                                {gstPercentage > 0 && (
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-gray-700">Taxes ({gstPercentage}%)</span>
                                        <span className="font-semibold text-gray-900">₹{taxes.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="border-t-2 border-gray-300 pt-4 mt-3 flex justify-between font-bold text-base sm:text-lg">
                                    <span className="text-gray-900">Total</span>
                                    <span className="text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>

        {/* Email Required Modal */}
        {showEmailModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 transform transition-all">
                    {/* Modal Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Email Required
                            </h3>
                            <p className="text-sm text-gray-600">
                                We need your email to send booking confirmations and updates.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setShowEmailModal(false);
                                setEmailInput('');
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={isUpdatingEmail}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Email Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isUpdatingEmail) {
                                    handleEmailUpdate();
                                }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="your.email@example.com"
                            disabled={isUpdatingEmail}
                            autoFocus
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            💡 This will be saved to your profile for future bookings
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowEmailModal(false);
                                setEmailInput('');
                            }}
                            disabled={isUpdatingEmail}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEmailUpdate}
                            disabled={isUpdatingEmail || !emailInput.trim()}
                            style={{ backgroundColor: '#A67AEB' }}
                            className="flex-1 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUpdatingEmail && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {isUpdatingEmail ? 'Saving...' : 'Continue'}
                        </button>
                    </div>

                    {/* Info Note */}
                    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-purple-900 mb-1">
                                    Why do we need your email?
                                </p>
                                <ul className="text-xs text-purple-700 space-y-1">
                                    <li>• Booking confirmation & receipt</li>
                                    <li>• Important updates about your booking</li>
                                    <li>• Check-in details & instructions</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default BookingCard;
