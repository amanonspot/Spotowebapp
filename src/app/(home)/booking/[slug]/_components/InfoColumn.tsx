import React from "react";

interface InfoColumnProps {
    title: string;
    items: string[];
}

const InfoColumn: React.FC<InfoColumnProps> = ({
    title,
    items,
}) => {
    return (
        <div className="space-y-4">
            {/* Title */}
            <h3 className="text-lg font-bold text-black">{title}</h3>

            {/* Items List */}
            <ul className="space-y-3">
                {items.map((item, index) => (
                    <li key={index} className="text-black leading-relaxed py-1">
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default InfoColumn;
