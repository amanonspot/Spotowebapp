"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { bookingService, eventService, userService } from "@/lib/api";
import toast from "react-hot-toast";
import BookingHeader from "./BookingHeader";
import MobilePaymentBar from "./MobilePaymentBar";

const VisitorDetailsPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [guests, setGuests] = useState([{
        firstName: '',
        lastName: '',
        email: '',
        age: '',
        phone: ''
    }]);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [eventId, setEventId] = useState<string | null>(null);
    const [guestCount, setGuestCount] = useState(1);
    const [ticketInfo, setTicketInfo] = useState<{ticket_name: string, event_phase_ticket_id: string, phase_id: string} | null>(null);
    const [userEmail, setUserEmail] = useState(user?.email || '');
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [activeGuestIndex, setActiveGuestIndex] = useState(0);
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
    const [applySameContactToAll, setApplySameContactToAll] = useState(false);

    // Update userEmail when user data loads
    useEffect(() => {
        if (user?.email) {
            setUserEmail(user.email);
        }
    }, [user?.email]);

    // Check if a guest card is complete
    const isGuestComplete = (index: number) => {
        const guest = guests[index];
        return (
            guest.firstName.trim() !== '' &&
            guest.lastName.trim() !== '' &&
            guest.email.trim() !== '' &&
            guest.age.trim() !== '' &&
            guest.phone.trim() !== ''
        );
    };

    // Check if all required details are filled
    // Note: User account email is NOT required - guest email will be used for communication
    const areAllDetailsFilled = () => {
        return guests.every(guest => 
            guest.firstName.trim() !== '' &&
            guest.lastName.trim() !== '' &&
            guest.email.trim() !== '' &&
            guest.age.trim() !== '' &&
            guest.phone.trim() !== ''
        );
    };

    // Handle email update
    const handleEmailUpdate = async () => {
        if (!userEmail || !user?.id) {
            toast.error('Please enter a valid email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            toast.error('Please enter a valid email address.');
            return;
        }

        setIsUpdatingEmail(true);
        try {
            await userService.updateUser(user.id, { email: userEmail });
            toast.success('Email updated successfully!');
        } catch (error: unknown) {
            console.error('Error updating email:', error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update email. Please try again.'
            );
        } finally {
            setIsUpdatingEmail(false);
        }
    };
    
    // Pricing state from URL parameters
    const [bookingSummary, setBookingSummary] = useState({
        basePrice: 0,
        serviceFee: 0,
        taxes: 0,
        total: 0,
        checkIn: '',
        checkOut: '',
        propertyName: ''
    });

    useEffect(() => {
        // Get URL params with debugging - use Next.js useSearchParams consistently
        const orderIdParam = searchParams.get('order_id');
        const eventIdParam = searchParams.get('event_id');
        const guestCountParam = parseInt(searchParams.get('guests') || '1');
        
        // Get pricing parameters - Log raw values first
        console.log('VisitorDetailsPage - Raw URL search params:', {
            base_price_raw: searchParams.get('base_price'),
            service_fee_raw: searchParams.get('service_fee'),
            taxes_raw: searchParams.get('taxes'),
            total_raw: searchParams.get('total'),
            check_in_raw: searchParams.get('check_in'),
            check_out_raw: searchParams.get('check_out')
        });
        
        const basePrice = parseFloat(searchParams.get('base_price') || '0');
        const serviceFee = parseFloat(searchParams.get('service_fee') || '0');
        const taxes = parseFloat(searchParams.get('taxes') || '0');
        const total = parseFloat(searchParams.get('total') || '0');
        const checkIn = searchParams.get('check_in') || '';
        const checkOut = searchParams.get('check_out') || '';
        
        console.log('✅ VisitorDetailsPage - Parsed pricing values:', {
            orderIdParam,
            eventIdParam,
            guestCountParam,
            basePrice,
            serviceFee,
            taxes,
            total,
            checkIn,
            checkOut
        });
        
        setOrderId(orderIdParam);
        setEventId(eventIdParam);
        setGuestCount(guestCountParam);
        
        // Set booking summary
        setBookingSummary({
            basePrice,
            serviceFee,
            taxes,
            total,
            checkIn,
            checkOut,
            propertyName: ''
        });

        // Initialize guests array
        const initialGuests = Array(guestCountParam).fill(null).map(() => ({
            firstName: '',
            lastName: '',
            email: '',
            age: '',
            phone: ''
        }));
        setGuests(initialGuests);

        // Fetch ticket information from event
        if (eventIdParam) {
            fetchTicketInfo(eventIdParam);
        }
    }, [searchParams]);

    const fetchTicketInfo = async (eventId: string) => {
        try {
            const eventDetails = await eventService.getEventDetails(eventId);
            
            console.log('Fetched event details:', eventDetails);
            
            // Update property name in booking summary
            if (eventDetails?.event_title || eventDetails?.venue_name) {
                setBookingSummary(prev => ({
                    ...prev,
                    propertyName: eventDetails.event_title || eventDetails.venue_name || ''
                }));
            }
            
            // Extract ticket info from the event_phase_tickets structure
            if (eventDetails?.phases_tickets && eventDetails.phases_tickets.length > 0) {
                const firstPhase = eventDetails.phases_tickets[0];
                console.log('First phase:', firstPhase);
                
                // Check for event_phase_tickets array in the response
                const firstEventPhaseTicket = firstPhase.event_phase_tickets?.[0];
                const firstTicket = firstPhase.ticket?.[0];
                
                console.log('First event phase ticket:', firstEventPhaseTicket);
                console.log('First ticket:', firstTicket);
                
                // Try event_phase_tickets first, then fall back to ticket array
                const ticketData = firstEventPhaseTicket || firstTicket;
                
                if (ticketData) {
                    // Use the correct field based on which structure we found
                    const ticketId = ticketData.id || ticketData.ticket_id || '';
                    const phaseId = firstPhase.id || firstPhase.phase_id || '';
                    const ticketName = ticketData.event_phase_ticket_name || ticketData.ticket_name || 'Standard Ticket';
                    
                    console.log('Setting ticket info:', {
                        ticket_name: ticketName,
                        event_phase_ticket_id: ticketId,
                        phase_id: phaseId
                    });
                    
                    setTicketInfo({
                        ticket_name: ticketName,
                        event_phase_ticket_id: ticketId,
                        phase_id: phaseId
                    });
                } else {
                    console.error('No ticket data found in phase. Available keys:', Object.keys(firstPhase));
                    
                    // Set default ticket info to allow the page to load
                    setTicketInfo({
                        ticket_name: 'Standard Ticket',
                        event_phase_ticket_id: firstPhase.id || '',
                        phase_id: firstPhase.id || ''
                    });
                }
            } else {
                console.error('No phases found in event');
                // Set default values to prevent infinite loading
                setTicketInfo({
                    ticket_name: 'Standard Ticket',
                    event_phase_ticket_id: '',
                    phase_id: ''
                });
            }
        } catch (error) {
            console.error('Error fetching ticket info:', error);
            // Set default values on error to allow the page to load
            setTicketInfo({
                ticket_name: 'Standard Ticket',
                event_phase_ticket_id: '',
                phase_id: ''
            });
        }
    };

    const handleInputChange = (index: number, field: string, value: string) => {
        const updatedGuests = [...guests];
        updatedGuests[index] = { ...updatedGuests[index], [field]: value };
        
        // If "apply to all" is checked and this is guest 1, update email/phone for all guests
        if (applySameContactToAll && index === 0 && (field === 'email' || field === 'phone')) {
            updatedGuests.forEach((guest, idx) => {
                if (idx > 0) {
                    updatedGuests[idx] = { ...updatedGuests[idx], [field]: value };
                }
            });
        }
        
        setGuests(updatedGuests);
        
        // Auto-highlight next guest when current guest is complete
        setTimeout(() => {
            if (isGuestCompleteCheck(updatedGuests[index]) && index < guests.length - 1) {
                setActiveGuestIndex(index + 1);
            }
        }, 100);
    };
    
    // Helper to check if a specific guest object is complete
    const isGuestCompleteCheck = (guest: any) => {
        return (
            guest.firstName.trim() !== '' &&
            guest.lastName.trim() !== '' &&
            guest.email.trim() !== '' &&
            guest.age.trim() !== '' &&
            guest.phone.trim() !== ''
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all fields and highlight errors
        const errors: {[key: string]: boolean} = {};
        let hasErrors = false;

        guests.forEach((guest, index) => {
            if (!guest.firstName.trim()) {
                errors[`${index}-firstName`] = true;
                hasErrors = true;
            }
            if (!guest.lastName.trim()) {
                errors[`${index}-lastName`] = true;
                hasErrors = true;
            }
            if (!guest.email.trim()) {
                errors[`${index}-email`] = true;
                hasErrors = true;
            }
            if (!guest.age.trim()) {
                errors[`${index}-age`] = true;
                hasErrors = true;
            }
            if (!guest.phone.trim()) {
                errors[`${index}-phone`] = true;
                hasErrors = true;
            }
        });

        if (hasErrors) {
            setFieldErrors(errors);
            toast.error('Please fill in all required fields');
            return;
        }

        // Clear errors if validation passes
        setFieldErrors({});
        
        // Read order_id directly from searchParams at submit time to ensure it's fresh
        const currentOrderId = searchParams.get('order_id');
        const currentEventId = searchParams.get('event_id');
        
        console.log('=== STEP 2: VISITOR DETAILS SUBMISSION ===');
        console.log('Order ID from URL:', currentOrderId);
        console.log('Event ID from URL:', currentEventId);
        console.log('Ticket Info:', ticketInfo);
        console.log('User:', user);
        console.log('Guests count:', guests.length);
        
        if (!currentOrderId || !currentEventId || !user || !ticketInfo) {
            console.error('Missing required information:', {
                orderId: currentOrderId,
                eventId: currentEventId,
                user: !!user,
                ticketInfo: !!ticketInfo
            });
            toast.error('Missing required information. Please try booking again.');
            return;
        }

        try {
            // Use first guest's email as communication email for booking
            const communicationEmail = guests[0]?.email || user?.email || '';
            
            console.log('📧 Communication email for booking:', communicationEmail);
            
            // Prepare visitor data matching Step 2 API structure WITH ticket details
            const visitorData = guests.map(guest => ({
                visitor_first_name: guest.firstName,
                visitor_last_name: guest.lastName,
                visitor_email: guest.email, // Use guest's own email (required for each guest)
                visitor_age: parseInt(guest.age),
                visitor_phone: guest.phone,
                // Add required ticket fields
                event_phase_ticket_id: ticketInfo.event_phase_ticket_id,
                ticket_name: ticketInfo.ticket_name,
                phase_id: ticketInfo.phase_id
            }));

            const updateData = {
                order_id: currentOrderId,
                visitors: visitorData,
                booking_status: 'Completed' as const,
                is_paid: false
            };

            console.log('Step 2 - API Payload:', JSON.stringify(updateData, null, 2));

            const updatedOrder = await bookingService.updateBooking(currentEventId, updateData);
            
            console.log('Step 2 - API Response:', updatedOrder);
            
            // Extract the correct order_id from response
            const finalOrderIdFromResponse = updatedOrder.id || currentOrderId;
            
            console.log('Step 2 - Final Order ID:', finalOrderIdFromResponse);
            
            // Log pricing before redirect
            const redirectBasePrice = searchParams.get('base_price');
            const redirectServiceFee = searchParams.get('service_fee');
            const redirectTaxes = searchParams.get('taxes');
            const redirectTotal = searchParams.get('total');
            
            console.log('💰 VisitorDetails - Pricing being passed to payment page:', {
                base_price: redirectBasePrice,
                service_fee: redirectServiceFee,
                taxes: redirectTaxes,
                total: redirectTotal,
                guests: guestCount
            });
            
            // Validate that we have pricing information (must be greater than 0)
            if (!redirectTotal || parseFloat(redirectTotal) <= 0) {
                console.error('❌ CRITICAL: Invalid total amount for payment redirect:', redirectTotal);
                toast.error('Pricing information is missing. Please start booking again.');
                return;
            }
            
            toast.success('Visitor details submitted! Redirecting to payment...');
            
            // Redirect to payment page with the correct order_id from Step 2 response
            const paymentUrl = `/booking/${currentEventId}/payment?order_id=${finalOrderIdFromResponse}&event_id=${currentEventId}&step2_complete=true&base_price=${redirectBasePrice}&service_fee=${redirectServiceFee}&taxes=${redirectTaxes}&total=${redirectTotal}&guests=${guestCount}&check_in=${searchParams.get('check_in')}&check_out=${searchParams.get('check_out')}`;
            
            console.log('💰 VisitorDetails - Payment URL:', paymentUrl);
            
            router.push(paymentUrl);
            
        } catch (error: any) {
            console.error('Step 2 failed:', error);
            toast.error(error.message || 'Failed to submit visitor details');
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not selected';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50">
            <BookingHeader />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Visitor Details</h1>
                
                {!ticketInfo ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading ticket information...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Visitor Details Form */}
                        <div className="lg:col-span-2">
                            {/* Email Prompt if user doesn't have email */}
                            {!user?.email && (
                                <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl shadow-sm">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Email Address (Optional)</h3>
                                            <p className="text-sm text-gray-600 mb-4">
                                                Add your email to receive booking confirmation. Guest email will be used if not provided.
                                            </p>
                                            <div className="space-y-3">
                                                <input
                                                    type="email"
                                                    value={userEmail}
                                                    onChange={(e) => setUserEmail(e.target.value)}
                                                    placeholder="Enter your email address"
                                                    className="w-full px-4 py-3 sm:py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A67AEB] focus:border-[#A67AEB] bg-white shadow-sm transition-all touch-manipulation"
                                                    style={{ minHeight: '44px' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleEmailUpdate}
                                                    disabled={isUpdatingEmail || !userEmail}
                                                    style={{ backgroundColor: isUpdatingEmail || !userEmail ? '#9CA3AF' : '#A67AEB' }}
                                                    className="w-full text-white py-3 px-4 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                                >
                                                    {isUpdatingEmail ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        'Save Email & Continue'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                    {guests.map((guest, index) => {
                        const isDisabled = index > 0 && !isGuestComplete(index - 1);
                        const isActive = activeGuestIndex === index;
                        
                        return (
                        <div 
                            key={index} 
                            onClick={() => !isDisabled && setActiveGuestIndex(index)}
                            className={`border-2 rounded-xl p-5 sm:p-6 space-y-5 transition-all duration-200 ${
                                isDisabled 
                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                                    : 'border-gray-200 bg-white cursor-pointer'
                            }`}
                        >
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                Guest {index + 1}
                                {isDisabled && <span className="ml-2 text-xs text-gray-500 font-normal">(Complete previous guest first)</span>}
                            </h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={guest.firstName}
                                        onChange={(e) => {
                                            handleInputChange(index, 'firstName', e.target.value);
                                            setFieldErrors(prev => ({...prev, [`${index}-firstName`]: false}));
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full px-4 py-3 sm:py-3.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A67AEB] focus:border-[#A67AEB] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all touch-manipulation ${
                                            fieldErrors[`${index}-firstName`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="First name"
                                        style={{ minHeight: '44px' }}
                                    />
                                    {fieldErrors[`${index}-firstName`] && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">First name is required</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={guest.lastName}
                                        onChange={(e) => {
                                            handleInputChange(index, 'lastName', e.target.value);
                                            setFieldErrors(prev => ({...prev, [`${index}-lastName`]: false}));
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full px-4 py-3 sm:py-3.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A67AEB] focus:border-[#A67AEB] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all touch-manipulation ${
                                            fieldErrors[`${index}-lastName`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Last name"
                                        style={{ minHeight: '44px' }}
                                    />
                                    {fieldErrors[`${index}-lastName`] && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">Last name is required</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={guest.email}
                                        onChange={(e) => {
                                            handleInputChange(index, 'email', e.target.value);
                                            setFieldErrors(prev => ({...prev, [`${index}-email`]: false}));
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full px-4 py-3 sm:py-3.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A67AEB] focus:border-[#A67AEB] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all touch-manipulation ${
                                            fieldErrors[`${index}-email`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="*Email ID"
                                        style={{ minHeight: '44px' }}
                                    />
                                    {fieldErrors[`${index}-email`] && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">Email is required</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Age <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={guest.age}
                                        onChange={(e) => {
                                            handleInputChange(index, 'age', e.target.value);
                                            setFieldErrors(prev => ({...prev, [`${index}-age`]: false}));
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full px-4 py-3 sm:py-3.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A67AEB] focus:border-[#A67AEB] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all touch-manipulation ${
                                            fieldErrors[`${index}-age`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter age"
                                        min="1"
                                        max="120"
                                        style={{ minHeight: '44px' }}
                                    />
                                    {fieldErrors[`${index}-age`] && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">Age is required</p>
                                    )}
                                </div>
                                
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={guest.phone}
                                        onChange={(e) => {
                                            handleInputChange(index, 'phone', e.target.value);
                                            setFieldErrors(prev => ({...prev, [`${index}-phone`]: false}));
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full px-4 py-3 sm:py-3.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A67AEB] focus:border-[#A67AEB] disabled:bg-gray-100 disabled:cursor-not-allowed transition-all touch-manipulation ${
                                            fieldErrors[`${index}-phone`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                        placeholder="*Phone Number"
                                        maxLength={10}
                                        style={{ minHeight: '44px' }}
                                    />
                                    {fieldErrors[`${index}-phone`] && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">Phone number is required</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Apply to all guests checkbox - Only show for Guest 1 */}
                            {index === 0 && guests.length > 1 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-purple-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={applySameContactToAll}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setApplySameContactToAll(isChecked);
                                                
                                                // If checked, apply guest 1's email and phone to all other guests
                                                if (isChecked && guest.email && guest.phone) {
                                                    const updatedGuests = guests.map((g, idx) => {
                                                        if (idx === 0) return g;
                                                        return {
                                                            ...g,
                                                            email: guest.email,
                                                            phone: guest.phone
                                                        };
                                                    });
                                                    setGuests(updatedGuests);
                                                    toast.success('Email and phone applied to all guests!');
                                                }
                                            }}
                                            className="w-5 h-5 mt-0.5 text-[#A67AEB] border-gray-300 rounded focus:ring-[#A67AEB] cursor-pointer"
                                            style={{ accentColor: '#A67AEB' }}
                                        />
                                        <span className="text-sm text-gray-700 font-medium flex-1">
                                            Apply same email and phone number to all guests
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>
                        );
                    })}
                    
                    {/* Desktop Payment Button - Hidden on Mobile */}
                    <div className="hidden lg:flex gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={!areAllDetailsFilled()}
                            style={{ backgroundColor: areAllDetailsFilled() ? '#A67AEB' : '#9CA3AF' }}
                            className="flex-1 font-bold py-4 px-6 rounded-lg transition-all duration-200 text-white shadow-md hover:shadow-lg hover:opacity-90 disabled:opacity-50"
                        >
                            {areAllDetailsFilled() ? 'Continue to Payment' : 'Fill All Details to Continue'}
                        </button>
                    </div>
                </form>
                        </div>

                        {/* Right Column - Booking Summary (Desktop Only) */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-28 space-y-6">
                                {/* Booking Summary Card */}
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                    <h2 className="text-xl font-bold text-black mb-4">Booking Summary</h2>
                                    
                                    {/* Property Name */}
                                    {bookingSummary.propertyName && (
                                        <div className="mb-4 pb-4 border-b border-gray-200">
                                            <p className="text-sm text-gray-600">Property</p>
                                            <p className="text-base font-semibold text-black">{bookingSummary.propertyName}</p>
                                        </div>
                                    )}
                                    
                                    {/* Dates and Guests */}
                                    <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm text-gray-600">Check-in</p>
                                                <p className="text-base font-medium text-black">
                                                    {formatDate(bookingSummary.checkIn)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Check-out</p>
                                                <p className="text-base font-medium text-black">
                                                    {formatDate(bookingSummary.checkOut)}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Guests</p>
                                            <p className="text-base font-medium text-black">
                                                {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Price Breakdown */}
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-black mb-3">Price Details</h3>
                                        
                                        {bookingSummary.total > 0 ? (
                                            <>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Base price</span>
                                                        <span className="text-black font-medium">
                                                            {formatPrice(bookingSummary.basePrice)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Service fee</span>
                                                        <span className="text-black font-medium">
                                                            {formatPrice(bookingSummary.serviceFee)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Taxes</span>
                                                        <span className="text-black font-medium">
                                                            {formatPrice(bookingSummary.taxes)}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="border-t border-gray-200 pt-3 mt-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-lg font-bold text-black">Total (INR)</span>
                                                        <span className="text-lg font-bold text-black">
                                                            {formatPrice(bookingSummary.total)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                                    <p className="text-sm text-gray-600">Loading pricing...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Payment Bar - Sticky at bottom */}
            <MobilePaymentBar
                totalAmount={bookingSummary.total}
                isDisabled={!areAllDetailsFilled()}
                buttonText={areAllDetailsFilled() ? 'Continue to Payment' : 'Fill Details First'}
                onPayClick={(e) => {
                    e.preventDefault();
                    if (areAllDetailsFilled()) {
                        handleSubmit(e as any);
                    }
                }}
            />

            {/* Mobile bottom spacing for fixed payment bar */}
            <div className="h-24 lg:hidden"></div>
        </div>
    );
};

export default VisitorDetailsPage;

