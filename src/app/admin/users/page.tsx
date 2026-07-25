"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ExternalLink, IndianRupee, LogIn, Search, UserPlus, Users } from "lucide-react";
import toast from "react-hot-toast";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminMiniTrendChart } from "@/components/admin/AdminMiniTrendChart";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { adminAdapter } from "@/lib/adapters/adminAdapter";
import { AdminUserRowDto, AdminUsersStatsDto } from "@/lib/rentals/wireTypes";

const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
};

function RoleBadges({ user }: { user: AdminUserRowDto }) {
    return (
        <div className="flex flex-wrap gap-1">
            {user.is_staff ? (
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-red-200">Admin</span>
            ) : null}
            {user.is_agent ? (
                <span className="rounded-full bg-[#A67AEB]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#D4B0FF]">Agent</span>
            ) : null}
            {user.is_owner ? (
                <span className="rounded-full bg-[#b7f041]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#b7f041]">Owner</span>
            ) : null}
            {!user.is_staff && !user.is_agent && !user.is_owner ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/55">Tenant</span>
            ) : null}
        </div>
    );
}

export default function AdminUsersPage() {
    const [stats, setStats] = useState<AdminUsersStatsDto | null>(null);
    const [users, setUsers] = useState<AdminUserRowDto[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (pageNum: number, query: string, append = false) => {
        setLoading(true);
        try {
            const [statsData, listData] = await Promise.all([
                append ? Promise.resolve(null) : adminAdapter.getUsersStats(),
                adminAdapter.listUsers({ page: pageNum, page_size: 25, search: query || undefined }),
            ]);
            if (statsData) setStats(statsData);
            setUsers((prev) => (append ? [...prev, ...listData.users] : listData.users));
            setHasMore(listData.hasMore);
            setPage(listData.page);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to load users.");
            setStats(null);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(1, search);
    }, [load, search]);

    const funnel = stats?.funnel_30d;

    return (
        <>
            <header className="pb-5">
                <p className="text-sm font-medium text-white/55">Growth & activity</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Users</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/55">
                    Signups, logins, unlocks and pass purchases from your database. For page-level clicks and funnels, use{" "}
                    <a
                        href="https://analytics.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#b7f041] hover:underline"
                    >
                        Google Analytics <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    .
                </p>
            </header>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <AdminStatCard label="Total users" value={stats?.total_users ?? "—"} icon={Users} accent="purple" />
                <AdminStatCard label="New today" value={stats?.new_users_today ?? "—"} icon={UserPlus} accent="green" />
                <AdminStatCard label="New (7d)" value={stats?.new_users_7d ?? "—"} icon={UserPlus} accent="purple" />
                <AdminStatCard label="Active (7d)" value={stats?.active_users_7d ?? "—"} icon={Activity} accent="green" />
                <AdminStatCard label="Unlocks (7d)" value={stats?.unlocks_7d ?? "—"} icon={LogIn} accent="amber" />
                <AdminStatCard
                    label="Pass revenue"
                    value={stats ? `₹${Math.round(stats.pass_revenue_inr).toLocaleString("en-IN")}` : "—"}
                    icon={IndianRupee}
                    accent="green"
                />
            </section>

            {funnel ? (
                <section className="mt-6">
                    <h2 className="mb-3 text-lg font-bold text-white">30-day funnel</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: "Signups", value: funnel.signups },
                            { label: "Logged in", value: funnel.logged_in },
                            { label: "Unlocked contact", value: funnel.unlocked_contact },
                            { label: "Bought pass", value: funnel.bought_pass },
                        ].map((step) => (
                            <AdminCard key={step.label} className="p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{step.label}</p>
                                <p className="mt-2 text-3xl font-bold text-white">{step.value}</p>
                            </AdminCard>
                        ))}
                    </div>
                </section>
            ) : null}

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
                <AdminMiniTrendChart title="New signups" points={stats?.signup_trend ?? []} accent="green" />
                <AdminMiniTrendChart title="Logins (tracked)" points={stats?.login_trend ?? []} accent="purple" />
            </section>

            <section className="mt-8">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-bold text-white">All users</h2>
                    <div className="relative max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search phone or name"
                            className="h-11 w-full rounded-xl border border-white/15 bg-[#0d0d14] pl-10 pr-3 text-sm text-white placeholder:text-white/35 focus:border-[#A67AEB]/50 focus:outline-none"
                        />
                    </div>
                </div>

                {loading ? (
                    <AdminCard className="text-center text-sm text-white/55">Loading users…</AdminCard>
                ) : users.length === 0 ? (
                    <AdminCard className="text-center text-sm text-white/55">No users found.</AdminCard>
                ) : (
                    <AdminCard className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="border-b border-white/10 bg-[#0d0d14] text-white/55">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">User</th>
                                        <th className="px-4 py-3 font-semibold">Role</th>
                                        <th className="px-4 py-3 font-semibold">Joined</th>
                                        <th className="px-4 py-3 font-semibold">Last login</th>
                                        <th className="px-4 py-3 font-semibold">Activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-white/5 last:border-0">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-white">{user.display_name}</p>
                                                <p className="text-xs text-white/45">{user.phone || user.email || user.id.slice(0, 8)}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <RoleBadges user={user} />
                                            </td>
                                            <td className="px-4 py-3 text-white/65">{formatDate(user.date_joined)}</td>
                                            <td className="px-4 py-3 text-white/65">{formatDate(user.last_login)}</td>
                                            <td className="px-4 py-3 text-xs text-white/55">
                                                <p>{user.login_count} logins</p>
                                                <p>{user.unlocks_count} unlocks · {user.pass_purchases_count} passes</p>
                                                <p>{user.listings_count} listings</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </AdminCard>
                )}

                {hasMore ? (
                    <button
                        type="button"
                        onClick={() => load(page + 1, search, true)}
                        className="mt-4 w-full rounded-xl border border-white/15 py-3 text-sm font-semibold text-white/70 hover:bg-white/5"
                    >
                        Load more
                    </button>
                ) : null}
            </section>
        </>
    );
}
