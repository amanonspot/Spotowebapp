"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/components/Logo";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/components/admin/nav-items";
import { cn } from "@/lib/utils";

export function AdminMobileTopBar() {
    return (
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#09090f]/95 px-4 py-3 backdrop-blur lg:hidden">
            <Logo className="!w-[110px]" variant="light" />
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#A67AEB]">Admin Console</p>
        </header>
    );
}

export function AdminMobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-white/10 bg-[#111116] px-2 py-2 lg:hidden">
            {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isAdminNavActive(pathname, item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-white/50",
                            active && "bg-[#A67AEB]/15 text-[#A67AEB]"
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
