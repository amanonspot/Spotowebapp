"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/components/BottomNavigation";
import { UnlockedContactRecord, getUnlockedTenantContacts } from "@/lib/rentals";

export default function TenantContactsPage() {
    const router = useRouter();
    const [contacts, setContacts] = useState<UnlockedContactRecord[]>([]);

    useEffect(() => {
        setContacts(getUnlockedTenantContacts());
    }, []);

    return (
        <main className="min-h-screen bg-[#040405] pb-24 text-white">
            <div className="mx-auto max-w-5xl px-4 py-4 md:px-6">
                <header className="mb-5 rounded-2xl border border-white/15 bg-[#101018] p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-2xl font-semibold">Owner Contacts</h1>
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="rounded-full border border-white/25 px-3 py-1 text-sm text-white/80 hover:text-white"
                        >
                            Home
                        </button>
                    </div>
                    <p className="mt-1 text-sm text-white/70">
                        Contacts unlocked from property detail flow are listed here.
                    </p>
                </header>

                {contacts.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-4 text-white/70">
                        No contacts unlocked yet. Visit a property and unlock contact details.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {contacts.map((contact) => (
                            <article key={contact.id} className="rounded-2xl border border-[#A67AEB]/40 bg-[#101019] p-4">
                                <h2 className="text-lg font-semibold">{contact.name}</h2>
                                <p className="mt-1 text-sm text-white/70">Property: {contact.propertyId}</p>
                                <p className="mt-2 text-sm">{contact.phone}</p>
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
            <BottomNavigation activeTab="contacts" />
        </main>
    );
}
