"use client";

import { authAdapter } from "@/lib/adapters/authAdapter";
import { authService } from "@/lib/api";
import { AuthIntentPayload, setAuthIntent } from "@/lib/auth/authIntent";

interface RouterLike {
    push: (href: string) => void;
}

const isBrowser = () => typeof window !== "undefined";

export const hasAuthenticatedSession = (): boolean => {
    if (!isBrowser()) return false;

    if (authService.isAuthenticated()) return true;

    const session = authAdapter.getSession();
    if (session.isAuthenticated && session.accessToken) {
        localStorage.setItem("access_token", session.accessToken);
        if (session.refreshToken) localStorage.setItem("refresh_token", session.refreshToken);
        localStorage.setItem("isAuthenticated", "true");
        return true;
    }

    return false;
};

export const requireAuthThenContinue = async (params: {
    router: RouterLike;
    intent: Omit<AuthIntentPayload, "createdAt">;
    onAuthenticated: () => void | Promise<void>;
}): Promise<boolean> => {
    if (hasAuthenticatedSession()) {
        await params.onAuthenticated();
        return true;
    }

    setAuthIntent(params.intent);
    params.router.push("/auth/login");
    return false;
};
