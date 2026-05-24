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

/** iOS Chrome (CriOS) does not get Apple's SMS OTP autofill — only Safari does. */
function isIosChrome(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/i.test(ua) && /CriOS/i.test(ua);
}

/**
 * 4 visible boxes + one transparent input on top.
 * iOS/Android autofill only works reliably on a single field with autocomplete="one-time-code".
 */
export default function OtpCodeField({ otp, onOtpChange, onComplete }: OtpCodeFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pasted, setPasted] = useState(false);
    const iosChrome = typeof window !== "undefined" && isIosChrome();

    const applyCode = useCallback(
        (raw: string) => {
            const next = otpArrayFromString(raw);
            const joined = next.join("");
            onOtpChange(next);
            if (inputRef.current && inputRef.current.value !== joined) {
                inputRef.current.value = joined;
            }
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

    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;

        const onInput = () => syncFromDom();
        const onChange = () => syncFromDom();

        el.addEventListener("input", onInput);
        el.addEventListener("change", onChange);

        const onAnimation = (e: AnimationEvent) => {
            if (e.animationName === "spoto-otp-autofill") {
                syncFromDom();
            }
        };
        el.addEventListener("animationstart", onAnimation);

        // SMS often arrives 5–30s after page load — keep syncing until user leaves
        const poll = window.setInterval(syncFromDom, 250);

        const focusTimer = window.setTimeout(() => el.focus(), 300);

        return () => {
            el.removeEventListener("input", onInput);
            el.removeEventListener("change", onChange);
            el.removeEventListener("animationstart", onAnimation);
            window.clearInterval(poll);
            window.clearTimeout(focusTimer);
        };
    }, [syncFromDom]);

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const digits = extractOtpDigits(text);
            if (digits.length === 4) {
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

    const boxClass =
        "flex h-16 w-14 items-center justify-center rounded-lg border-2 border-white/10 bg-[#1a1c2e] text-2xl font-normal text-white";

    return (
        <>
            <style>{`
                @keyframes spoto-otp-autofill {
                    from { opacity: 1; }
                    to { opacity: 1; }
                }
                .spoto-otp-autofill-target:-webkit-autofill {
                    animation-name: spoto-otp-autofill;
                    animation-duration: 0.01s;
                }
            `}</style>
            <form
                autoComplete="on"
                className="mb-6 flex flex-col items-center gap-4 px-4"
                onSubmit={(e) => e.preventDefault()}
            >
                <div className="relative flex justify-center gap-3">
                    {[0, 1, 2, 3].map((index) => (
                        <div
                            key={index}
                            className={`${boxClass} ${otp[index] ? "border-[#AF7AEB]/50" : ""}`}
                            aria-hidden
                        >
                            {otp[index] || ""}
                        </div>
                    ))}

                    {/* Real field: receives keyboard, iOS "From Messages", Android Web OTP */}
                    <input
                        ref={inputRef}
                        type="text"
                        name="one-time-code"
                        id="one-time-code"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        maxLength={4}
                        defaultValue=""
                        onInput={syncFromDom}
                        onChange={syncFromDom}
                        onPaste={(e) => {
                            e.preventDefault();
                            applyCode(e.clipboardData.getData("text"));
                        }}
                        aria-label="Enter 4-digit OTP"
                        enterKeyHint="done"
                        className="spoto-otp-autofill-target absolute inset-0 z-10 h-full w-full cursor-text opacity-[0.02] text-transparent caret-transparent"
                        style={{ fontSize: "16px", letterSpacing: "0.5em" }}
                    />
                </div>

                {iosChrome ? (
                    <p className="max-w-xs text-center text-xs leading-relaxed text-[#E8DBFF]/90">
                        iPhone Chrome does not support automatic OTP from Messages (Apple
                        limitation). Copy the code from SMS, then tap the button below.
                    </p>
                ) : (
                    <p className="text-center text-xs text-white/45">
                        Tap the boxes — Safari may show OTP above the keyboard
                    </p>
                )}

                <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className={`flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all ${
                        pasted
                            ? "border-[#B7F041]/60 bg-[#B7F041]/15 text-[#B7F041]"
                            : iosChrome
                              ? "border-[#A67AEB]/55 bg-[#A67AEB]/20 text-[#E8DBFF] active:scale-95"
                              : "border-white/20 bg-white/5 text-white/60 active:scale-95"
                    }`}
                >
                    {pasted ? "OTP pasted" : "Paste from SMS"}
                </button>
            </form>
        </>
    );
}
