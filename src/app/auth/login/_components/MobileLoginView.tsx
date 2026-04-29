import React from "react";
import LogoCard from "./LogoCard";
import Tagline from "./Tagline";
import HouseIllustration from "./HouseIllustration";
import PhoneInput from "./PhoneInput";
import ContinueButton from "./ContinueButton";
import TermsConditions from "./TermsConditions";

interface MobileLoginViewProps {
    phoneNumber: string;
    onPhoneChange: (value: string) => void;
    onContinue: () => void;
    loading?: boolean;
    error?: string;
    otpSent?: boolean;
    otp?: string;
    onOtpChange?: (value: string) => void;
    onVerifyOTP?: () => void;
    onResendOTP?: () => void;
    onChangeNumber?: () => void;
    showOtpSentMessage?: boolean;
}

export default function MobileLoginView({
    phoneNumber,
    onPhoneChange,
    onContinue,
    loading = false,
    error,
    otpSent = false,
    otp = "",
    onOtpChange,
    onVerifyOTP,
    onResendOTP,
    onChangeNumber,
    showOtpSentMessage = false,
}: MobileLoginViewProps) {
    const [otpDigits, setOtpDigits] = React.useState(['', '', '', '']);
    const inputRefs = [
        React.useRef<HTMLInputElement>(null),
        React.useRef<HTMLInputElement>(null),
        React.useRef<HTMLInputElement>(null),
        React.useRef<HTMLInputElement>(null),
    ];

    const handleOtpDigitChange = (index: number, value: string) => {
        // Only allow single digit
        const digit = value.replace(/\D/g, '').slice(-1);
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = digit;
        setOtpDigits(newOtpDigits);
        
        // Update parent OTP value
        const fullOtp = newOtpDigits.join('');
        onOtpChange?.(fullOtp);
        
        // Auto-focus next field
        if (digit && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-black">
            {!otpSent ? (
                // LOGIN PAGE
                <>
                    <LogoCard />
                    <div className="flex-1 flex items-center justify-center px-6 py-8 relative overflow-hidden font-opensans">
                        <div className="relative z-10 w-full max-w-[393px]">
                            <div className="flex flex-col items-center">
                                <Tagline />
                                <HouseIllustration />
                                
                                <h2 className="text-white text-center text-lg font-opensans font-normal mb-6">
                                    Login or Sign up
                                </h2>

                                {/* OTP Sent Success Message - Inline */}
                                {showOtpSentMessage && (
                                    <div className="w-full mb-4 p-4 bg-green-900/30 border border-green-500/50 rounded-xl animate-fadeInSlideDown">
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <p className="text-green-400 text-sm font-medium">
                                                OTP sent successfully to +91 {phoneNumber}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <PhoneInput
                                    phoneNumber={phoneNumber}
                                    onPhoneChange={onPhoneChange}
                                    onEnterPress={onContinue}
                                />

                                <ContinueButton
                                    onClick={onContinue}
                                    disabled={phoneNumber.length !== 10 || loading}
                                    loading={loading}
                                />

                                <TermsConditions />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // OTP PAGE - Matches Figma Design
                <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="animate-scale-in w-full max-w-[400px] bg-[#111118] rounded-3xl p-8 relative border border-white/8 shadow-[0_24px_64px_rgba(0,0,0,0.7)]">
                        {/* Back Button */}
                        <button
                            onClick={onChangeNumber}
                            className="absolute top-6 left-6 w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Header */}
                        <h1 className="text-white text-center text-lg font-semibold mb-8">
                            Login with OTP
                        </h1>

                        {/* House Illustration */}
                        <div className="flex justify-center mb-6">
                            <HouseIllustration />
                        </div>

                        {/* OTP Sent Message */}
                        <div className="text-center mb-6">
                            <p className="text-white text-sm mb-2">
                                OTP sent to your phone number
                            </p>
                            <p className="text-white text-base font-medium">
                                {phoneNumber.slice(0, 2)}{'x'.repeat(phoneNumber.length - 2)}
                            </p>
                        </div>

                        {/* OTP Input Fields */}
                        <div className="flex gap-3 justify-center mb-8">
                            {otpDigits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={inputRefs[index]}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-14 h-14 bg-[#1e1e28] border-2 border-white/15 rounded-xl text-white text-center text-2xl font-bold focus:border-[#A67AEB] focus:shadow-[0_0_0_3px_rgba(166,122,235,0.2)] focus:outline-none transition-all duration-200"
                                    style={{ userSelect: "text" }}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        {/* Login Button */}
                        <button
                            onClick={onVerifyOTP}
                            disabled={otp.length !== 4 || loading}
                            className="btn-shimmer w-full bg-[#A67AEB] text-white font-bold py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-4"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                'Login'
                            )}
                        </button>

                        {/* Resend Link Button */}
                        <button
                            onClick={onResendOTP}
                            disabled={loading}
                            className="w-full bg-transparent border border-white/20 text-white font-semibold py-3.5 rounded-xl hover:bg-white/5 hover:border-white/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-6"
                        >
                            Resend link
                        </button>

                        {/* OTP Validity Note */}
                        <p className="text-white text-center text-xs">
                            OTP will be valid for 10 mins only!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
