"use client";

import React, { useRef } from "react";

interface SimpleOTPInputProps {
    otp: string[];
    onOtpChange: (otp: string[]) => void;
}

export default function SimpleOTPInput({ otp, onOtpChange }: SimpleOTPInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const setOtpFromValue = (value: string) => {
        const normalized = value.replace(/\D/g, "").slice(0, 4);
        const next: string[] = ["", "", "", ""];
        normalized.split("").forEach((d, i) => {
            next[i] = d;
        });
        onOtpChange(next);
    };

    const value = otp.join("");

    return (
        <div className="mb-8 flex justify-center px-4">
            <input
                ref={inputRef}
                type="tel"
                name="otp"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                value={value}
                maxLength={4}
                onChange={(event) => setOtpFromValue(event.target.value)}
                onInput={(event) => setOtpFromValue(event.currentTarget.value)}
                onPaste={(event) => {
                    event.preventDefault();
                    setOtpFromValue(event.clipboardData.getData("text"));
                }}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                aria-label="One-time password"
                enterKeyHint="done"
                placeholder="••••"
                className="h-16 w-64 rounded-lg border-2 border-white/10 bg-[#1a1c2e] px-8 text-center font-mono text-3xl tracking-[0.9em] text-white outline-none transition-all placeholder:text-white/25 focus:border-[#AF7AEB]"
            />
        </div>
    );
}
