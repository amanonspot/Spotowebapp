"use client";

import React from "react";

interface PaymentMethod {
    type: "upi" | "card";
    value: string;
}

interface UPIOptionsProps {
    selectedPayment: PaymentMethod;
    onPaymentChange: (type: "upi" | "card", value: string) => void;
}

const UPIOptions: React.FC<UPIOptionsProps> = ({
    selectedPayment,
    onPaymentChange,
}) => {
    const isSelected = selectedPayment.type === "upi";
    const selectedUPI = selectedPayment.value;

    return (
        <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-medium text-black mb-4 sm:mb-5">
                UPI
            </h3>

            <div className="space-y-3 sm:space-y-4">
                {/* Google Pay */}
                <div
                    className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                        isSelected && selectedUPI === "googlepay"
                            ? "border-green-500 bg-green-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => onPaymentChange("upi", "googlepay")}
                >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs sm:text-sm font-bold">
                                G
                            </span>
                        </div>
                        <span className="text-black font-medium text-sm sm:text-base">
                            Google Pay
                        </span>
                    </div>
                    <input
                        type="radio"
                        name="payment-method"
                        value="googlepay"
                        checked={isSelected && selectedUPI === "googlepay"}
                        onChange={() => onPaymentChange("upi", "googlepay")}
                        className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    />
                </div>

                {/* PhonePe */}
                <div
                    className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                        isSelected && selectedUPI === "phonepe"
                            ? "border-green-500 bg-green-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => onPaymentChange("upi", "phonepe")}
                >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs sm:text-sm font-bold">
                                P
                            </span>
                        </div>
                        <span className="text-black font-medium text-sm sm:text-base">
                            PhonePe
                        </span>
                    </div>
                    <input
                        type="radio"
                        name="payment-method"
                        value="phonepe"
                        checked={isSelected && selectedUPI === "phonepe"}
                        onChange={() => onPaymentChange("upi", "phonepe")}
                        className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    />
                </div>
            </div>

            {/* Add new UPI ID */}
            <button className="text-purple-600 text-sm font-medium hover:underline mt-3 sm:mt-4 transition-colors duration-200">
                + Add new UPI ID
            </button>
        </div>
    );
};

export default UPIOptions;
