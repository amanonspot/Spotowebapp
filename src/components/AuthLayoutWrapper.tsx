"use client";

import AuthGuard from "./AuthGuard";

interface AuthLayoutWrapperProps {
    children: React.ReactNode;
}

export default function AuthLayoutWrapper({
    children,
}: AuthLayoutWrapperProps) {
    return <AuthGuard>{children}</AuthGuard>;
}
