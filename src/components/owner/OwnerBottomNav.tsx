"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

export default function OwnerBottomNav() {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
        { id: "dashboard", label: "Dashboard", path: "/owner/dashboard" },
        { id: "list", label: "List", path: "/owner/list-property" },
        { id: "contacts", label: "Contacts", path: "/owner/contacts" },
        { id: "home", label: "Home", path: "/" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#101018]/95 backdrop-blur md:static md:border md:rounded-2xl md:max-w-[420px] md:mx-auto md:mt-6">
            <div className="grid grid-cols-4">
                {navItems.map((item) => {
                    const active = pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => router.push(item.path)}
                            className={`px-2 py-3 text-xs font-semibold transition-colors ${
                                active
                                    ? "text-[#B7F041]"
                                    : "text-white/80 hover:text-white active:text-[#B7F041]"
                            }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

