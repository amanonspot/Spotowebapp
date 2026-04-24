"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DesktopLoginView from "./_components/DesktopLoginView";
import MobileLoginView from "./_components/MobileLoginView";
import { useAuth } from "@/lib/hooks/useAuth";
import { clearAuthIntent, consumeAuthIntentDestination } from "@/lib/auth/authIntent";

const resolvePostLoginDestination = () => consumeAuthIntentDestination() || "/";

export default function LoginPage() {
    const router = useRouter();
    const { isAuthenticated, error, requestOtp, verifyOtp, continueAsGuest } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [showOtpSentMessage, setShowOtpSentMessage] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [localError, setLocalError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (isAuthenticated) {
            router.push(resolvePostLoginDestination());
        }
    }, [isAuthenticated, router]);

    const handleContinue = async () => {
        if (phoneNumber.length !== 10) return;
        setIsSendingOtp(true);
        setLocalError(undefined);
        try {
            await requestOtp(phoneNumber);
            setShowOtpSentMessage(true);
            setTimeout(() => {
                setShowOtpSentMessage(false);
                setOtpSent(true);
            }, 1200);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Failed to send OTP");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 4) return;
        setIsVerifyingOtp(true);
        setLocalError(undefined);
        try {
            await verifyOtp(otp);
            router.push(resolvePostLoginDestination());
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Failed to verify OTP");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleResendOTP = async () => {
        setLocalError(undefined);
        try {
            await requestOtp(phoneNumber);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Failed to resend OTP");
        }
    };

    const handleChangeNumber = () => {
        setOtpSent(false);
        setOtp("");
    };

    const handleSkipLogin = () => {
        clearAuthIntent();
        continueAsGuest();
        router.push("/");
    };

    return (
        <>
            <button
                onClick={handleSkipLogin}
                className="fixed right-4 top-4 z-50 rounded-full border border-white/25 bg-black/60 px-4 py-2 text-sm text-white"
            >
                Skip log in
            </button>

            <div className="block md:hidden">
                <MobileLoginView
                    phoneNumber={phoneNumber}
                    onPhoneChange={setPhoneNumber}
                    onContinue={handleContinue}
                    loading={isSendingOtp || isVerifyingOtp}
                    error={localError || error || undefined}
                    otpSent={otpSent}
                    otp={otp}
                    onOtpChange={setOtp}
                    onVerifyOTP={handleVerifyOTP}
                    onResendOTP={handleResendOTP}
                    onChangeNumber={handleChangeNumber}
                    showOtpSentMessage={showOtpSentMessage}
                />
            </div>

            <div className="hidden md:block">
                <DesktopLoginView
                    phoneNumber={phoneNumber}
                    onPhoneChange={setPhoneNumber}
                    onContinue={handleContinue}
                    loading={isSendingOtp || isVerifyingOtp}
                    error={localError || error || undefined}
                    otpSent={otpSent}
                    otp={otp}
                    onOtpChange={setOtp}
                    onVerifyOTP={handleVerifyOTP}
                    onResendOTP={handleResendOTP}
                    onChangeNumber={handleChangeNumber}
                    showOtpSentMessage={showOtpSentMessage}
                />
            </div>
        </>
    );
}
