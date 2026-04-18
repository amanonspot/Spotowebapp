import React from "react";

interface LoginButtonProps {
    onClick: () => void;
    disabled: boolean;
    loading?: boolean;
}

export default function LoginButton({ onClick, disabled, loading = false }: LoginButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`w-full font-opensans font-normal py-4 rounded-xl transition-all duration-300 mb-4 text-lg flex items-center justify-center gap-2 ${
                !disabled && !loading
                    ? "bg-[#AF7AEB] hover:bg-[#9d6dd9] text-white cursor-pointer"
                    : "bg-[#AF7AEB] text-white/90 cursor-not-allowed opacity-60"
            }`}
        >
            {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            )}
            {loading ? "Verifying..." : "Login"}
        </button>
    );
}
