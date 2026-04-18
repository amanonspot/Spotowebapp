import React from "react";

interface ResendButtonProps {
    onClick: () => void;
    disabled: boolean;
}

export default function ResendButton({ onClick, disabled }: ResendButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full py-4 rounded-xl transition-all duration-300 mb-4 border-2 text-lg font-opensans font-normal ${
                disabled
                    ? "border-white/20 text-white/30 cursor-not-allowed"
                    : "border-white/30 text-white hover:bg-white/5 hover:border-white/40 cursor-pointer"
            }`}
        >
            Resend link
        </button>
    );
}
