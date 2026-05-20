"use client";

import React, { useEffect, useRef, useState } from "react";

interface SimpleOTPInputProps {
    otp: string[];
    onOtpChange: (otp: string[]) => void;
}

export default function SimpleOTPInput({ otp, onOtpChange }: SimpleOTPInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        if (otp.join("") === "" && inputRef.current?.value) {
            inputRef.current.value = "";
        }
    }, [otp]);

    const updateOtpFromInput = () => {
        const raw = inputRef.current?.value ?? "";
        const normalized = raw.replace(/\D/g, "").slice(0, 4);

        if (inputRef.current && inputRef.current.value !== normalized) {
            inputRef.current.value = normalized;
        }

        const next: string[] = ["", "", "", ""];
        normalized.split("").forEach((d, i) => {
            next[i] = d;
        });
        onOtpChange(next);
    };

    const handleInput = () => {
        updateOtpFromInput();
        requestAnimationFrame(updateOtpFromInput);
        window.setTimeout(updateOtpFromInput, 50);
        window.setTimeout(updateOtpFromInput, 150);
        window.setTimeout(updateOtpFromInput, 300);
    };

    const startShortPolling = () => {
        setFocused(true);
        inputRef.current?.focus();

        const startedAt = Date.now();
        const poll = window.setInterval(() => {
            updateOtpFromInput();
            if (Date.now() - startedAt > 2500 || (inputRef.current?.value ?? "").length >= 4) {
                window.clearInterval(poll);
            }
        }, 100);
    };

    const filledCount = otp.join("").length;

    return (
        <div
            className="relative mb-8 flex justify-center gap-4 px-4"
            onClick={startShortPolling}
        >
            {/*
             * Real uncontrolled input. It stays full size and visible to the browser
             * so Android/iOS OTP autofill writes the complete code into one field.
             * Text is transparent; the boxes below are the visible UI.
             */}
            <input
                ref={inputRef}
                type="tel"
                name="otp"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={4}
                onInput={handleInput}
                onChange={handleInput}
                onFocus={startShortPolling}
                onBlur={() => setFocused(false)}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                aria-label="One-time password"
                enterKeyHint="done"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 1,
                    cursor: "text",
                    zIndex: 10,
                    color: "transparent",
                    caretColor: "transparent",
                    fontSize: "24px",
                    letterSpacing: "40px",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    WebkitTextFillColor: "transparent",
                }}
            />

            {/* Visual boxes: clicks pass through to the real input above. */}
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
