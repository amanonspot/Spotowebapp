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

interface DesktopOTPViewProps {
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

export default function DesktopOTPView({
    phoneNumber,
    otp,
    timer,
    onOtpChange,
    onLogin,
    onResend,
    loading = false,
    resendLoading = false,
    error,
}: DesktopOTPViewProps) {
    const router = useRouter();

    const formatPhoneNumber = (phone: string) => {
        if (phone.length === 10) {
            return `${phone.substring(0, 2)}${"x".repeat(6)}${phone.substring(
                8
            )}`;
        }
        return phone;
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8 font-opensans">
            {/* Desktop Card Container */}
            <div className="bg-[#1a1a1a] rounded-2xl p-8 w-full max-w-[450px] shadow-2xl">
                {/* Back Button and Title */}
                <div className="flex items-center mb-8 relative">
                    <div
                        className="cursor-pointer w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity"
                        onClick={() => router.push("/auth/login")}
                    >
                        <Image
                            src={backIcon}
                            alt="back-icon"
                            width={20}
                            height={20}
                        />
                    </div>
                    <h2 className="text-white text-lg font-montserrat font-semibold absolute left-1/2 -translate-x-1/2">
                        Login with OTP
                    </h2>
                </div>

                {/* 3D House Illustration */}
                <div className="flex justify-center mb-6">
                    <Image
                        src={otpIcon}
                        alt="otp-icon"
                        width={200}
                        height={200}
                        className="w-[200px] h-auto"
                        priority
                    />
                </div>

                {/* OTP Info Text */}
                <p className="text-white/60 text-sm text-center mb-1">
                    To confirm your email address please enter the OTP sent to
                    your email
                </p>
                <p className="text-white/80 text-center text-base mb-8 font-medium">
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
    );
}
