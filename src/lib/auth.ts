/**
 * Authentication utility functions
 */

/**
 * Logout user by clearing localStorage and cookies
 */
export const logout = () => {
    // Clear localStorage
    localStorage.removeItem("userPhone");
    localStorage.removeItem("loginProvider");
    localStorage.removeItem("isAuthenticated");

    // Clear auth cookie
    document.cookie = "auth-token=; path=/; max-age=0";

    // Redirect to login page
    window.location.href = "/auth/login";
};

/**
 * Check if user is authenticated (client-side)
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("isAuthenticated") === "true";
};

/**
 * Get stored phone number
 */
export const getUserPhone = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("userPhone");
};

/**
 * Get login provider
 */
export const getLoginProvider = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("loginProvider");
};
