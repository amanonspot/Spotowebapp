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
        <div className="min-h-screen bg-[#050507] text-white">
            <AdminSideNav adminName={adminName} adminPhone={adminPhone} />
            <AdminMobileTopBar />
            <div className="lg:pl-64">
                <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
                    {children}
                </main>
            </div>
            <AdminMobileBottomNav />
        </div>
    );
}
