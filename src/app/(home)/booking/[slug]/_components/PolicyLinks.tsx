import React, { useState } from "react";

interface PolicyLinksProps {
    className?: string;
}

const PolicyLinks: React.FC<PolicyLinksProps> = ({ className }) => {
    const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);

    const policies = [
        {
            title: "Cancellation and Refund Policy",
            url: "/assets/images/SPOTO CANCELLATION & REFUND POLICY (India — including Karnataka).pdf",
            filename: "SPOTO CANCELLATION & REFUND POLICY (India — including Karnataka).pdf"
        },
        {
            title: "Privacy Policy",
            url: "/assets/images/SPOTO PRIVACY POLICY .pdf",
            filename: "SPOTO PRIVACY POLICY .pdf"
        },
        {
            title: "Terms and Conditions",
            url: "/assets/images/SPOTO TERMS AND CONDITIONS - Spoto .pdf",
            filename: "SPOTO TERMS AND CONDITIONS - Spoto .pdf"
        }
    ];

    const handlePolicyClick = (url: string) => {
        setSelectedPolicy(url);
    };

    const closePolicyViewer = () => {
        setSelectedPolicy(null);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <h3 className="text-lg font-bold text-black">Policies</h3>
            <ul className="space-y-3">
                {policies.map((policy, index) => (
                    <li key={index}>
                        <button
                            onClick={() => handlePolicyClick(policy.url)}
                            className="block w-full text-left text-black hover:text-gray-700 transition-colors duration-200 leading-relaxed py-1"
                        >
                            {policy.title}
                        </button>
                    </li>
                ))}
            </ul>

            {/* PDF Viewer Modal */}
            {selectedPolicy && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 pt-8 sm:pt-12"
                    onClick={closePolicyViewer}
                >
                    <div 
                        className="bg-white rounded-lg w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl mt-4 sm:mt-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-3 sm:p-4 border-b flex-shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-black pr-2 truncate">
                                {policies.find(p => p.url === selectedPolicy)?.title}
                            </h2>
                            <button
                                onClick={closePolicyViewer}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-colors duration-200 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                                aria-label="Close"
                            >
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        
                        {/* PDF Content */}
                        <div className="flex-1 p-2 sm:p-4 overflow-hidden">
                            <iframe
                                src={`${selectedPolicy}#toolbar=1&navpanes=1&scrollbar=1`}
                                className="w-full h-full border-0 rounded"
                                title="Policy Document"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PolicyLinks;
