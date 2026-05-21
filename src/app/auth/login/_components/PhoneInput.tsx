import React from "react";

interface PhoneInputProps {
    phoneNumber: string;
    onPhoneChange: (value: string) => void;
    onEnterPress: () => void;
}

export default function PhoneInput({
    phoneNumber,
    onPhoneChange,
    onEnterPress,
}: PhoneInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ""); // Only allow digits
        if (value.length <= 10) {
            onPhoneChange(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && phoneNumber.length === 10) {
            onEnterPress();
        }
    };

    return (
        <div className="w-full mb-4">
            <div className="flex items-center gap-3 bg-[#2a2a2a] border border-white/10 rounded-xl px-4 py-4 focus-within:border-[#AF7AEB] transition-all">
                {/* Country Code */}
                <div className="flex items-center gap-2 border-r border-white/20 pr-3">
                    <span className="text-lg">🇮🇳</span>
                    <span className="text-white/70 text-base font-opensans font-medium">
                        +91
                    </span>
                </div>

                {/* Phone Number Input */}
                <input
                    type="tel"
                    name="phone"
                    id="phone"
                    placeholder="Enter mobile number"
                    value={phoneNumber}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    maxLength={10}
                    autoFocus
                    autoComplete="username"
                    inputMode="numeric"
                    className="flex-1 bg-[#2a2a2a] text-white text-base font-opensans placeholder:text-white/40 focus:outline-none"
                    style={{
                        colorScheme: 'dark',
                        backgroundColor: '#2a2a2a',
                        color: 'white',
                        WebkitTextFillColor: 'white',
                        WebkitBoxShadow: '0 0 0 1000px #2a2a2a inset',
                        boxShadow: '0 0 0 1000px #2a2a2a inset'
                    }}
                />
            </div>
        </div>
    );
}
