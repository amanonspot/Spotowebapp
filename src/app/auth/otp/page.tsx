"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DesktopOTPView from "./_components/DesktopOTPView";
import MobileOTPView from "./_components/MobileOTPView";
import { otpArrayFromString } from "./_components/OtpCodeField";
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

    // Android Chrome: Web OTP API (SMS must end with @yourdomain #1234 — needs DLT template update)
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

                const code = credential?.code || "";
                if (!code) return;
                setOtp(otpArrayFromString(code));
            } catch {
                // User dismissed or SMS format not compatible with Web OTP
            }
        };

        void startWebOtp();
        return () => ac.abort();
    }, [phoneNumber]);

    const handleOtpChange = (newOtp: string[]) => {
        setOtp(newOtp);
    };

    const handleLogin = useCallback(async () => {
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
    }, [otp, verifyOtp, router]);

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
                    onOtpChange={handleOtpChange}
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
