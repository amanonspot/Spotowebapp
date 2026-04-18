"use client";

import React from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
}) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show pages around current page
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);
            
            // Adjust if we're near the beginning or end
            if (currentPage <= 3) {
                endPage = Math.min(5, totalPages);
            }
            if (currentPage >= totalPages - 2) {
                startPage = Math.max(1, totalPages - 4);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-4 mt-8">
            {/* Results info */}
            <div className="text-sm text-gray-300">
                Showing {startItem}-{endItem} of {totalItems} results
            </div>
            
            {/* Pagination buttons */}
            <div className="flex items-center space-x-2">
                {/* Previous button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-[#A0A0A0] bg-[#262929] border border-white/10 rounded-lg hover:bg-[#3a3a3a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    Previous
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            currentPage === page
                                ? "bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] text-white shadow-lg shadow-[#AF7AEB]/30"
                                : "text-[#A0A0A0] bg-[#262929] border border-white/10 hover:bg-[#3a3a3a] hover:text-white"
                        }`}
                    >
                        {page}
                    </button>
                ))}

                {/* Next button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-[#A0A0A0] bg-[#262929] border border-white/10 rounded-lg hover:bg-[#3a3a3a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default Pagination;
