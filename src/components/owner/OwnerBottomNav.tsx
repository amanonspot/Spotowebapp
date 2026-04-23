"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Ticket } from "lucide-react";

export default function OwnerBottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        { id: "dashboard", label: "Dashboard", path: "/owner/dashboard", icon: Home },
        { id: "search", label: "Search", path: "/search", icon: Search },
        { id: "contacts", label: "Contacts", path: "/owner/contacts", icon: Ticket },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#101018]/95 px-4 py-3 backdrop-blur-md md:static md:mx-auto md:mt-6 md:max-w-[420px] md:rounded-2xl md:border">
            <div className="mx-auto grid max-w-[420px] grid-cols-3 rounded-2xl border border-white/10 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => router.push(item.path)}
                            className={`flex items-center justify-center rounded-xl px-2 py-3 transition-all ${
                                active
                                    ? "bg-white/10 text-[#A67AEB]"
                                    : "text-white/70 hover:text-white active:scale-[0.98]"
                            }`}
                            aria-label={item.label}
                        >
                            <Icon className="h-5 w-5" />
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
