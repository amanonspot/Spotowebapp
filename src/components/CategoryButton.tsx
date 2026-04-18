"use client";
import React from "react";

interface CategoryButtonProps {
    label: string;
    isSelected?: boolean;
    onClick: () => void;
    className?: string;
}

export default function CategoryButton({
    label,
    isSelected = false,
    onClick,
    className = "",
}: CategoryButtonProps) {
    const borderThickness = isSelected ? '2.5px' : '2px';
    
    return (
        <div className={`relative ${className}`}>
            {/* Outer container with gradient border */}
            <div 
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, rgba(192, 132, 252, 0.7) 0%, rgba(124, 58, 237, 0.7) 100%)',
                    borderRadius: '16px',
                }}
            />
            
            <button
                onClick={onClick}
                className={`
                    relative w-full px-5 py-3.5 md:px-7 md:py-4 text-white font-bold text-sm md:text-base
                    transition-all duration-200 hover:opacity-90
                    mobile-category-button mobile-touch-target
                `}
                style={{
                    background: isSelected 
                        ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.2), rgba(124, 58, 237, 0.15))'
                        : 'rgba(26, 26, 26, 0.95)',
                    borderRadius: '16px',
                    margin: `0 0 ${borderThickness} 0`,
                    textShadow: '0 0 1px rgba(255, 255, 255, 0.2)',
                }}
            >
                <span className="relative z-10">{label}</span>
            </button>
        </div>
    );
}
