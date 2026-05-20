"use client";

import React, { useRef, useState } from "react";

interface SimpleOTPInputProps {
    otp: string[];
    onOtpChange: (otp: string[]) => void;
}

export default function SimpleOTPInput({ otp, onOtpChange }: SimpleOTPInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);

    const value = otp.join("");
    const filledCount = value.length;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = e.target.value.replace(/\D/g, "").slice(0, 4);
        const next: string[] = ["", "", "", ""];
        normalized.split("").forEach((d, i) => {
            next[i] = d;
        });
        onOtpChange(next);
    };

    return (
        <div
            className="relative mb-8 flex justify-center gap-4 px-4"
            onClick={() => inputRef.current?.focus()}
        >
            {/*
             * Single real <input> — absolutely positioned over the boxes.
             * Text/caret are transparent so only the visual boxes below are visible.
             * autoComplete="one-time-code" + type="tel" is what triggers SMS OTP
             * banner on Android & iOS.
             */}
            <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={value}
                maxLength={4}
                onChange={handleChange}
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
                    opacity: 0.01,          // not 0 — keeps the element "visible" for browser autofill
                    cursor: "text",
                    zIndex: 10,
                    fontSize: "1px",        // tiny so the blinking cursor doesn't peek through
                }}
            />

            {/* Visual digit boxes (pointer-events none so clicks pass through to the real input) */}
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
