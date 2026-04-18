"use client";

import React, { useState } from "react";
import UPIOptions from "./UPIOptions";
import CreditDebitOptions from "./CreditDebitOptions";

interface PaymentMethod {
    type: "upi" | "card";
    value: string;
}

const PaymentOptions: React.FC = () => {
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>({
        type: "upi",
        value: "googlepay",
    });

    const handlePaymentChange = (type: "upi" | "card", value: string) => {
        setSelectedPayment({ type, value });
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-black mb-1 sm:mb-2">
                    Pay with
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                    Multiple payments to choose from
                </p>
            </div>

            {/* UPI Options */}
            <UPIOptions
                selectedPayment={selectedPayment}
                onPaymentChange={handlePaymentChange}
            />

            {/* Credit & Debit Cards */}
            <CreditDebitOptions
                selectedPayment={selectedPayment}
                onPaymentChange={handlePaymentChange}
            />
        </div>
    );
};

export default PaymentOptions;
