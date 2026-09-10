"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

export default function AgentListPropertySuccessPage() {
    const searchParams = useSearchParams();
    const propertyId = searchParams.get("property_id") || "";
    const ownerPhone = searchParams.get("owner_phone") || "";

    return (
        <main className="min-h-screen bg-[#050507] text-white">
            <div className="mx-auto w-full max-w-[420px] px-4 py-10">
                <div className="rounded-2xl border border-white/15 bg-[#101018] p-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#B7F041]/20 text-[#B7F041]">
                        <Check className="h-8 w-8" />
                    </div>
                    <h1 className="text-center text-2xl font-semibold">Listing is live</h1>
                    <p className="mt-3 text-center text-sm text-white/70">
                        The property is live on Spoto now. It is linked to the owner&apos;s phone number —
                        when they log in with OTP, it will appear on their owner dashboard.
                    </p>
                    {ownerPhone ? (
                        <p className="mt-4 rounded-xl border border-white/15 bg-[#0d0d14] px-4 py-3 text-center text-sm">
                            Owner mobile: <span className="font-semibold text-white">+91 {ownerPhone}</span>
                        </p>
                    ) : null}
                    {propertyId ? (
                        <p className="mt-2 text-center text-xs text-white/45">Reference: {propertyId}</p>
                    ) : null}
                    <div className="mt-6 flex flex-col gap-3">
                        <Link
                            href="/agent/list-property"
                            className="btn-shimmer flex items-center justify-center rounded-xl bg-[#A67AEB] px-6 py-3 text-center text-base font-semibold text-white"
                        >
                            Add another listing
                        </Link>
                        <Link
                            href="/agent/dashboard"
                            className="flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-center text-base font-semibold text-white/90"
                        >
                            Back to dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
