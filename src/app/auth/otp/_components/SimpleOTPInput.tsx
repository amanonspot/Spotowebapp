"use client";

import React, { useRef } from "react";

interface SimpleOTPInputProps {
    otp: string[];
    onOtpChange: (otp: string[]) => void;
}

export default function SimpleOTPInput({ otp, onOtpChange }: SimpleOTPInputProps) {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const setDigit = (index: number, digit: string) => {
        const next = [...otp];
        next[index] = digit;
        onOtpChange(next);
    };

    const focusIndex = (index: number) => {
        const target = inputRefs.current[index];
        target?.focus();
    };

    const handleChange = (index: number, value: string) => {
        const normalized = value.replace(/\D/g, "");
        if (!normalized) {
            setDigit(index, "");
            return;
        }

        if (normalized.length > 1) {
            const next = [...otp];
            normalized.slice(0, 4).split("").forEach((digit, offset) => {
                const targetIndex = index + offset;
                if (targetIndex < 4) next[targetIndex] = digit;
            });
            onOtpChange(next);
            focusIndex(Math.min(index + normalized.length, 3));
            return;
        }

        setDigit(index, normalized);
        if (index < 3) focusIndex(index + 1);
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace") {
            if (otp[index]) {
                setDigit(index, "");
            } else if (index > 0) {
                focusIndex(index - 1);
            }
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
        if (!digits) return;

        const next = ["", "", "", ""];
        digits.split("").forEach((digit, index) => {
            next[index] = digit;
        });
        onOtpChange(next);
        focusIndex(Math.min(digits.length, 3));
    };

    return (
        <div className="mb-8 flex justify-center gap-4 px-4">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(node) => {
                        inputRefs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={handlePaste}
                    autoFocus={index === 0}
                    className="h-16 w-16 rounded-lg border-2 border-white/10 bg-[#1a1c2e] text-center text-2xl font-normal text-white transition-all focus:border-[#AF7AEB] focus:outline-none"
                />
            ))}
        </div>
    );
}

