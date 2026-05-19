"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OwnerListingWizard from "@/components/owner/OwnerListingWizard";

export default function OwnerListPropertyPage() {
    const router = useRouter();
    const [checkingAgent, setCheckingAgent] = useState(true);

    useEffect(() => {
        let mounted = true;

        const check = async () => {
            try {
                const { agentAdapter } = await import("@/lib/adapters");
                const profile = await agentAdapter.getAgentProfile();
                if (!mounted) return;
                if (profile?.is_agent && profile.employee) {
                    router.replace("/agent/list-property");
                    return;
                }
            } catch {
                // Any error: fall through to normal owner listing
            } finally {
                if (mounted) setCheckingAgent(false);
            }
        };

        check();
        return () => {
            mounted = false;
        };
    }, [router]);

    if (checkingAgent) {
        return (
            <main className="min-h-screen bg-[#050507] text-white">
                <div className="mx-auto w-full max-w-[420px] px-4 py-12">
                    <div className="rounded-2xl border border-white/15 bg-[#101018] p-4 text-sm text-white/70">
                        Loading...
                    </div>
                </div>
            </main>
        );
    }

    return <OwnerListingWizard />;
}
