"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Rocket, ShieldX, Users, UserX } from "lucide-react";

import { AdminListingsTable } from "@/components/admin/AdminListingsTable";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { adminAdapter, AdminDashboardStats } from "@/lib/adapters/adminAdapter";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [recent, setRecent] = useState<Awaited<ReturnType<typeof adminAdapter.listListings>>["listings"]>([]);

    useEffect(() => {
        adminAdapter.getDashboardStats().then(setStats).catch(() => setStats(null));
        adminAdapter
            .listListings({ verification_status: "in_review", page: 1, page_size: 5 })
            .then((result) => setRecent(result.listings))
            .catch(() => setRecent([]));
    }, []);

    const firstName = "Admin";

    return (
        <>
            <header className="pb-5">
                <p className="text-sm font-medium text-white/55">Hello {firstName}</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Admin dashboard</h1>
            </header>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                <AdminStatCard label="Pending review" value={stats?.pendingReview ?? "—"} icon={ClipboardCheck} accent="amber" />
                <AdminStatCard label="Live listings" value={stats?.live ?? "—"} icon={Rocket} accent="purple" />
                <AdminStatCard label="Rejected" value={stats?.rejected ?? "—"} icon={ShieldX} accent="amber" />
                <AdminStatCard label="Awaiting owner" value={stats?.awaitingOwner ?? "—"} icon={UserX} accent="purple" />
                <AdminStatCard label="Active agents" value={stats?.activeAgents ?? "—"} icon={Users} accent="green" />
            </section>

            <section className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Recent pending listings</h2>
                    <Link className="text-sm font-semibold text-[#b7f041]" href="/admin/listings">
                        View all
                    </Link>
                </div>
                <AdminListingsTable rows={recent} />
            </section>
        </>
    );
}
