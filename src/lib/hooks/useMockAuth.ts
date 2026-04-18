"use client";

import { useCallback, useEffect, useState } from "react";
import { authAdapter, clearMockSession, setGuestSession } from "@/lib/adapters";
import { AuthSession, OtpRequestResult } from "@/lib/adapters/types";

const defaultSession: AuthSession = {
    isAuthenticated: false,
    isGuest: true,
};

export const useMockAuth = () => {
    const [session, setSession] = useState<AuthSession>(defaultSession);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshSession = useCallback(() => {
        const nextSession = authAdapter.getSession();
        setSession(nextSession);
    }, []);

    useEffect(() => {
        refreshSession();
        setLoading(false);
    }, [refreshSession]);

    const requestOtp = useCallback(async (phone: string): Promise<OtpRequestResult> => {
        setError(null);
        try {
            return await authAdapter.requestOtp(phone);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unable to request OTP";
            setError(message);
            throw err;
        }
    }, []);

    const verifyOtp = useCallback(async (code: string): Promise<AuthSession> => {
        setError(null);
        try {
            const nextSession = await authAdapter.verifyOtp(code);
            setSession(nextSession);
            return nextSession;
        } catch (err) {
            const message = err instanceof Error ? err.message : "OTP verification failed";
            setError(message);
            throw err;
        }
    }, []);

    const continueAsGuest = useCallback(() => {
        const guestSession = setGuestSession();
        setSession(guestSession);
        setError(null);
        return guestSession;
    }, []);

    const logout = useCallback(() => {
        clearMockSession();
        setSession(defaultSession);
        setError(null);
    }, []);

    return {
        session,
        loading,
        error,
        isAuthenticated: session.isAuthenticated,
        isGuest: session.isGuest,
        requestOtp,
        verifyOtp,
        continueAsGuest,
        logout,
        refreshSession,
    };
};
