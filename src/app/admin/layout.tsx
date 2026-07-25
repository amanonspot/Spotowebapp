"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { adminAdapter } from "@/lib/adapters";
import { userService } from "@/lib/api";
import { setAuthIntent } from "@/lib/auth/authIntent";
import { hasAuthenticatedSession } from "@/lib/auth/requireAuthAction";
import { formatUserFullName, getUserDisplayName } from "@/lib/utils/userDisplay";

function GateShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-[#050507] text-white">
            <div className="mx-auto w-full max-w-[420px] px-4 py-12">
                <div className="rounded-2xl border border-white/15 bg-[#101018] p-4 text-sm text-white/70">{children}</div>
            </div>
        </main>
    );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [gate, setGate] = useState<"loading" | "allowed" | "denied" | "unauthenticated">("loading");
    const [adminName, setAdminName] = useState("Admin");
    const [adminPhone, setAdminPhone] = useState<string | undefined>();

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            if (!hasAuthenticatedSession()) {
                const search = typeof window !== "undefined" ? window.location.search : "";
                setAuthIntent({ type: "owner_list_property", nextPath: `${pathname || "/admin"}${search}` });
                if (mounted) setGate("unauthenticated");
                router.replace("/auth/login");
                return;
            }

            try {
                const [isAdmin, user] = await Promise.all([adminAdapter.isAdminUser(), userService.getUserDetails()]);
                if (!mounted) return;
                if (!isAdmin) {
                    setGate("denied");
                    return;
                }
                const fullName = formatUserFullName(user);
                setAdminName(getUserDisplayName(user, "Admin"));
                setAdminPhone(fullName ? user.phone || undefined : undefined);
                setGate("allowed");
            } catch {
                if (mounted) setGate("denied");
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, [pathname, router]);

    if (gate === "loading") {
        return <GateShell>Checking admin access...</GateShell>;
    }

    if (gate === "unauthenticated") {
        return <GateShell>Redirecting to login...</GateShell>;
    }

    if (gate === "denied") {
        return (
            <GateShell>
                <p className="text-base font-semibold text-white">Admin access required</p>
                <p className="mt-2">
                    Your account is not marked as staff. Ask a superuser to enable admin access in Django, then log in
                    again.
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="mt-4 rounded-xl border border-[#A67AEB]/60 bg-[#A67AEB]/20 px-4 py-2 text-sm font-semibold text-white"
                >
                    Go to home
                </button>
            </GateShell>
        );
    }

    return (
        <AdminShell adminName={adminName} adminPhone={adminPhone}>
            {children}
        </AdminShell>
    );
}
