"use client";

import React, { useRef, useState } from "react";

interface SimpleOTPInputProps {
    otp: string[];
    onOtpChange: (otp: string[]) => void;
}

export default function SimpleOTPInput({ otp, onOtpChange }: SimpleOTPInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pasted, setPasted] = useState(false);

    const setOtpFromValue = (value: string) => {
        const normalized = value.replace(/\D/g, "").slice(0, 4);
        const next: string[] = ["", "", "", ""];
        normalized.split("").forEach((d, i) => { next[i] = d; });
        onOtpChange(next);
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const digits = text.replace(/\D/g, "").slice(0, 4);
            if (digits.length === 4) {
                setOtpFromValue(digits);
                setPasted(true);
                setTimeout(() => setPasted(false), 2000);
            } else {
                inputRef.current?.focus();
            }
        } catch {
            inputRef.current?.focus();
        }
    };

    const value = otp.join("");

    return (
        <form
            autoComplete="on"
            className="mb-6 flex flex-col items-center gap-3 px-4"
            onSubmit={(event) => event.preventDefault()}
        >
            <input
                ref={inputRef}
                id="one-time-code"
                type="text"
                name="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
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
            <button
                type="button"
                onClick={handlePasteFromClipboard}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                    pasted
                        ? "border-[#B7F041]/60 bg-[#B7F041]/15 text-[#B7F041]"
                        : "border-white/20 bg-white/5 text-white/60 active:scale-95"
                }`}
            >
                {pasted ? "✓ OTP filled!" : "Paste OTP"}
            </button>
        </form>
    );
}
