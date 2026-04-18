import React from "react";

interface OTPTimerProps {
    timer: number;
}

export default function OTPTimer({ timer }: OTPTimerProps) {
    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins} mins`;
    };

    return (
        <p className="text-white/50 text-sm text-center font-opensans">
            OTP will be valid for {formatTimer(timer)} only!
        </p>
    );
}
