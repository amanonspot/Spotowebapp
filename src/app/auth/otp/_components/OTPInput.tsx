import React from "react";

interface OTPInputProps {
    otp: string[];
    onOtpChange: (index: number, value: string) => void;
    onKeyDown: (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => void;
    onPaste: (e: React.ClipboardEvent) => void;
    inputRefs: React.RefObject<HTMLInputElement | null>[];
}

export default function OTPInput({
    otp,
    onOtpChange,
    onKeyDown,
    onPaste,
    inputRefs,
}: OTPInputProps) {
    return (
        <form autoComplete="on" className="flex justify-center gap-4 mb-8 px-4" onSubmit={(e) => e.preventDefault()}>
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => onOtpChange(index, e.target.value)}
                    onKeyDown={(e) => onKeyDown(index, e)}
                    onPaste={onPaste}
                    autoFocus={index === 0}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    className="w-16 h-16 bg-[#1a1c2e] border-2 border-white/10 rounded-lg text-white text-center text-2xl font-opensans font-normal focus:outline-none focus:border-[#AF7AEB] transition-all"
                />
            ))}
        </form>
    );
}
