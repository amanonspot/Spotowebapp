"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut } from "lucide-react";

import Logo from "@/components/Logo";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/components/admin/nav-items";
import { clearMockSession } from "@/lib/adapters";
import { authService } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AdminSideNav({ adminName, adminPhone }: { adminName: string; adminPhone?: string }) {
    const pathname = usePathname();

    const logout = () => {
        clearMockSession();
        authService.logout();
        window.location.href = "/auth/login";
    };

    return (
        <aside className="sticky top-0 z-20 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#111116] px-4 py-6 lg:flex">
            <div className="flex flex-col items-start gap-1 px-2">
                <Link href="/" className="rounded-lg transition-opacity hover:opacity-90" aria-label="Back to Spoto home">
                    <Logo className="!w-[120px]" variant="light" />
                </Link>
                <p className="pl-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A67AEB]">Admin</p>
            </div>

            <nav className="mt-8 grid gap-1">
                {ADMIN_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isAdminNavActive(pathname, item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold text-white/55 transition-colors hover:bg-white/5 hover:text-white",
                                active && "bg-[#A67AEB]/15 text-[#A67AEB] hover:bg-[#A67AEB]/15 hover:text-[#A67AEB]"
                            )}
                        >
                            <Icon aria-hidden className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <Link
                href="/"
                className="mt-6 flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-3 text-sm font-semibold text-white/70 transition-colors hover:border-[#A67AEB]/40 hover:bg-[#A67AEB]/10 hover:text-white"
            >
                <Home className="h-4 w-4" aria-hidden />
                Back to Spoto
            </Link>

            <div className="mt-auto border-t border-white/10 pt-4">
                <p className="px-2 text-sm font-semibold text-white">{adminName}</p>
                {adminPhone ? <p className="px-2 text-xs text-white/50">{adminPhone}</p> : null}
                <button
                    type="button"
                    onClick={logout}
                    className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/55 transition-colors hover:bg-white/5 hover:text-white"
                >
                    <LogOut className="h-4 w-4" /> Log out
                </button>
            </div>
        </aside>
    );
}
