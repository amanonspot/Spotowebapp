"use client";
import React from "react";

interface MobilePaymentBarProps {
    totalAmount: number;
    isDisabled: boolean;
    buttonText: string;
    onPayClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function MobilePaymentBar({
    totalAmount,
    isDisabled,
    buttonText,
    onPayClick,
}: MobilePaymentBarProps) {
    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-50 lg:hidden shadow-2xl">
            <div className="flex items-center justify-between gap-4">
                {/* Total Amount */}
                <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                    <p className="text-xl font-bold text-black">
                        {totalAmount > 0 ? formatPrice(totalAmount) : '...'}
                    </p>
                </div>

                {/* Pay Button - Brand Color */}
                <button
                    onClick={onPayClick}
                    disabled={isDisabled}
                    style={{ 
                        backgroundColor: isDisabled ? '#9CA3AF' : '#A67AEB',
                        minHeight: '48px'
                    }}
                    className="font-bold py-4 px-8 rounded-lg transition-all duration-200 whitespace-nowrap text-white shadow-lg hover:shadow-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
}

