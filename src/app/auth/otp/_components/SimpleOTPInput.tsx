"use client";

import React, { useEffect, useRef, useState } from "react";

interface SimpleOTPInputProps {
    otp: string[];
    onOtpChange: (otp: string[]) => void;
}

export default function SimpleOTPInput({ otp, onOtpChange }: SimpleOTPInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);

    // When otp is reset externally (e.g. on Resend), sync the real DOM input too
    useEffect(() => {
        if (inputRef.current) {
            const domValue = inputRef.current.value;
            const stateValue = otp.join("");
            if (domValue !== stateValue) {
                inputRef.current.value = stateValue;
            }
        }
    }, [otp]);

    const handleInput = () => {
        const raw = inputRef.current?.value ?? "";
        // Keep only digits, max 4
        const normalized = raw.replace(/\D/g, "").slice(0, 4);
        // Keep DOM clean
        if (inputRef.current && inputRef.current.value !== normalized) {
            inputRef.current.value = normalized;
        }
        const next: string[] = ["", "", "", ""];
        normalized.split("").forEach((d, i) => {
            next[i] = d;
        });
        onOtpChange(next);
    };

    const filledCount = otp.join("").length;

    return (
        <div
            className="relative mb-8 flex justify-center gap-4 px-4"
            onClick={() => inputRef.current?.focus()}
        >
            {/*
             * UNCONTROLLED input (no value prop).
             * Browser can autofill freely — no React interference.
             * opacity:0.01 keeps it "visible" for SMS autofill banner.
             * onInput fires for both typing and autofill.
             */}
            <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                onInput={handleInput}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                aria-label="One-time password"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0.01,
                    cursor: "text",
                    zIndex: 10,
                    fontSize: "1px",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                }}
            />

            {/* Visual boxes — pointer-events:none so clicks pass to the real input */}
            {otp.map((digit, index) => (
                <div
                    key={index}
                    style={{ pointerEvents: "none" }}
                    className={`flex h-16 w-16 items-center justify-center rounded-lg border-2 bg-[#1a1c2e] text-2xl font-normal text-white transition-all ${
                        focused && index === filledCount
                            ? "border-[#AF7AEB]"
                            : "border-white/10"
                    }`}
                >
                    {digit}
                </div>
            ))}
        </div>
    );
}
