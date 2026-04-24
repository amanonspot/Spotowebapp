"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setAuthIntent } from "@/lib/auth/authIntent";
import { hasAuthenticatedSession } from "@/lib/auth/requireAuthAction";

interface OwnerLayoutProps {
    children: ReactNode;
}

export default function OwnerLayout({ children }: OwnerLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (hasAuthenticatedSession()) {
            setAuthorized(true);
            return;
        }

        const search = typeof window !== "undefined" ? window.location.search : "";
        const nextPath = `${pathname || "/owner"}${search}`;
        setAuthIntent({
            type: "owner_list_property",
            nextPath,
        });
        setAuthorized(false);
        router.replace("/auth/login");
    }, [pathname, router]);

    if (!authorized) {
        return (
            <main className="min-h-screen bg-[#050507] text-white">
                <div className="mx-auto w-full max-w-[420px] px-4 py-12">
                    <div className="rounded-2xl border border-white/15 bg-[#101018] p-4 text-sm text-white/70">
                        Checking your session...
                    </div>
                </div>
            </main>
        );
    }

    return <>{children}</>;
}

