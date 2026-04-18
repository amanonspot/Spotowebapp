"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBooking } from "@/lib/hooks/useBooking";
import { useAuth } from "@/lib/hooks/useAuth";
import { bookingService } from "@/lib/api";
import toast from "react-hot-toast";

interface ConfirmPayButtonProps {
    bookingData?: any;
    orderId?: string;
}

const ConfirmPayButton: React.FC<ConfirmPayButtonProps> = ({ bookingData, orderId: propOrderId }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    // Get order ID from URL params or props
    const orderId = propOrderId || searchParams.get('order_id');
    const eventId = searchParams.get('event_id');

    const handleConfirmPay = async () => {
        if (!orderId) {
            toast.error('Order ID not found. Please try booking again.');
            return;
        }

        if (!user) {
            toast.error('Please login to proceed with payment.');
            router.push('/auth/login');
            return;
        }

        setIsProcessing(true);
        
        try {
            console.log('=== STEP 3: PAYMENT INITIATION ===');
            console.log('Order ID:', orderId);
            console.log('User:', user);
            console.log('Booking Data received:', bookingData);
            console.log('Booking Data total:', bookingData?.total);
            console.log('URL param total:', searchParams.get('total'));
            
            // CRITICAL: Always calculate total from components to ensure accuracy
            // Get pricing components from URL params
            const basePrice = parseFloat(searchParams.get('base_price') || '0');
            const serviceFee = parseFloat(searchParams.get('service_fee') || '0');
            const taxes = parseFloat(searchParams.get('taxes') || '0');
            const totalFromUrl = searchParams.get('total');
            
            console.log('💰 URL Pricing Components:', {
                basePrice,
                serviceFee,
                taxes,
                totalFromUrl
            });
            
            // Calculate total amount from components (most reliable)
            let amount = 0;
            
            // If we have base_price, calculate total from components
            if (basePrice > 0) {
                amount = basePrice + serviceFee + taxes;
                console.log('✅ Amount calculated from components:', amount);
            } 
            // Fall back to URL total parameter
            else if (totalFromUrl) {
                amount = parseFloat(totalFromUrl);
                console.log('✅ Amount from URL total parameter:', amount);
            }
            // Fall back to booking data
            else if (bookingData?.total) {
                amount = bookingData.total;
                console.log('✅ Amount from booking data:', amount);
            }
            
            console.log('💰 CRITICAL - Final payment amount:', amount);
            console.log('💰 This amount includes base + service fee + taxes');
            
            // Validate that we have a valid amount
            if (amount <= 0) {
                console.error('❌ CRITICAL ERROR: Payment amount is invalid or missing:', amount);
                console.error('❌ All URL parameters:', {
                    total: searchParams.get('total'),
                    base_price: searchParams.get('base_price'),
                    service_fee: searchParams.get('service_fee'),
                    taxes: searchParams.get('taxes')
                });
                toast.error('Pricing information is missing. Please start the booking again from the property page.');
                setIsProcessing(false);
                return;
            }
            
            console.log('💰 FINAL - Payment amount (Total with taxes):', amount);
            console.log('💰 FINAL - Amount is valid:', amount > 0 ? 'YES ✅' : 'NO ❌');
            console.log('💰 This includes: Base (₹' + basePrice + ') + Service Fee (₹' + serviceFee + ') + Taxes (₹' + taxes + ') = ₹' + amount);
            
            // Create payment session with correct payload
            // Send amount in rupees (the backend/Juspay will handle paise conversion if needed)
            // Note: Backend should configure success_url and failure_url for payment gateway callbacks
            const successUrl = `${window.location.origin}/booking/${searchParams.get('event_id')}/payment/success?order_id=${orderId}`;
            const failureUrl = `${window.location.origin}/booking/${searchParams.get('event_id')}/payment?order_id=${orderId}&payment_failed=true`;
            
            const paymentData = {
                amount: amount,  // Total amount in rupees (including all taxes and fees)
                order_id: orderId,
                customer_id: user.id,
                customer_phone: user.phone || '',
                customer_email: user.email || '',
                payment_page_client_id: 'spoto',
                action: 'paymentPage' as const,
                return_url: successUrl,  // Success callback
                cancel_url: failureUrl   // Failure/cancel callback
            };

            console.log('Step 3 - Payment session payload:', JSON.stringify(paymentData, null, 2));
            console.log('💰💰💰 FINAL AMOUNT BEING SENT:', paymentData.amount, 'RUPEES 💰💰💰');
            console.log('💰💰💰 THIS SHOULD SHOW AS ₹' + paymentData.amount + ' IN PAYMENT GATEWAY 💰💰💰');

            const paymentSession = await bookingService.initiatePaymentSession(paymentData);

            console.log('Payment session created:', paymentSession);

            if (paymentSession.data?.payment_links?.web) {
                // Redirect to payment gateway using the correct path
                toast.success('Redirecting to payment gateway...');
                window.location.href = paymentSession.data.payment_links.web;
            } else {
                console.error('Payment links not found in response:', paymentSession);
                toast.error('Payment gateway not available. Please try again.');
            }
        } catch (error: any) {
            console.error('Payment initiation failed:', error);
            toast.error(error.message || 'Failed to initiate payment. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200">
            <button
                onClick={handleConfirmPay}
                disabled={isProcessing || !orderId || !user}
                className={`w-full font-semibold py-3 sm:py-4 px-6 rounded-lg transition-all duration-200 text-base sm:text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2 ${
                    isProcessing || !orderId || !user
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white hover:shadow-lg transform hover:-translate-y-0.5 focus:ring-green-500'
                }`}
            >
                {isProcessing && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                )}
                {isProcessing ? 'Processing...' : 'Confirm and pay'}
            </button>
            <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 leading-relaxed">
                You will be redirected to the payment gateway. After successful payment, your booking will be submitted for admin confirmation.
            </p>
            {!orderId && (
                <p className="text-center text-xs text-red-600 mt-2">
                    Order ID missing. Please try booking again.
                </p>
            )}
            {!user && (
                <p className="text-center text-xs text-red-600 mt-2">
                    Please login to proceed with payment.
                </p>
            )}
        </div>
    );
};

export default ConfirmPayButton;
