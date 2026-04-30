import React from "react";

interface ResendButtonProps {
    onClick: () => void;
    disabled: boolean;
    loading?: boolean;
}

export default function ResendButton({ onClick, disabled, loading = false }: ResendButtonProps) {
    const inactive = disabled || loading;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={inactive}
            className={`w-full py-4 rounded-xl transition-all duration-300 mb-4 border-2 text-lg font-opensans font-normal ${
                inactive
                    ? "border-white/20 text-white/30 cursor-not-allowed"
                    : "border-white/30 text-white hover:bg-white/5 hover:border-white/40 cursor-pointer"
            }`}
        >
            {loading ? "Sending OTP…" : "Resend OTP"}
        </button>
    );
}
