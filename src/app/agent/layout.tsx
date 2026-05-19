"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { agentAdapter } from "@/lib/adapters";
import { setAuthIntent } from "@/lib/auth/authIntent";
import { hasAuthenticatedSession } from "@/lib/auth/requireAuthAction";

interface AgentLayoutProps {
    children: ReactNode;
}

function GateShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-[#050507] text-white">
            <div className="mx-auto w-full max-w-[420px] px-4 py-12">
                <div className="rounded-2xl border border-white/15 bg-[#101018] p-4 text-sm text-white/70">{children}</div>
            </div>
        </main>
    );
}

export default function AgentLayout({ children }: AgentLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [gate, setGate] = useState<"loading" | "allowed" | "denied" | "unauthenticated">("loading");

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            if (!hasAuthenticatedSession()) {
                const search = typeof window !== "undefined" ? window.location.search : "";
                setAuthIntent({ type: "owner_list_property", nextPath: `${pathname || "/agent"}${search}` });
                if (mounted) setGate("unauthenticated");
                router.replace("/auth/login");
                return;
            }

            try {
                const profile = await agentAdapter.getAgentProfile();
                if (!mounted) return;
                setGate(profile?.is_agent && profile.employee ? "allowed" : "denied");
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
        return <GateShell>Checking field agent access...</GateShell>;
    }

    if (gate === "unauthenticated") {
        return <GateShell>Redirecting to login...</GateShell>;
    }

    if (gate === "denied") {
        return (
            <GateShell>
                <p className="text-base font-semibold text-white">Field agent access required</p>
                <p className="mt-2">
                    Your account is not linked to a field agent profile yet. Ask admin to assign your login to a rental
                    employee record, then try again.
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/owner/dashboard")}
                    className="mt-4 rounded-xl border border-[#A67AEB]/60 bg-[#A67AEB]/20 px-4 py-2 text-sm font-semibold text-white"
                >
                    Go to owner dashboard
                </button>
            </GateShell>
        );
    }

    return <>{children}</>;
}
