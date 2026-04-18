import React from "react";

interface NeighbourhoodHighlightsProps {
    title?: string;
    description?: string;
    showMoreText?: string;
}

const NeighbourhoodHighlights: React.FC<NeighbourhoodHighlightsProps> = ({
    title = "Neighbourhood highlights",
    description,
    showMoreText = "Show more >",
}) => {
    if (!description) {
        return null;
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">{title}</h2>
            <p className="text-black mb-3 leading-relaxed">{description}</p>
            <button className="text-black hover:text-gray-700 transition-colors duration-200">
                {showMoreText}
            </button>
        </div>
    );
};

export default NeighbourhoodHighlights;
