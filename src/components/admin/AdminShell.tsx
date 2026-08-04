"use client";

import { AdminMobileBottomNav, AdminMobileTopBar } from "@/components/admin/AdminMobileNav";
import { AdminSideNav } from "@/components/admin/AdminSideNav";

export function AdminShell({
    children,
    adminName,
    adminPhone,
}: {
    children: React.ReactNode;
    adminName: string;
    adminPhone?: string;
}) {
    return (
        <div className="min-h-screen overflow-x-hidden bg-[#050507] text-white lg:flex">
            <AdminSideNav adminName={adminName} adminPhone={adminPhone} />
            <div className="flex min-w-0 flex-1 flex-col">
                <AdminMobileTopBar />
                <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 overflow-x-hidden px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
                    {children}
                </main>
                <AdminMobileBottomNav />
            </div>
        </div>
    );
}
