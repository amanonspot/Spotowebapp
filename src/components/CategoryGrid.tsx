"use client";
import React from "react";
import CategoryButton from "./CategoryButton";

interface CategoryGridProps {
    onCategorySelect?: (category: string) => void;
    selectedCategory?: string | null;
    className?: string;
}

export default function CategoryGrid({
    onCategorySelect,
    selectedCategory,
    className = "",
}: CategoryGridProps) {

    // Fixed categories as per Figma design
    const categories = [
        { label: "Home Stays", value: "Home Stays" },
        { label: "Spoto Stays", value: "Spoto Stays" },
        { label: "Safari Stays", value: "Safari Stays" },
        { label: "Villas", value: "Villas" },
        { label: "Hostels", value: "Hostels" },
    ];

    const handleCategoryClick = (category: string) => {
        // Call the handler to update selection in parent component
        if (onCategorySelect) {
            onCategorySelect(category);
        }
    };

    return (
        <div className={`w-full max-w-3xl ${className}`}>
            <div className="mobile-category-grid grid grid-cols-6 gap-3 md:gap-4">
                {/* First row - 2 buttons, each spanning 3 columns */}
                {categories.slice(0, 2).map((category, index) => (
                    <CategoryButton
                        key={index}
                        label={category.label}
                        isSelected={selectedCategory === category.value}
                        onClick={() => handleCategoryClick(category.value)}
                        className="col-span-3"
                    />
                ))}
                
                {/* Second row - 3 buttons, each spanning 2 columns */}
                {categories.slice(2, 5).map((category, index) => (
                    <CategoryButton
                        key={index + 2}
                        label={category.label}
                        isSelected={selectedCategory === category.value}
                        onClick={() => handleCategoryClick(category.value)}
                        className="col-span-2"
                    />
                ))}
            </div>
        </div>
    );
}
