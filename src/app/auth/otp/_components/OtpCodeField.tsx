"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/** Pull a 4-digit OTP from raw paste/SMS text (e.g. "Use OTP 2847 to log in..."). */
export function extractOtpDigits(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return "";

    const patterns = [
        /\bOTP[:\s]*(\d{4})\b/i,
        /\bcode[:\s]*(\d{4})\b/i,
        /\b(\d{4})\b/,
    ];
    for (const re of patterns) {
        const m = trimmed.match(re);
        if (m?.[1]) return m[1];
    }

    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= 4) return digits.slice(-4);
    return digits.slice(0, 4);
}

export function otpArrayFromString(code: string): string[] {
    const digits = extractOtpDigits(code);
    const next = ["", "", "", ""];
    digits.split("").forEach((d, i) => {
        next[i] = d;
    });
    return next;
}

interface OtpCodeFieldProps {
    otp: string[];
    onOtpChange: (otp: string[]) => void;
    onComplete?: (code: string) => void;
}

export default function OtpCodeField({ otp, onOtpChange, onComplete }: OtpCodeFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pasted, setPasted] = useState(false);
    const lastEmitted = useRef("");

    const applyCode = useCallback(
        (raw: string) => {
            const next = otpArrayFromString(raw);
            const joined = next.join("");
            if (joined === lastEmitted.current) return;
            lastEmitted.current = joined;
            onOtpChange(next);
            if (joined.length === 4) {
                onComplete?.(joined);
            }
        },
        [onOtpChange, onComplete]
    );

    const syncFromDom = useCallback(() => {
        const el = inputRef.current;
        if (!el) return;
        applyCode(el.value);
    }, [applyCode]);

    // iOS / Chrome autofill often skips React onChange — listen on the real DOM node
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;

        const onNativeInput = () => syncFromDom();
        const onNativeChange = () => syncFromDom();

        el.addEventListener("input", onNativeInput);
        el.addEventListener("change", onNativeChange);

        // WebKit autofill fires a short animation on the field
        const onAnimation = (e: AnimationEvent) => {
            if (e.animationName === "spoto-otp-autofill") {
                syncFromDom();
            }
        };
        el.addEventListener("animationstart", onAnimation);

        const poll = window.setInterval(syncFromDom, 400);
        const stopPoll = window.setTimeout(() => window.clearInterval(poll), 8000);

        return () => {
            el.removeEventListener("input", onNativeInput);
            el.removeEventListener("change", onNativeChange);
            el.removeEventListener("animationstart", onAnimation);
            window.clearInterval(poll);
            window.clearTimeout(stopPoll);
        };
    }, [syncFromDom]);

    // Keep DOM in sync when parent sets OTP (Web OTP API, paste handler on page)
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        const joined = otp.join("");
        if (el.value !== joined) {
            el.value = joined;
            lastEmitted.current = joined;
        }
    }, [otp]);

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const digits = extractOtpDigits(text);
            if (digits.length === 4) {
                if (inputRef.current) inputRef.current.value = digits;
                applyCode(digits);
                setPasted(true);
                window.setTimeout(() => setPasted(false), 2000);
            } else {
                inputRef.current?.focus();
            }
        } catch {
            inputRef.current?.focus();
        }
    };

    return (
        <>
            <style>{`
                @keyframes spoto-otp-autofill {
                    from { opacity: 1; }
                    to { opacity: 1; }
                }
                .spoto-otp-input:-webkit-autofill {
                    animation-name: spoto-otp-autofill;
                    animation-duration: 0.01s;
                }
            `}</style>
            <form
                autoComplete="on"
                className="mb-6 flex flex-col items-center gap-3 px-4"
                onSubmit={(e) => e.preventDefault()}
            >
                {/* Helps iOS associate SMS OTP with this field */}
                <input
                    type="tel"
                    name="tel"
                    autoComplete="tel"
                    tabIndex={-1}
                    aria-hidden
                    className="pointer-events-none absolute h-0 w-0 opacity-0"
                    defaultValue=""
                    readOnly
                />
                <input
                    ref={inputRef}
                    id="otp"
                    name="otp"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={4}
                    onInput={syncFromDom}
                    onChange={syncFromDom}
                    onPaste={(e) => {
                        e.preventDefault();
                        applyCode(e.clipboardData.getData("text"));
                    }}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    aria-label="One-time password"
                    enterKeyHint="done"
                    placeholder="Enter 4-digit OTP"
                    className="spoto-otp-input h-16 w-full max-w-[16rem] rounded-lg border-2 border-white/10 bg-[#1a1c2e] px-4 text-center font-mono text-3xl tracking-[0.5em] text-white outline-none transition-all placeholder:text-sm placeholder:tracking-normal placeholder:text-white/35 focus:border-[#AF7AEB]"
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
                    {pasted ? "OTP pasted" : "Paste from SMS"}
                </button>
            </form>
        </>
    );
}
