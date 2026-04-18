"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OwnerBottomNav from "@/components/owner/OwnerBottomNav";
import { getOwnerUnlockedContacts } from "@/lib/adapters";
import { UnlockedContactRecord } from "@/lib/rentals";

export default function OwnerContactsPage() {
    const router = useRouter();
    const [contacts, setContacts] = useState<UnlockedContactRecord[]>([]);

    useEffect(() => {
        setContacts(getOwnerUnlockedContacts());
    }, []);

    return (
        <main className="min-h-screen bg-[#050507] pb-24 text-white">
            <div className="mx-auto max-w-4xl px-4 py-4 md:px-6">
                <header className="mb-4 rounded-2xl border border-white/15 bg-[#101018] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-2xl font-semibold">Unlocked Tenant Contacts</h1>
                        <button
                            type="button"
                            onClick={() => router.push("/owner/dashboard")}
                            className="rounded-full border border-white/25 px-3 py-1 text-sm text-white/80 hover:text-white"
                        >
                            Dashboard
                        </button>
                    </div>
                    <p className="mt-1 text-sm text-white/70">
                        Contacts unlocked from owner leads appear here.
                    </p>
                </header>

                {contacts.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-4 text-white/70">
                        No unlocked tenant contacts yet. Unlock leads from owner dashboard.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {contacts.map((contact) => (
                            <article key={contact.id} className="rounded-2xl border border-[#A67AEB]/40 bg-[#101019] p-4">
                                <h2 className="text-lg font-semibold">{contact.name}</h2>
                                <p className="mt-1 text-sm text-white/70">Property: {contact.propertyId}</p>
                                <p className="mt-1 text-sm text-white/90">{contact.phone}</p>
                                <p className="mt-1 text-xs text-white/50">
                                    Unlocked: {new Date(contact.unlockedAt).toLocaleString("en-IN")}
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <a
                                        href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-xl bg-[#A67AEB] px-3 py-2 text-sm font-semibold"
                                    >
                                        WhatsApp
                                    </a>
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="rounded-xl border border-[#A67AEB] px-3 py-2 text-sm font-semibold"
                                    >
                                        Call
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <OwnerBottomNav />
        </main>
    );
}
