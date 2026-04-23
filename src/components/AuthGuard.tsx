"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useAuth } from "@/lib/hooks/useAuth";

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { loading } = useAuth();
    const [booting, setBooting] = useState(true);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setBooting(false);
        }, 120);

        return () => clearTimeout(timeoutId);
    }, []);

    if (booting || loading) {
        return (
            <div className="min-h-screen bg-[#120A1A] flex items-center justify-center">
                <div className="text-center">
                    <Logo className="mb-4" />
                    <div className="flex items-center gap-2 text-white/50">
                        <div className="w-2 h-2 bg-purple rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-purple rounded-full animate-pulse delay-100" />
                        <div className="w-2 h-2 bg-purple rounded-full animate-pulse delay-200" />
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
