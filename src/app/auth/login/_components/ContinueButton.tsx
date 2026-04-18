import React from "react";

interface ContinueButtonProps {
    onClick: () => void;
    disabled: boolean;
    loading?: boolean;
}

export default function ContinueButton({
    onClick,
    disabled,
    loading = false,
}: ContinueButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`w-full font-opensans font-semibold py-4 rounded-xl transition-all duration-300 mb-5 text-lg flex items-center justify-center gap-2 ${
                !disabled && !loading
                    ? "bg-[#AF7AEB] hover:bg-[#9565d4] text-white cursor-pointer shadow-lg"
                    : "bg-[#AF7AEB] text-white/90 cursor-not-allowed opacity-70"
            }`}
        >
            {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            )}
            {loading ? "Sending OTP..." : "Continue"}
        </button>
    );
}
