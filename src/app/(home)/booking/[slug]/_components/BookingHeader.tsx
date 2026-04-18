"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import logo from "../../../../../../public/assets/images/logo.svg";
import Logo from "@/components/Logo";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { userService } from "@/lib/api";
import toast from "react-hot-toast";

function BookingHeader() {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Scroll detection to show/hide compact search
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsScrolled(scrollY > 300); // Show after scrolling 300px
        };

        handleScroll(); // Check initial position
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target as Node)
            ) {
                setShowProfileMenu(false);
            }
        };

        if (showProfileMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showProfileMenu]);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target as Node)
            ) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMobileMenuOpen]);

    const handleProfileClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            router.push("/auth/login");
        } else {
            setShowProfileMenu(!showProfileMenu);
        }
    };

    const handleEmailUpdate = async () => {
        if (!newEmail || !user?.id) {
            toast.error("Please enter a valid email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        setIsUpdatingEmail(true);
        try {
            await userService.updateUser(user.id, { email: newEmail });
            toast.success("Email updated successfully!");
            setIsEditingEmail(false);
            setNewEmail("");
            setShowProfileMenu(false);
        } catch (error: unknown) {
            console.error("Error updating email:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update email. Please try again."
            );
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully!");
            setShowProfileMenu(false);
            router.push("/auth/login");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to logout. Please try again.");
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeletingAccount(true);
        try {
            await userService.deleteUser();
            toast.success("Account deleted successfully!");
            setShowDeleteConfirm(false);
            setShowProfileMenu(false);
            // Logout and redirect to login
            await logout();
            router.push("/auth/login");
        } catch (error: unknown) {
            console.error("Error deleting account:", error);
            
            // Extract error message from various possible formats
            let errorMessage = "Failed to delete account. Please try again.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = String((error as any).message);
            }
            
            // Show user-friendly error message
            toast.error(errorMessage);
        } finally {
            setIsDeletingAccount(false);
        }
    };

    // Check if we're on My Bookings page to apply dark theme
    const isMyBookingsPage = pathname?.includes('/my-bookings') || false;
    const headerBg = isMyBookingsPage ? 'bg-[#120A1A]' : 'bg-white';
    const headerBorder = isMyBookingsPage ? 'border-white/10' : 'border-gray-200';
    const logoVariant = isMyBookingsPage ? 'light' : 'dark';

    return (
        <>
            <header className={`w-full ${headerBg} border-b ${headerBorder} sticky top-0 z-[100]`}>
                <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
                        {/* Logo - Mobile Optimized */}
                        <div className="flex-shrink-0">
                            <Link href="/" className="flex items-center">
                                <Logo variant={logoVariant} className="!w-[100px] sm:!w-[120px] md:!w-[150px]" />
                            </Link>
                        </div>

                        {/* Center Navigation - Stays or Compact Search */}
                        <div className="hidden md:flex flex-1 items-center justify-center">
                            {isScrolled ? (
                                // Compact Search Bar when scrolled
                                <div className="flex-1 mx-6 max-w-2xl">
                                    <button
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className={`w-full ${isMyBookingsPage ? 'bg-white/5 border-white/20' : 'bg-white border-gray-300'} rounded-full px-6 py-2.5 shadow-md hover:shadow-lg transition-shadow flex items-center gap-3`}
                                    >
                                        <svg
                                            className="w-4 h-4 text-[#AF7AEB] flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                        <span className={`text-sm ${isMyBookingsPage ? 'text-white' : 'text-gray-600'}`}>
                                            Modify your search
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                // Stays navigation when not scrolled
                                <div className="flex items-center gap-6">
                                    <button className={`text-sm font-medium ${isMyBookingsPage ? 'text-white' : 'text-black'} pb-3 border-b-2 ${isMyBookingsPage ? 'border-white' : 'border-black'}`}>
                                        Stays
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Desktop User Actions */}
                        <div className="hidden md:flex items-center justify-center gap-4">
                            {/* Spoto your home text */}
                            <Link
                                href="/"
                                className={`${isMyBookingsPage ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'} text-sm font-medium transition-colors duration-200 cursor-pointer flex items-center justify-center`}
                            >
                                Spoto your home
                            </Link>

                            {/* Globe icon */}
                            <Link
                                href="/"
                                className={`p-2 ${isMyBookingsPage ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-600'} transition-colors duration-200 flex items-center justify-center`}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                    />
                                </svg>
                            </Link>

                            {/* User menu button - Desktop */}
                            <div className="relative flex items-center gap-2 z-[100]" ref={profileMenuRef}>
                                {/* User profile button */}
                                <button
                                    onClick={handleProfileClick}
                                    className={`flex items-center justify-center p-2 ${isMyBookingsPage ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-lg transition-all duration-200 hover:shadow-md relative z-[101]`}
                                    title={isAuthenticated ? "My Profile" : "Sign In"}
                                    aria-label="User profile"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                                        <svg
                                            className="w-4 h-4 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                </button>

                                {/* Profile dropdown menu */}
                                {showProfileMenu && isAuthenticated && (
                                    <>
                                        {/* Backdrop */}
                                        <div 
                                            className="fixed inset-0 z-[90]"
                                            onClick={() => setShowProfileMenu(false)}
                                        />
                                        
                                        {/* Menu */}
                                        <div 
                                            className={`absolute right-0 top-full mt-3 w-72 ${isMyBookingsPage ? 'bg-[#1A1A1A] border-white/10' : 'bg-white border-gray-200'} rounded-xl border z-[150] animate-fadeInSlideDown`}
                                            style={{ 
                                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                                animation: 'fadeInSlideDown 0.2s ease-out'
                                            }}
                                        >
                                        <div className="p-5">
                                            {/* User info */}
                                            <div className={`flex items-center gap-3 mb-5 pb-4 border-b ${isMyBookingsPage ? 'border-white/10' : 'border-gray-100'}`}>
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] flex items-center justify-center shadow-lg">
                                                    <svg
                                                        className="w-6 h-6 text-white"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold ${isMyBookingsPage ? 'text-white' : 'text-gray-900'} truncate`}>
                                                        {user?.first_name &&
                                                        user?.last_name
                                                            ? `${user.first_name} ${user.last_name}`
                                                            : user?.email ||
                                                              "User"}
                                                    </p>
                                                    <p className={`text-xs ${isMyBookingsPage ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                                                        {user?.email ||
                                                            "No email"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Email update section */}
                                            <div className="mb-4">
                                                <h3 className={`text-xs font-semibold ${isMyBookingsPage ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider mb-3`}>
                                                    Account Email
                                                </h3>
                                                {isEditingEmail ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            type="email"
                                                            value={newEmail}
                                                            onChange={(e) =>
                                                                setNewEmail(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AF7AEB] focus:border-transparent transition-all"
                                                            placeholder="Enter new email"
                                                            disabled={
                                                                isUpdatingEmail
                                                            }
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={
                                                                    handleEmailUpdate
                                                                }
                                                                disabled={
                                                                    isUpdatingEmail
                                                                }
                                                                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-[#AF7AEB] text-white rounded-lg hover:bg-[#9575e6] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                                            >
                                                                {isUpdatingEmail && (
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                                )}
                                                                {isUpdatingEmail
                                                                    ? "Saving..."
                                                                    : "Save Changes"}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setIsEditingEmail(
                                                                        false
                                                                    );
                                                                    setNewEmail(
                                                                        ""
                                                                    );
                                                                }}
                                                                disabled={
                                                                    isUpdatingEmail
                                                                }
                                                                className="flex-1 px-4 py-2.5 text-sm font-semibold border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`flex items-center justify-between p-3 ${isMyBookingsPage ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                                                        <span className={`text-sm ${isMyBookingsPage ? 'text-white' : 'text-gray-700'} font-medium truncate flex-1`}>
                                                            {user?.email ||
                                                                "No email"}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                setNewEmail(
                                                                    user?.email ||
                                                                        ""
                                                                );
                                                                setIsEditingEmail(
                                                                    true
                                                                );
                                                            }}
                                                            className="ml-2 px-3 py-1.5 text-xs font-semibold bg-[#AF7AEB] text-white rounded-lg hover:bg-[#9575e6] transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Menu Options */}
                                            <div className={`space-y-1 mb-4 pt-2 border-t ${isMyBookingsPage ? 'border-white/10' : 'border-gray-100'}`}>
                                                <Link
                                                    href="/my-bookings"
                                                    onClick={() =>
                                                        setShowProfileMenu(
                                                            false
                                                        )
                                                    }
                                                    className={`flex items-center gap-3 px-3 py-3 text-sm font-medium ${isMyBookingsPage ? 'text-white hover:bg-white/10 hover:text-[#AF7AEB]' : 'text-gray-700 hover:bg-purple-50 hover:text-[#AF7AEB]'} rounded-lg transition-all duration-200 group`}
                                                >
                                                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isMyBookingsPage ? 'bg-white/5 group-hover:bg-white/10' : 'bg-gray-100 group-hover:bg-purple-100'} transition-colors`}>
                                                        <svg
                                                            className="w-4 h-4 text-gray-600 group-hover:text-[#AF7AEB] transition-colors"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span>My Bookings</span>
                                                </Link>
                                            </div>

                                            {/* Delete Account button */}
                                            <button
                                                onClick={() => {
                                                    setShowDeleteConfirm(true);
                                                    setShowProfileMenu(false);
                                                }}
                                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold ${isMyBookingsPage ? 'text-red-400 border-2 border-red-400 hover:bg-red-400/10' : 'text-red-600 border-2 border-red-600 hover:bg-red-50'} rounded-lg transition-all duration-200 mb-3`}
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                                Delete Account
                                            </button>

                                            {/* Logout button */}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                    />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Mobile menu button - Simple hamburger + profile */}
                        <div className="md:hidden flex items-center gap-2">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="flex items-center justify-center gap-1.5 border border-gray-300 rounded-full pl-2 pr-3 py-1.5 hover:shadow-md active:shadow-lg transition-all duration-200"
                                title="Menu"
                                aria-label="Toggle menu"
                            >
                                {/* Hamburger menu icon */}
                                <svg
                                    className="w-3.5 h-3.5 text-black flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                                
                                {/* User avatar */}
                                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-2.5 h-2.5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Menu */}
                    {isMobileMenuOpen && (
                        <div ref={mobileMenuRef} className={`md:hidden border-t ${isMyBookingsPage ? 'border-white/10 bg-[#1A1A1A]' : 'border-gray-200 bg-white'} shadow-lg`}>
                            {/* Menu Header with Close Button */}
                            <div className={`flex items-center justify-between px-3 py-2.5 border-b ${isMyBookingsPage ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                                <h3 className={`text-xs font-semibold ${isMyBookingsPage ? 'text-white' : 'text-gray-900'}`}>Menu</h3>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                    aria-label="Close menu"
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <nav className={`flex flex-col divide-y ${isMyBookingsPage ? 'divide-white/10' : 'divide-gray-200'}`}>
                                <Link
                                    href="/"
                                    className={`px-3 py-2.5 ${isMyBookingsPage ? 'text-white hover:bg-white/10 active:bg-white/5' : 'text-black hover:bg-gray-50 active:bg-gray-100'} text-xs font-medium transition-colors duration-200 flex items-center gap-2`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Home
                                </Link>
                                
                                <Link
                                    href="/search"
                                    className={`px-3 py-2.5 ${isMyBookingsPage ? 'text-white hover:bg-white/10 active:bg-white/5' : 'text-black hover:bg-gray-50 active:bg-gray-100'} text-xs font-medium transition-colors duration-200 flex items-center gap-2`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Search
                                </Link>
                                
                                {isAuthenticated ? (
                                    <>
                                        {/* User Info Section - Compact */}
                                        <div className={`px-3 py-2.5 ${isMyBookingsPage ? 'bg-white/5' : 'bg-gradient-to-r from-purple-50 to-pink-50'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#AF7AEB] to-[#9575e6] flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-xs font-bold">
                                                        {user?.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-semibold ${isMyBookingsPage ? 'text-white' : 'text-gray-900'} truncate`}>
                                                        {user?.first_name && user?.last_name
                                                            ? `${user.first_name} ${user.last_name}`
                                                            : user?.email || "User"}
                                                    </p>
                                                    <p className={`text-[10px] ${isMyBookingsPage ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                                                        {user?.email || "No email"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Link
                                            href="/my-bookings"
                                            className={`px-3 py-2.5 ${isMyBookingsPage ? 'text-white hover:bg-white/10 active:bg-white/5' : 'text-black hover:bg-gray-50 active:bg-gray-100'} text-xs font-medium transition-colors duration-200 flex items-center gap-2`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            My Bookings
                                        </Link>
                                        
                                        <Link
                                            href="/wishlist"
                                            className={`px-3 py-2.5 ${isMyBookingsPage ? 'text-white hover:bg-white/10 active:bg-white/5' : 'text-black hover:bg-gray-50 active:bg-gray-100'} text-xs font-medium transition-colors duration-200 flex items-center gap-2`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            Wishlist
                                        </Link>
                                        
                                        <button
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className={`px-3 py-2.5 ${isMyBookingsPage ? 'text-red-400 hover:bg-red-500/10 active:bg-red-500/5' : 'text-red-600 hover:bg-red-50 active:bg-red-100'} text-xs font-medium transition-colors duration-200 text-left flex items-center gap-2`}
                                        >
                                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            router.push('/auth/login');
                                        }}
                                        className={`px-3 py-2.5 ${isMyBookingsPage ? 'text-[#AF7AEB] hover:bg-white/10 active:bg-white/5' : 'text-purple-600 hover:bg-purple-50 active:bg-purple-100'} text-xs font-medium transition-colors duration-200 text-left flex items-center gap-2`}
                                    >
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Sign In
                                    </button>
                                )}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 transform transition-all">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Delete Account
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                disabled={isDeletingAccount}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Warning Icon */}
                        <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm text-red-800 font-medium">
                                This will permanently delete your account and all associated data including bookings, wishlists, and preferences.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeletingAccount}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeletingAccount}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isDeletingAccount && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                )}
                                {isDeletingAccount ? "Deleting..." : "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default BookingHeader;
