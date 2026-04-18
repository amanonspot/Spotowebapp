import React from "react";

interface ShowAllModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: string[];
    iconColor?: string;
    iconSvg?: React.ReactNode;
}

const ShowAllModal: React.FC<ShowAllModalProps> = ({
    isOpen,
    onClose,
    title,
    items,
    iconColor = "text-green-600",
    iconSvg
}) => {
    if (!isOpen) return null;

    const defaultIcon = (
        <svg className={`w-5 h-5 ${iconColor} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-black">
                        All {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                    >
                        ×
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 py-2">
                                {iconSvg || defaultIcon}
                                <span className="text-gray-700">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="text-center text-sm text-gray-600">
                        Total: {items.length} {title.toLowerCase()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShowAllModal;
