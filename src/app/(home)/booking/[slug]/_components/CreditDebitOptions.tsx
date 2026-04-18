"use client";

import React from "react";

interface PaymentMethod {
    type: "upi" | "card";
    value: string;
}

interface CreditDebitOptionsProps {
    selectedPayment: PaymentMethod;
    onPaymentChange: (type: "upi" | "card", value: string) => void;
}

const CreditDebitOptions: React.FC<CreditDebitOptionsProps> = ({
    selectedPayment,
    onPaymentChange,
}) => {
    const isSelected = selectedPayment.type === "card";
    const selectedCard = selectedPayment.value;

    return (
        <div>
            <h3 className="text-base sm:text-lg font-medium text-black mb-4 sm:mb-5">
                Credit & Debit Cards
            </h3>

            <div className="space-y-3 sm:space-y-4">
                {/* Axis Bank Card */}
                <div
                    className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                        isSelected && selectedCard === "axis"
                            ? "border-green-500 bg-green-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => onPaymentChange("card", "axis")}
                >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs sm:text-sm font-bold">
                                A
                            </span>
                        </div>
                        <div>
                            <p className="text-black font-medium text-sm sm:text-base">
                                Axis Bank
                            </p>
                            <p className="text-gray-600 text-xs sm:text-sm">
                                •••• 8395
                            </p>
                        </div>
                    </div>
                    <input
                        type="radio"
                        name="payment-method"
                        value="axis"
                        checked={isSelected && selectedCard === "axis"}
                        onChange={() => onPaymentChange("card", "axis")}
                        className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    />
                </div>

                {/* HDFC Bank Card */}
                <div
                    className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                        isSelected && selectedCard === "hdfc"
                            ? "border-green-500 bg-green-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => onPaymentChange("card", "hdfc")}
                >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs sm:text-sm font-bold">
                                V
                            </span>
                        </div>
                        <div>
                            <p className="text-black font-medium text-sm sm:text-base">
                                VISA HDFC Bank
                            </p>
                            <p className="text-gray-600 text-xs sm:text-sm">
                                •••• 6246
                            </p>
                        </div>
                    </div>
                    <input
                        type="radio"
                        name="payment-method"
                        value="hdfc"
                        checked={isSelected && selectedCard === "hdfc"}
                        onChange={() => onPaymentChange("card", "hdfc")}
                        className="w-4 h-4 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    />
                </div>
            </div>

            {/* Add new Credit Card */}
            <button className="text-purple-600 text-sm font-medium hover:underline mt-3 sm:mt-4 transition-colors duration-200">
                + Add new Credit Card
            </button>
        </div>
    );
};

export default CreditDebitOptions;
