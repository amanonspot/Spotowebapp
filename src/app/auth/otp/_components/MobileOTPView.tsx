"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import backIcon from "../../../../../public/assets/images/back-icon.svg";
import otpIcon from "../../../../../public/assets/images/otp-icon.svg";
import OtpCodeField from "./OtpCodeField";
import LoginButton from "./LoginButton";
import ResendButton from "./ResendButton";
import OTPTimer from "./OTPTimer";

interface MobileOTPViewProps {
    phoneNumber: string;
    otp: string[];
    timer: number;
    onOtpChange: (otp: string[]) => void;
    onLogin: () => void;
    onResend: () => void;
    loading?: boolean;
    resendLoading?: boolean;
    error?: string;
}

export default function MobileOTPView({
    phoneNumber,
    otp,
    timer,
    onOtpChange,
    onLogin,
    onResend,
    loading = false,
    resendLoading = false,
    error,
}: MobileOTPViewProps) {
    const router = useRouter();

    const formatPhoneNumber = (phone: string) => {
        // Format phone number with masking
        if (phone.length === 10) {
            return `${phone.substring(0, 2)}${"x".repeat(6)}${phone.substring(
                8
            )}`;
        }
        return phone;
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-start pt-4 px-4 relative overflow-hidden font-opensans"
            style={{
                background:
                    "linear-gradient(180deg, #1D1528 0%, #231B31 12%, #060606 42%, #060606 75%, transparent 100%)",
                backgroundColor: "#060606",
            }}
        >
            {/* Back Button and Title - Fixed at top */}
            <div className="w-full max-w-md flex items-center mb-6 relative">
                <div
                    className="cursor-pointer p-2 flex items-center justify-center hover:opacity-70 transition-opacity"
                    onClick={() => router.push("/auth/login")}
                >
                    <Image
                        src={backIcon}
                        alt="back-icon"
                        width={24}
                        height={24}
                    />
                </div>
                <h2 className="text-white/60 text-lg font-opensans font-normal absolute left-1/2 -translate-x-1/2">
                    Login with OTP
                </h2>
            </div>

            {/* Main content - Centered */}
            <div className="flex-1 flex items-center justify-center w-full max-w-md pb-8">
                <div className="w-full">
                    {/* 3D House Illustration */}
                    <div className="flex justify-center mb-8">
                        <Image
                            src={otpIcon}
                            alt="otp-icon"
                            width={280}
                            height={280}
                            className="w-[280px] h-auto"
                            priority
                        />
                    </div>

                    {/* OTP Info Text */}
                    <p className="text-white/60 text-sm text-center mb-2 px-4 leading-relaxed">
                        To confirm your email address please enter the OTP sent
                        to your email
                    </p>
                    <p className="text-white text-center text-base mb-8 font-normal">
                        {formatPhoneNumber(phoneNumber)}
                    </p>

                    {/* OTP Input Boxes */}
                    <OtpCodeField otp={otp} onOtpChange={onOtpChange} />

                    {/* Login Button */}
                    <LoginButton
                        onClick={onLogin}
                        disabled={otp.join("").length !== 4}
                        loading={loading}
                    />

                    <ResendButton onClick={onResend} disabled={timer > 0} loading={resendLoading} />

                    {/* Timer Text */}
                    <OTPTimer timer={timer} />
                </div>
            </div>
        </div>
    );
}
