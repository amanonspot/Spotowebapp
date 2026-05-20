"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DesktopOTPView from "./_components/DesktopOTPView";
import MobileOTPView from "./_components/MobileOTPView";
import { useAuth } from "@/lib/hooks/useAuth";
import { clearAuthIntent, consumeAuthIntentDestination } from "@/lib/auth/authIntent";
import toast from "react-hot-toast";

const resolvePostLoginDestination = () => consumeAuthIntentDestination() || "/";

export default function OTPPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phoneNumber = searchParams.get("phone") || "";

    const { verifyOtp, requestOtp, continueAsGuest, error } = useAuth();

    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(600);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [localError, setLocalError] = useState<string | undefined>(undefined);

    const inputRefs = useMemo(
        () => [
            React.createRef<HTMLInputElement>(),
            React.createRef<HTMLInputElement>(),
            React.createRef<HTMLInputElement>(),
            React.createRef<HTMLInputElement>(),
        ],
        []
    );

    useEffect(() => {
        if (!phoneNumber) {
            router.push("/auth/login");
            return;
        }

        requestOtp(phoneNumber).catch(() => {
            // Keep page usable even if this re-request fails.
        });
    }, [phoneNumber, requestOtp, router]);

    useEffect(() => {
        if (timer <= 0) return;
        const t = setInterval(() => setTimer((prev) => prev - 1), 1000);
        return () => clearInterval(t);
    }, [timer]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("OTPCredential" in window)) return;

        const ac = new AbortController();
        const nav = navigator as Navigator & {
            credentials?: {
                get?: (options: Record<string, unknown>) => Promise<unknown>;
            };
        };

        const startWebOtp = async () => {
            try {
                const credential = (await nav.credentials?.get?.({
                    otp: { transport: ["sms"] },
                    signal: ac.signal,
                })) as { code?: string } | undefined;

                const code = (credential?.code || "").replace(/\D/g, "").slice(0, 4);
                if (!code) return;

                const next = ["", "", "", ""];
                code.split("").forEach((digit, idx) => {
                    next[idx] = digit;
                });
                setOtp(next);
            } catch {
                // Ignore abort and unsupported runtime errors.
            }
        };

        startWebOtp();
        return () => ac.abort();
    }, [phoneNumber]);

    const handleOtpChange = (newOtp: string[]) => {
        setOtp(newOtp);
    };

    const handleOtpChangeDesktop = (index: number, value: string) => {
        const digits = value.replace(/\D/g, "");

        // Autofill / paste into single box — spread across all boxes
        if (digits.length > 1) {
            const next = ["", "", "", ""];
            digits.slice(0, 4).split("").forEach((d, i) => { next[i] = d; });
            setOtp(next);
            inputRefs[Math.min(digits.length, 3)].current?.focus();
            return;
        }

        const digit = digits.slice(0, 1);
        setOtp((prev) => {
            const next = [...prev];
            next[index] = digit;
            return next;
        });

        if (digit && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
        const next = ["", "", "", ""];
        pasted.split("").forEach((char, idx) => {
            next[idx] = char;
        });
        setOtp(next);
    };

    const handleLogin = async () => {
        const otpValue = otp.join("");
        if (otpValue.length !== 4) return;
        setLoading(true);
        setLocalError(undefined);
        try {
            await verifyOtp(otpValue);
            router.push(resolvePostLoginDestination());
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Failed to verify OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!phoneNumber || phoneNumber.length !== 10) {
            setLocalError("Invalid phone number. Go back and try again.");
            return;
        }
        setLocalError(undefined);
        setResendLoading(true);
        try {
            await requestOtp(phoneNumber);
            setOtp(["", "", "", ""]);
            setTimer(600);
            toast.success("OTP sent again. Check your phone.");
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Failed to resend OTP");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => {
                    clearAuthIntent();
                    continueAsGuest();
                    router.push("/");
                }}
                className="fixed right-4 top-4 z-50 rounded-full border border-white/25 bg-black/60 px-4 py-2 text-sm text-white"
            >
                Skip log in
            </button>

            <div className="block md:hidden">
                <MobileOTPView
                    phoneNumber={phoneNumber}
                    otp={otp}
                    timer={timer}
                    onOtpChange={handleOtpChange}
                    onLogin={handleLogin}
                    onResend={handleResend}
                    loading={loading}
                    resendLoading={resendLoading}
                    error={localError || error || undefined}
                />
            </div>

            <div className="hidden md:block">
                <DesktopOTPView
                    phoneNumber={phoneNumber}
                    otp={otp}
                    timer={timer}
                    inputRefs={inputRefs}
                    onOtpChange={handleOtpChangeDesktop}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    onLogin={handleLogin}
                    onResend={handleResend}
                    loading={loading}
                    resendLoading={resendLoading}
                    error={localError || error || undefined}
                />
            </div>
        </>
    );
}
