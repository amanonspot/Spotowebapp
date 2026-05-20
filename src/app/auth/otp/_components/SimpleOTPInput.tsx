"use client";

import React, { useRef } from "react";

interface SimpleOTPInputProps {
    otp: string[];
    onOtpChange: (otp: string[]) => void;
}

export default function SimpleOTPInput({ otp, onOtpChange }: SimpleOTPInputProps) {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const focusIndex = (index: number) => {
        inputRefs.current[index]?.focus();
    };

    const handleChange = (index: number, value: string) => {
        const normalized = value.replace(/\D/g, "");
        if (!normalized) {
            const next = [...otp];
            next[index] = "";
            onOtpChange(next);
            return;
        }

        // SMS autofill / paste fills multiple digits at once
        if (normalized.length > 1) {
            const next = ["", "", "", ""];
            normalized.slice(0, 4).split("").forEach((digit, offset) => {
                if (offset < 4) next[offset] = digit;
            });
            onOtpChange(next);
            focusIndex(Math.min(normalized.length - 1, 3));
            return;
        }

        const next = [...otp];
        next[index] = normalized;
        onOtpChange(next);
        if (index < 3) focusIndex(index + 1);
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace") {
            if (otp[index]) {
                const next = [...otp];
                next[index] = "";
                onOtpChange(next);
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
        digits.split("").forEach((d, i) => { next[i] = d; });
        onOtpChange(next);
        focusIndex(Math.min(digits.length - 1, 3));
    };

    return (
        <div className="mb-8 flex justify-center gap-4 px-4">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(node) => { inputRefs.current[index] = node; }}
                    type="tel"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={4}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    autoFocus={index === 0}
                    className="h-16 w-16 rounded-lg border-2 border-white/10 bg-[#1a1c2e] text-center text-2xl font-normal text-white transition-all focus:border-[#AF7AEB] focus:outline-none"
                />
            ))}
        </div>
    );
}
